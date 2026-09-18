import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registration Confirmed — Legrand Innovation Conference 2026',
  description: 'Your registration is confirmed. Here is your attendance code.',
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
