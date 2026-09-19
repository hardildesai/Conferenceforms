// app/api/admin/resend-email/route.ts
// POST: Resends the confirmation email for a registration.
// Requires admin session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendConfirmationEmail } from '@/lib/email';
import type { Registration } from '@/types/database';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; customSubject?: string; customMessage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: rawReg, error: fetchError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', body.id)
    .single();

  const reg = rawReg as Registration | null;

  if (fetchError || !reg) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  // Regenerate QR code
  let qrBuffer: Buffer;
  try {
    qrBuffer = await QRCode.toBuffer(reg.code, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    qrBuffer = Buffer.alloc(0);
  }

  try {
    await sendConfirmationEmail({
      to: reg.email,
      visitorName: reg.visitor_name,
      companyName: reg.company_name,
      designation: reg.designation,
      code: reg.code,
      qrCodeBuffer: qrBuffer,
      customSubject: body.customSubject,
      customBody: body.customMessage,
    });

    await supabase
      .from('registrations')
      .update({ email_sent: true })
      .eq('id', reg.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resend email error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
