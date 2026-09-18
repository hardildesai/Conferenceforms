// lib/auth.ts
// Shared auth helpers for checking admin session cookie.

import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !sessionCookie) return false;
  return sessionCookie.value === adminPassword;
}
