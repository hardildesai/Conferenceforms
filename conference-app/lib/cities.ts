// lib/cities.ts
// Configuration for each city event: Ahmedabad, Surat, Rajkot.
// Directly matches the official Legrand Switchgear 360° event flyers.

export type CitySlug = 'ahmedabad' | 'surat' | 'rajkot';

export interface CityEventConfig {
  slug: CitySlug;
  name: string;
  eventName: string;
  subTitle: string;
  tagline: string;
  flyerImage: string;
  date: string;
  rawDate: string;
  time: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  contacts: { name: string; title: string }[];
  accentColor: string;
}

export const CITIES: Record<CitySlug, CityEventConfig> = {
  rajkot: {
    slug: 'rajkot',
    name: 'Rajkot',
    eventName: 'SWITCHGEAR 360°',
    subTitle: 'SAFETY, EFFICIENCY, PERFORMANCE.',
    tagline: 'Better Spaces for a Brighter Tomorrow',
    flyerImage: '/invite-rajkot.jpg',
    date: 'Wednesday, 21 Oct 2026',
    rawDate: '21 OCT 2026',
    time: '7:00 PM Onwards',
    venueName: 'RPJ HOTEL',
    venueAddress: 'Near Everest Park, Kalawad Road, Rajkot – 360005, Gujarat, India.',
    mapsUrl: 'https://maps.google.com/?q=RPJ+Hotel+Kalawad+Road+Rajkot',
    contacts: [
      { name: 'Khush Kadivar', title: 'Territory Manager' },
      { name: 'Harshal Buch', title: 'Sr. Branch Manager' },
    ],
    accentColor: '#e2000f',
  },
  ahmedabad: {
    slug: 'ahmedabad',
    name: 'Ahmedabad',
    eventName: 'SWITCHGEAR 360°',
    subTitle: 'SAFETY, EFFICIENCY, PERFORMANCE.',
    tagline: 'Better Spaces for a Brighter Tomorrow',
    flyerImage: '/invite-ahmedabad.jpg',
    date: 'Thursday, 22 Oct 2026',
    rawDate: '22 OCT 2026',
    time: '6:30 PM Onwards',
    venueName: 'RADISSON BLU',
    venueAddress: '401, Motilala Hirabhai Marg, Near Panchvati Cross Roads, Ambawadi, Ahmedabad – 380006, Gujarat, India.',
    mapsUrl: 'https://maps.google.com/?q=Radisson+Blu+Panchvati+Cross+Roads+Ambawadi+Ahmedabad',
    contacts: [
      { name: 'Mayur Patel', title: 'Business Development Manager' },
      { name: 'Harshal Buch', title: 'Sr. Branch Manager' },
    ],
    accentColor: '#e2000f',
  },
  surat: {
    slug: 'surat',
    name: 'Surat',
    eventName: 'SWITCHGEAR 360°',
    subTitle: 'SAFETY, EFFICIENCY, PERFORMANCE.',
    tagline: 'Better Spaces for a Brighter Tomorrow',
    flyerImage: '/invite-surat.jpg',
    date: 'Friday, 23 Oct 2026',
    rawDate: '23 OCT 2026',
    time: '6:30 PM Onwards',
    venueName: 'The AMore Hotel Surat',
    venueAddress: 'Dumas Road, Near Iscon Mall, Piplod, Surat – 395007, Gujarat, India.',
    mapsUrl: 'https://maps.google.com/?q=The+AMore+Hotel+Dumas+Road+Piplod+Surat',
    contacts: [
      { name: 'Bhavik Shah', title: 'Sr. Area Manager' },
      { name: 'Harshal Buch', title: 'Sr. Branch Manager' },
    ],
    accentColor: '#e2000f',
  },
};

export const VALID_CITY_SLUGS: CitySlug[] = ['ahmedabad', 'surat', 'rajkot'];

export function isValidCity(slug: string): slug is CitySlug {
  return VALID_CITY_SLUGS.includes(slug.toLowerCase() as CitySlug);
}

export function getCityConfig(slug: string): CityEventConfig | null {
  const normalized = slug.toLowerCase();
  if (isValidCity(normalized)) {
    return CITIES[normalized];
  }
  return null;
}
