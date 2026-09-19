// app/hotstart/page.tsx
// Admin dashboard — password-gated server component.
// Fetches all registrations and renders the client dashboard.

import { isAdminAuthenticated } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Registration } from '@/types/database';
import AdminDashboard from './AdminDashboard';
import AdminLoginForm from './AdminLoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Legrand Innovation Conference 2026',
};

// Force dynamic rendering — this page reads cookies and env vars at request time
export const dynamic = 'force-dynamic';


export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLoginForm redirectTo="/hotstart" />;
  }

  const supabase = createServerSupabaseClient();
  const { data: rawRegistrations, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  const registrations = (rawRegistrations ?? []) as Registration[];

  if (error) {
    return (
      <div className="gate-wrapper">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)' }}>Failed to load registrations. Check your Supabase connection.</p>
          <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>{error.message}</pre>
        </div>
      </div>
    );
  }

  return <AdminDashboard registrations={registrations} />;
}
