import { notFound } from 'next/navigation';
import { getCityConfig, isValidCity } from '@/lib/cities';
import CityRegistrationForm from './CityRegistrationForm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const config = getCityConfig(city);

  if (!config) {
    return {
      title: 'City Not Found — Legrand Experience',
    };
  }

  return {
    title: `Registration — Legrand ${config.name} (${config.date})`,
    description: `Register for Legrand ${config.eventName} at ${config.venueName}, ${config.name}.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;

  if (!isValidCity(city)) {
    notFound();
  }

  const config = getCityConfig(city);
  if (!config) {
    notFound();
  }

  return <CityRegistrationForm cityConfig={config} />;
}
