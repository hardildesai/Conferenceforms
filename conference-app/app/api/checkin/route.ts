// app/api/checkin/route.ts
// POST: Looks up attendance code (optionally scoped to city) and marks as attended.
// GET:  Returns current check-in count and total registrations (optionally filtered by city).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Registration } from '@/types/database';

// ── GET /api/checkin — live counter ──────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city')?.toLowerCase();

  const supabase = createServerSupabaseClient();

  let totalQuery = supabase.from('registrations').select('*', { count: 'exact', head: true });
  let attendedQuery = supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('attended', true);

  if (city) {
    totalQuery = totalQuery.eq('city', city);
    attendedQuery = attendedQuery.eq('city', city);
  }

  const [{ count: totalCount }, { count: attendedCount }] = await Promise.all([
    totalQuery,
    attendedQuery,
  ]);

  return NextResponse.json({
    attended: attendedCount ?? 0,
    total: totalCount ?? 0,
    city: city ?? 'all',
  });
}

// ── POST /api/checkin — mark attendance ──────────────────
export async function POST(req: NextRequest) {
  let body: { code?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const code = body.code?.trim();
  const city = body.city?.trim().toLowerCase();

  // Validate: must be exactly 6 numeric digits
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'Please enter a valid 6-digit attendance code' },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  let query = supabase.from('registrations').select('*').eq('code', code);
  if (city) {
    query = query.eq('city', city);
  }

  const { data: rawReg, error: lookupError } = await query.maybeSingle();
  const reg = rawReg as Registration | null;

  if (lookupError) {
    console.error('Check-in lookup error:', lookupError);
    return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 500 });
  }

  // ── Not found ──────────────────────────────────────────
  if (!reg) {
    // If not found in this city, let's see if it was registered in another city for a better message
    if (city) {
      const { data: otherCityReg } = await supabase
        .from('registrations')
        .select('city')
        .eq('code', code)
        .maybeSingle();

      if (otherCityReg) {
        return NextResponse.json(
          {
            status: 'wrong_city',
            error: `This code belongs to a registration for ${otherCityReg.city.toUpperCase()}, not this event!`,
          },
          { status: 400 }
        );
      }
    }

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
    city: reg.city,
  });
}
