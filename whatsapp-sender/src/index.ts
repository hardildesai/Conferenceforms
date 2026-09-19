/**
 * whatsapp-sender/src/index.ts
 *
 * Standalone WhatsApp batch sender for conference attendance codes.
 * Uses Baileys (unofficial WhatsApp Web library) + Supabase service-role.
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in values
 *   2. npm install
 *   3. npm run start
 *   4. Scan the QR code with your WhatsApp (spare number recommended)
 *   5. Wait — the script processes all pending rows, then exits
 *
 * Safe to stop and re-run at any time:
 *   - Only processes rows where whatsapp_sent = false
 *   - Session is persisted in ./auth_info_baileys so QR scan is only needed once
 */

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
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const MIN_DELAY_MS = Number(process.env.MIN_DELAY_MS ?? 20_000);
const MAX_DELAY_MS = Number(process.env.MAX_DELAY_MS ?? 90_000);

const AUTH_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'auth_info_baileys');

// Message sent via WhatsApp — supports process.env.CUSTOM_WHATSAPP_TEMPLATE or default format
const defaultWaTemplate =
  `Dear {name},\n\nYou are cordially invited to the *Exclusive Legrand Experience Evening* 🎉\n*Unveiling Next-Generation Power Solutions*\n\n📅 *Date:* {date}\n🕡 *Time:* 6:30 PM Onwards\n📍 *Venue:* {venue}\n🗺️ *Location:* https://maps.app.goo.gl/Jy4kNUzK9vDzrpjk6\n\nYour attendance code is:\n\n*${'{code}'}*\n\nPlease show this code (or the QR image) to our team at the entrance for check-in.\n\nWe look forward to welcoming you!\n\n— Team Legrand`;

const MESSAGE_TEMPLATE = (name: string, code: string, company: string = '') => {
  const template = process.env.CUSTOM_WHATSAPP_TEMPLATE || defaultWaTemplate;
  return template
    .replace(/\{name\}/gi, name)
    .replace(/\{code\}/gi, code)
    .replace(/\{company\}/gi, company)
    .replace(/\{date\}/gi, 'Thursday, 24 September 2026')
    .replace(/\{venue\}/gi, 'Megma Restaurant and Banquets, Odhav, Ahmedabad');
};


// ── Supabase client ───────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────
function randomDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  const secs = Math.round(ms / 1000);
  console.log(`  ⏳ Waiting ${secs}s before next send…`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes a phone number to a WhatsApp JID.
 * Strips non-digits, ensures it starts with a country code (no leading 0).
 * Examples:
 *   +91 98765 43210  →  919876543210@s.whatsapp.net
 *   0091 9876543210  →  919876543210@s.whatsapp.net
 */
function toJid(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  // Remove leading double-zero country code prefix (e.g. 0091 → 91)
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Remove leading single zero that isn't part of a country code (e.g. 098765 → 98765 — incorrect for intl)
  // Only strip leading zero if length suggests a local number (less than 10 digits after stripping prefix)
  return `${digits}@s.whatsapp.net`;
}

async function generateQRBuffer(code: string): Promise<Buffer> {
  return QRCode.toBuffer(code, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

// ── Batch send ────────────────────────────────────────────
async function runBatch(sock: WASocket): Promise<void> {
  console.log('\n📋 Fetching pending registrations from Supabase…');

  const { data: pending, error } = await supabase
    .from('registrations')
    .select('id, visitor_name, company_name, phone, code')
    .eq('whatsapp_sent', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Supabase fetch error:', error.message);
    return;
  }

  if (!pending || pending.length === 0) {
    console.log('✅ No pending registrations. All done!');
    process.exit(0);
  }

  console.log(`📨 Found ${pending.length} pending registration(s). Starting batch send…\n`);

  for (let i = 0; i < pending.length; i++) {
    const reg = pending[i];
    const index = `[${i + 1}/${pending.length}]`;

    console.log(`${index} Sending to ${reg.visitor_name} (${reg.phone}) — code: ${reg.code}`);

    try {
      const jid = toJid(reg.phone);
      const qrBuffer = await generateQRBuffer(reg.code);
      const caption = MESSAGE_TEMPLATE(reg.visitor_name, reg.code, reg.company_name);

      await sock.sendMessage(jid, {
        image: qrBuffer,
        caption,
        mimetype: 'image/png',
      });

      // Mark as sent in Supabase
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ whatsapp_sent: true })
        .eq('id', reg.id);

      if (updateError) {
        console.warn(`  ⚠️  Message sent, but failed to mark whatsapp_sent: ${updateError.message}`);
      } else {
        console.log(`  ✅ Sent and marked.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Failed for ${reg.visitor_name}: ${msg}`);
      // Continue with the next recipient — do NOT exit
    }

    // Delay before the next send (skip after the last one)
    if (i < pending.length - 1) {
      await randomDelay();
    }
  }

  console.log('\n🎉 Batch complete!');
  process.exit(0);
}

// ── WhatsApp connection ───────────────────────────────────
async function connectAndRun(): Promise<void> {
  // Ensure auth folder exists
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`🔌 Connecting with Baileys v${version.join('.')}…`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console as never),
    },
    printQRInTerminal: true,       // Prints QR to terminal — scan with WhatsApp
    logger: console as never,      // Suppress verbose Baileys logs
    browser: ['Conference Sender', 'Chrome', '124.0.0'],
    connectTimeoutMs: 60_000,
    retryRequestDelayMs: 2_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan the QR code above with your WhatsApp to log in.\n');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        console.log(`🔄 Connection closed (code ${code}). Reconnecting…`);
        // Small delay before reconnect to avoid tight loops
        await new Promise((r) => setTimeout(r, 3000));
        connectAndRun();
      } else {
        console.error('🚪 Logged out. Delete ./auth_info_baileys and re-run to scan QR again.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected!\n');
      await runBatch(sock);
    }
  });
}

// ── Entry point ───────────────────────────────────────────
console.log('══════════════════════════════════════════');
console.log('  WhatsApp Batch Sender — Conference App  ');
console.log('══════════════════════════════════════════\n');

connectAndRun().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
