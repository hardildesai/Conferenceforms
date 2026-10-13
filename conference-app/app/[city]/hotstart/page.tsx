import { isAdminAuthenticated } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getCityConfig, isValidCity, CitySlug } from '@/lib/cities';
import type { Registration } from '@/types/database';
import AdminDashboard from '@/app/hotstart/AdminDashboard';
import AdminLoginForm from '@/app/hotstart/AdminLoginForm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const config = getCityConfig(city);
  return {
    title: config ? `${config.name} Admin Dashboard — Legrand Conference` : 'Admin Dashboard',
  };
}

export const dynamic = 'force-dynamic';

export default async function CityAdminPage({ params }: Props) {
  const { city } = await params;

  if (!isValidCity(city)) {
    notFound();
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLoginForm redirectTo={`/${city}/hotstart`} />;
  }

  const supabase = createServerSupabaseClient();

  const [cityResult, allCitiesResult] = await Promise.all([
    supabase
      .from('registrations')
      .select('*')
      .eq('city', city)
      .order('created_at', { ascending: false }),
    supabase
      .from('registrations')
      .select('city'),
  ]);

  const registrations = (cityResult.data ?? []) as Registration[];

  if (cityResult.error) {
    return (
      <div className="gate-wrapper">
        <div className="card-cream" style={{ textAlign: 'center', maxWidth: '440px' }}>
          <p style={{ color: 'var(--danger)' }}>Failed to load registrations. Check your Supabase connection.</p>
          <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>{cityResult.error.message}</pre>
        </div>
      </div>
    );
  }

  const allCityCounts: Record<string, number> = {
    ahmedabad: 0,
    surat: 0,
    rajkot: 0,
  };
  let totalAllCount = 0;
  if (allCitiesResult.data) {
    totalAllCount = allCitiesResult.data.length;
    for (const r of allCitiesResult.data) {
      const c = (r.city || 'ahmedabad').toLowerCase();
      if (allCityCounts[c] !== undefined) {
        allCityCounts[c]++;
      }
    }
  }

  return (
    <AdminDashboard
      registrations={registrations}
      city={city as CitySlug}
      allCityCounts={allCityCounts}
      totalAllCount={totalAllCount}
    />
  );
}
