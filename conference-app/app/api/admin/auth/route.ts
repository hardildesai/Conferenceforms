// app/api/admin/auth/route.ts
// POST: Validates admin password and sets a session cookie.
// DELETE: Clears the session cookie (logout).

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD env var not set!');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (!body.password || body.password !== ADMIN_PASSWORD) {
    // Constant-time comparison would be ideal for production; fine for this scale
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, ADMIN_PASSWORD, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    // secure: true — uncomment when deployed to HTTPS (Vercel sets this automatically)
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
