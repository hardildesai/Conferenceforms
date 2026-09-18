// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendConfirmationEmail } from '@/lib/email';
import type { Registration } from '@/types/database';
import QRCode from 'qrcode';

// ── Helpers ──────────────────────────────────────────────

function generateCode(): string {
  // Cryptographically random 6-digit number (100000–999999)
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Accepts digits, +, spaces, hyphens, parentheses — at least 7 digits total
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
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
    errors.email = 'Please enter a valid email address';
  }
  if (!phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const supabase = createServerSupabaseClient();

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
