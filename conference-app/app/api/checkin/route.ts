// app/api/checkin/route.ts
// POST: Looks up attendance code and marks as attended.
// GET:  Returns the current check-in count and total registrations.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Registration } from '@/types/database';

// ── GET /api/checkin — live counter ──────────────────────
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { count: totalCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true });

  const { count: attendedCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('attended', true);

  return NextResponse.json({
    attended: attendedCount ?? 0,
    total: totalCount ?? 0,
  });
}

// ── POST /api/checkin — mark attendance ──────────────────
export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const code = body.code?.trim();

  // Validate: must be exactly 6 numeric digits
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'Please enter a valid 6-digit attendance code' },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const { data: rawReg, error: lookupError } = await supabase
    .from('registrations')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  const reg = rawReg as Registration | null;

  if (lookupError) {
    console.error('Check-in lookup error:', lookupError);
    return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 500 });
  }

  // ── Not found ──────────────────────────────────────────
  if (!reg) {
    return NextResponse.json(
      { status: 'not_found', error: 'Code not found. Please check and try again.' },
      { status: 404 }
    );
  }

  // ── Already attended ───────────────────────────────────
  if (reg.attended) {
    return NextResponse.json({
      status: 'already_attended',
      visitor_name: reg.visitor_name,
      company_name: reg.company_name,
      attended_at: reg.attended_at,
    });
  }

  // ── New check-in ───────────────────────────────────────
  const { error: updateError } = await supabase
    .from('registrations')
    .update({ attended: true, attended_at: new Date().toISOString() })
    .eq('id', reg.id);

  if (updateError) {
    console.error('Check-in update error:', updateError);
    return NextResponse.json({ error: 'Failed to mark attendance. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    status: 'success',
    visitor_name: reg.visitor_name,
    company_name: reg.company_name,
    designation: reg.designation,
  });
}
