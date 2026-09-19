// app/api/admin/batch-email/route.ts
// POST: Sends custom emails in batch to selected or all registrations.
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

  let body: { ids?: string[]; targetAll?: boolean; customSubject?: string; customMessage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  let query = supabase.from('registrations').select('*');

  if (!body.targetAll && body.ids && body.ids.length > 0) {
    query = query.in('id', body.ids);
  }

  const { data: rawRegs, error: fetchError } = await query;

  if (fetchError || !rawRegs) {
    return NextResponse.json({ error: 'Failed to fetch registrations for broadcast' }, { status: 500 });
  }

  const registrations = rawRegs as Registration[];

  if (registrations.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
  }

  let successCount = 0;
  let failedCount = 0;

  for (const reg of registrations) {
    // Generate QR code buffer for recipient
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

      successCount++;
    } catch (err) {
      console.error(`Batch send error for ${reg.email}:`, err);
      failedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    total: registrations.length,
    successCount,
    failedCount,
  });
}
