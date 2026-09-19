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

// ── POST /api/register ───────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { company_name, visitor_name, designation, email, phone } = body as Record<string, string>;

  // ── Validation ─────────────────────────────────────────
  const errors: Record<string, string> = {};
  if (!company_name?.trim()) errors.company_name = 'Company name is required';
  if (!visitor_name?.trim()) errors.visitor_name = 'Visitor name is required';
  if (!designation?.trim()) errors.designation = 'Designation is required';
  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address (e.g. name@domain.com)';
  }
  if (!phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Please enter a valid 10-digit mobile number';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const supabase = createServerSupabaseClient();

  // ── Duplicate Check ──────────────────────────────────────
  const normalizedPhone = normalizePhoneDigits(phone);
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = visitor_name.trim().toLowerCase();

  const { data: existingRecords } = await supabase
    .from('registrations')
    .select('visitor_name, email, phone');

  if (existingRecords && existingRecords.length > 0) {
    let phoneExists = false;
    let emailExists = false;

    for (const rec of existingRecords) {
      const recPhone = normalizePhoneDigits(rec.phone);
      const recEmail = rec.email.trim().toLowerCase();
      const recName = rec.visitor_name.trim().toLowerCase();

      if (recPhone === normalizedPhone || (recPhone === normalizedPhone && recName === cleanName)) {
        phoneExists = true;
      }
      if (recEmail === cleanEmail) {
        emailExists = true;
      }
    }

    if (phoneExists) {
      errors.phone = 'This phone number already exists in registrations.';
    }
    if (emailExists) {
      errors.email = 'This email address is already registered.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }
  }

  // ── Unique code generation with collision retry ─────────
  let code: string = '';
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateCode();
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('code', candidate)
      .maybeSingle();

    if (!existing) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Could not generate a unique code. Please try again.' },
      { status: 500 }
    );
  }

  // ── Insert registration row ─────────────────────────────
  const { data: rawRegistration, error: insertError } = await supabase
    .from('registrations')
    .insert({
      company_name: company_name.trim(),
      visitor_name: visitor_name.trim(),
      designation: designation.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      code,
      email_sent: false,
      whatsapp_sent: false,
      attended: false,
      attended_at: null,
    })
    .select()
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registration = rawRegistration as Registration | null;

  if (insertError || !registration) {
    console.error('Insert error:', insertError);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  // ── Generate QR code ────────────────────────────────────
  let qrBuffer: Buffer;
  try {
    qrBuffer = await QRCode.toBuffer(code, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (qrErr) {
    console.error('QR generation error:', qrErr);
    // Non-fatal: continue without the QR image
    qrBuffer = Buffer.alloc(0);
  }

  // ── Send confirmation email ─────────────────────────────
  try {
    await sendConfirmationEmail({
      to: registration.email,
      visitorName: registration.visitor_name,
      companyName: registration.company_name,
      code: registration.code,
      qrCodeBuffer: qrBuffer,
    });

    await supabase
      .from('registrations')
      .update({ email_sent: true })
      .eq('id', registration.id);
  } catch (emailErr) {
    // Email failure is non-fatal — the code is saved, attendee sees it on screen
    console.error('Email send error:', emailErr);
  }

  return NextResponse.json({
    success: true,
    code: registration.code,
    visitor_name: registration.visitor_name,
  });
}
