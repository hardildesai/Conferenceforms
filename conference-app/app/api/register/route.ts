// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendConfirmationEmail } from '@/lib/email';
import type { Registration } from '@/types/database';
import QRCode from 'qrcode';

// ── Helpers ──────────────────────────────────────────────

function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return digits;
}

function generateCode(): string {
  // Cryptographically random 6-digit number (100000–999999)
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

function isValidEmail(email: string): boolean {
  const clean = email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(clean)) return false;
  if (clean.includes('..') || clean.startsWith('.') || clean.endsWith('.')) return false;
  return true;
}

function isValidPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }
  return digits.length >= 10 && digits.length <= 15;
}

export async function POST() {
  return NextResponse.json(
    { error: 'Registration for this event has concluded.' },
    { status: 403 }
  );
}
