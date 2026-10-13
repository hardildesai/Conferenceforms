import { isAdminAuthenticated } from '@/lib/auth';
import AdminLoginForm from '@/app/hotstart/AdminLoginForm';
import CheckinClient from '@/app/lcheckin/CheckinClient';
import { getCityConfig, isValidCity, CitySlug } from '@/lib/cities';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const config = getCityConfig(city);
  return {
    title: config ? `${config.name} Check-In — Legrand Conference` : 'Check-In',
  };
}

export const dynamic = 'force-dynamic';

export default async function CityCheckinPage({ params }: Props) {
  const { city } = await params;

  if (!isValidCity(city)) {
    notFound();
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLoginForm redirectTo={`/${city}/lcheckin`} />;
  }

  return <CheckinClient city={city as CitySlug} />;
}
