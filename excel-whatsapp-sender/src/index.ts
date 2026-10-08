import 'dotenv/config';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

import { ExcelManager } from './excelHandler.js';
import { RecipientRecord } from './types.js';

const logger = pino({ level: 'silent' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_FOLDER = path.join(__dirname, '..', 'auth_info_baileys');
const TEMPLATE_FILE = path.join(__dirname, '..', 'template.txt');

// ── Environment Configuration ─────────────────────────────
const EXCEL_FILE_PATH = process.env.EXCEL_FILE_PATH || 'contacts.xlsx';
const EXCEL_SHEET_NAME = process.env.EXCEL_SHEET_NAME || undefined;
const PHONE_COLUMN = process.env.PHONE_COLUMN || undefined;
const MIN_DELAY_MS = Number(process.env.MIN_DELAY_MS ?? 15_000);
const MAX_DELAY_MS = Number(process.env.MAX_DELAY_MS ?? 45_000);
const SEND_TO_ALL = process.env.SEND_TO_ALL === 'true';
const GENERATE_QR_CODE = process.env.GENERATE_QR_CODE !== 'false';

// Helper to ask confirmation in terminal
function askConfirmation(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === '' || trimmed === 'y' || trimmed === 'yes');
    });
  });
}

function getTemplate(): string {
  if (fs.existsSync(TEMPLATE_FILE)) {
    const text = fs.readFileSync(TEMPLATE_FILE, 'utf-8').trim();
    if (text) return text;
  }
  const defaultTemplate =
    `Hello {Name},\n\nThis is a notification for your registration.\nYour code is: *{Code}*\n\nThank you!`;
  fs.writeFileSync(TEMPLATE_FILE, defaultTemplate, 'utf-8');
  return defaultTemplate;
}

/**
 * Replace placeholders in template like {Name}, {visitor_name}, {Company}, {Code} with Excel row values.
 */
function compileMessage(template: string, row: Record<string, any>): string {
  let message = template;

  const visitorName = row['Name'] ?? row['visitor_name'] ?? row['Visitor Name'] ?? '';
  const companyName = row['Company'] ?? row['company_name'] ?? row['Company Name'] ?? '';
  const code = row['Code'] ?? row['code'] ?? row['attendance_code'] ?? '';
  const designation = row['Designation'] ?? row['designation'] ?? '';

  // Standard substitutions matching admin dashboard substitutePlaceholders
  message = message
    .replace(/\{name\}/gi, visitorName)
    .replace(/\{visitor_name\}/gi, visitorName)
    .replace(/\{company\}/gi, companyName)
    .replace(/\{company_name\}/gi, companyName)
    .replace(/\{code\}/gi, code)
    .replace(/\{designation\}/gi, designation)
    .replace(/\{date\}/gi, 'Thursday, 24 September 2026')
    .replace(/\{venue\}/gi, 'Megma Restaurant and Banquets, Odhav, Ahmedabad')
    .replace(/\{maps_link\}/gi, 'https://maps.app.goo.gl/Jy4kNUzK9vDzrpjk6');

  // Replace any direct column header matches (e.g. {Email}, {Phone})
  Object.keys(row).forEach((key) => {
    const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
    const regex = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'gi');
    message = message.replace(regex, val);
  });

  return message;
}

