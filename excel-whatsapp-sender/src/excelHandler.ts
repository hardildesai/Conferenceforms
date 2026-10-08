import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ExcelRow, RecipientRecord } from './types.js';

/**
 * Clean phone numbers to WhatsApp JID format (digits only + @s.whatsapp.net).
 * E.g. "+91 98765-43210" -> "919876543210@s.whatsapp.net"
 */
export function toJid(phone: any): string {
  if (phone === undefined || phone === null) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Default country code check if missing (assuming 10-digit Indian numbers default to prefix 91)
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits ? `${digits}@s.whatsapp.net` : '';
}

/**
 * Finds column header for phone numbers automatically or uses preferred header.
 */
export function detectPhoneColumn(sampleRow: ExcelRow, preferredHeader?: string): string {
  if (preferredHeader && sampleRow[preferredHeader] !== undefined) {
    return preferredHeader;
  }

  const phoneAliases = ['phone', 'mobile', 'whatsapp', 'contact', 'number', 'phone_number', 'mobile_number', 'cell'];
  const keys = Object.keys(sampleRow);

  for (const key of keys) {
    const cleanKey = key.trim().toLowerCase();
    if (phoneAliases.includes(cleanKey)) {
      return key;
    }
  }

  // Fallback: look for partial match
  for (const key of keys) {
    const cleanKey = key.trim().toLowerCase();
    if (phoneAliases.some((alias) => cleanKey.includes(alias))) {
      return key;
    }
  }

  // Default to first key if nothing matched
  return keys[0] || '';
}

export class ExcelManager {
  private filePath: string;
  private sheetName: string;
  public workbook: xlsx.WorkBook;
  public rows: ExcelRow[];
  public phoneColumnHeader: string = '';

  constructor(filePath: string, preferredSheetName?: string, preferredPhoneHeader?: string) {
    this.filePath = path.resolve(filePath);
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Excel file not found at path: ${this.filePath}`);
    }

    this.workbook = xlsx.readFile(this.filePath);
    this.sheetName = preferredSheetName || this.workbook.SheetNames[0];

    if (!this.sheetName || !this.workbook.Sheets[this.sheetName]) {
      throw new Error(`Sheet "${this.sheetName}" not found in ${this.filePath}`);
    }

    const worksheet = this.workbook.Sheets[this.sheetName];
    this.rows = xlsx.utils.sheet_to_json<ExcelRow>(worksheet, { defval: '' });

    if (this.rows.length > 0) {
      this.phoneColumnHeader = detectPhoneColumn(this.rows[0], preferredPhoneHeader);
    }
  }

  /**
   * Get all rows that need WhatsApp message sending.
   */
  public getPendingRecipients(sendToAll: boolean = false): RecipientRecord[] {
    const recipients: RecipientRecord[] = [];

    this.rows.forEach((row, index) => {
      // Admin dashboard export format uses 'WhatsApp Sent' (Yes / No)
      const rawStatus = String(
        row['WhatsApp Sent'] ?? row['WhatsApp_Status'] ?? row['Status'] ?? row['whatsapp_sent'] ?? ''
      ).trim().toUpperCase();
      
      const rawPhone = row[this.phoneColumnHeader];
      const jid = toJid(rawPhone);

      const isSent = rawStatus === 'YES' || rawStatus === 'SENT' || rawStatus === 'TRUE';

      if (!sendToAll && isSent) {
        return; // Skip already sent
      }

      if (!rawPhone || !jid) {
        console.warn(`  ⚠️ Row ${index + 2}: Missing or invalid phone number (${rawPhone}). Skipping.`);
        return;
      }

      recipients.push({
        rowIndex: index,
        phone: String(rawPhone).trim(),
        formattedJid: jid,
        data: row,
        status: rawStatus,
      });
    });

    return recipients;
  }

  /**
   * Updates the status of a specific row in the Excel sheet and saves to disk.
   */
  public updateRowStatus(rowIndex: number, status: 'SENT' | 'FAILED', errorMsg?: string): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) return;

    // Match Admin Dashboard Export format: 'WhatsApp Sent' = 'Yes' / 'No'
    this.rows[rowIndex]['WhatsApp Sent'] = status === 'SENT' ? 'Yes' : 'No';
    this.rows[rowIndex]['WhatsApp_Status'] = status;
    this.rows[rowIndex]['Sent_At'] = new Date().toLocaleString();
    if (errorMsg) {
      this.rows[rowIndex]['WhatsApp_Error'] = errorMsg;
    } else {
      delete this.rows[rowIndex]['WhatsApp_Error'];
    }

    // Convert back to sheet and write to file
    const newWorksheet = xlsx.utils.json_to_sheet(this.rows);
    this.workbook.Sheets[this.sheetName] = newWorksheet;
    xlsx.writeFile(this.workbook, this.filePath);
  }
}
