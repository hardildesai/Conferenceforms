// app/lcheckin/page.tsx
// Event-day check-in page — password gated, mobile-first.

import { isAdminAuthenticated } from '@/lib/auth';
import AdminLoginForm from '@/app/hotstart/AdminLoginForm';
import CheckinClient from './CheckinClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-In — Legrand Innovation Conference 2026',
};

// Force dynamic rendering — reads cookies at request time
export const dynamic = 'force-dynamic';


export default async function CheckinPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLoginForm redirectTo="/lcheckin" />;
  }

  return <CheckinClient />;
}