async function generateQRBuffer(code: string): Promise<Buffer> {
  return QRCode.toBuffer(code, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

function randomDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  const secs = Math.round(ms / 1000);
  console.log(`  ⏳ Delaying ${secs}s before next message…`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ATTACHMENT_FILE_PATH = process.env.ATTACHMENT_FILE_PATH || undefined;

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

// ── Batch Send Logic ──────────────────────────────────────
async function processBatch(sock: WASocket, excelMgr: ExcelManager): Promise<void> {
  const pending = excelMgr.getPendingRecipients(SEND_TO_ALL);

  if (pending.length === 0) {
    console.log('\n✅ No pending rows found in Excel sheet! All contacts have already been sent.');
    process.exit(0);
  }

  const template = getTemplate();
  const sampleRecipient = pending[0];
  const sampleMessage = compileMessage(template, sampleRecipient.data);

  let attachmentInfo = 'None (Text Only)';
  if (ATTACHMENT_FILE_PATH && fs.existsSync(path.resolve(ATTACHMENT_FILE_PATH))) {
    attachmentInfo = `Custom File (${path.basename(ATTACHMENT_FILE_PATH)}) + Text Caption`;
  } else if (GENERATE_QR_CODE) {
    attachmentInfo = 'Dynamic QR Code Image + Text Caption';
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(` 📢 EXCEL WHATSAPP BATCH PREVIEW`);
  console.log(` • Excel File: ${EXCEL_FILE_PATH}`);
  console.log(` • Detected Phone Column: "${excelMgr.phoneColumnHeader}"`);
  console.log(` • Mode: ${SEND_TO_ALL ? 'SEND ALL ROWS' : 'PENDING ROWS ONLY'}`);
  console.log(` • Attachment Mode: ${attachmentInfo}`);
  console.log(` • Recipients to send: ${pending.length}`);
  console.log(` • Safety Delay: ${Math.round(MIN_DELAY_MS / 1000)}s - ${Math.round(MAX_DELAY_MS / 1000)}s`);
  console.log('──────────────────────────────────────────────────────────');
  console.log(` 📝 SAMPLE MESSAGE FOR: ${sampleRecipient.phone}`);
  console.log(sampleMessage.split('\n').map((l) => '    | ' + l).join('\n'));
  console.log('══════════════════════════════════════════════════════════\n');

  const confirm = await askConfirmation('👉 Press [ENTER] or type "y" to START sending, or "n" to cancel: ');

  if (!confirm) {
    console.log('\n❌ Operation cancelled by user. No messages were sent.');
    process.exit(0);
  }

  console.log(`\n🚀 Starting batch execution for ${pending.length} recipient(s)…\n`);

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const itemIndex = `[${i + 1}/${pending.length}]`;
    const messageContent = compileMessage(template, item.data);

    console.log(`${itemIndex} Sending to ${item.phone} (Row ${item.rowIndex + 2})…`);

    try {
      const rowAttachment = item.data['Attachment'] || item.data['attachment'] || item.data['Image_Path'] || item.data['image_path'];
      const globalAttachment = ATTACHMENT_FILE_PATH && fs.existsSync(path.resolve(ATTACHMENT_FILE_PATH))
        ? path.resolve(ATTACHMENT_FILE_PATH)
        : null;

      const fileToAttach = rowAttachment
        ? path.resolve(String(rowAttachment))
        : globalAttachment;

      const codeVal = item.data['Code'] || item.data['code'] || item.data['attendance_code'];

      if (fileToAttach && fs.existsSync(fileToAttach)) {
        const mimeType = getMimeType(fileToAttach);
        const buffer = fs.readFileSync(fileToAttach);

        if (mimeType.startsWith('image/')) {
          await sock.sendMessage(item.formattedJid, {
            image: buffer,
            caption: messageContent,
            mimetype: mimeType,
          });
        } else {
          await sock.sendMessage(item.formattedJid, {
            document: buffer,
            caption: messageContent,
            mimetype: mimeType,
            fileName: path.basename(fileToAttach),
          });
        }
      } else if (GENERATE_QR_CODE && codeVal) {
        const qrBuffer = await generateQRBuffer(String(codeVal));
        await sock.sendMessage(item.formattedJid, {
          image: qrBuffer,
          caption: messageContent,
          mimetype: 'image/png',
        });
      } else {
        await sock.sendMessage(item.formattedJid, {
          text: messageContent,
        });
      }

      // Mark row as SENT in Excel sheet
      excelMgr.updateRowStatus(item.rowIndex, 'SENT');
      console.log(`  ✅ Message sent with attachment/caption and row marked SENT in Excel.`);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Failed for ${item.phone}: ${errMsg}`);
      excelMgr.updateRowStatus(item.rowIndex, 'FAILED', errMsg);
    }

    if (i < pending.length - 1) {
      await randomDelay();
    }
  }

  console.log('\n🎉 Batch process complete! All statuses updated in Excel sheet.');
  process.exit(0);
}

// ── Connection Logic ──────────────────────────────────────
async function startApp(): Promise<void> {
  const fullPath = path.resolve(EXCEL_FILE_PATH);
  if (!fs.existsSync(fullPath)) {
    console.error(`\n❌ Excel file not found at: ${fullPath}`);
    console.error(`👉 Tip: Run "npm run create-sample" to create a demo "contacts.xlsx" file.`);
    process.exit(1);
  }

  const excelMgr = new ExcelManager(fullPath, EXCEL_SHEET_NAME, PHONE_COLUMN);
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`🔌 Initializing Baileys v${version.join('.')} WhatsApp connection…`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as never),
    },
    logger: logger as never,
    browser: ['Excel WhatsApp Sender', 'Chrome', '124.0.0'],
    connectTimeoutMs: 60_000,
    retryRequestDelayMs: 2_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan the QR code below using WhatsApp (Linked Devices):\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log(`🔄 Connection interrupted. Reconnecting…`);
        await new Promise((r) => setTimeout(r, 3000));
        startApp();
      } else {
        console.error('🚪 Session logged out. Delete "auth_info_baileys" folder to log in again.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp successfully connected!');
      await processBatch(sock, excelMgr);
    }
  });
}

// ── Entry Point ───────────────────────────────────────────
console.log('══════════════════════════════════════════════════════════');
console.log('   Excel WhatsApp Message Sender (Baileys Engine)         ');
console.log('══════════════════════════════════════════════════════════\n');

startApp().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
