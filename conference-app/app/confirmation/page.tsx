'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getCityConfig } from '@/lib/cities';

function LegrandLogo({ height = 28 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/legrand-logo.png"
      alt="Legrand Logo"
      height={height}
      style={{ display: 'block', height: `${height}px`, width: 'auto' }}
    />
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '------';
  const name = searchParams.get('name') ?? 'Attendee';
  const cityParam = searchParams.get('city') ?? 'ahmedabad';

  const cityConfig = getCityConfig(cityParam) || getCityConfig('ahmedabad')!;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code && code !== '------') {
      QRCode.toDataURL(code, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f0d0a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [code]);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="page-shell">
      {/* ── Executive Topbar ── */}
      <header className="executive-topbar animate-fade-up">
        <div className="topbar-brand">
          <LegrandLogo height={30} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="topbar-tagline">
            BETTER SPACES FOR A BRIGHTER TOMORROW
          </span>
          <Link
            href={`/${cityConfig.slug}`}
            className="btn-gold btn-sm"
          >
            ← Event Details
          </Link>
        </div>
      </header>

      {/* ── Success Header ── */}
      <section className="animate-fade-up" style={{ textAlign: 'center', maxWidth: '680px', margin: '14px auto 20px' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: '100px',
          padding: '5px 16px',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#22c55e',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          REGISTRATION CONFIRMED · {cityConfig.name.toUpperCase()}
        </div>

        <h1 className="executive-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>
          Welcome, <span className="red">{name}</span>
        </h1>

        <p className="executive-desc" style={{ marginBottom: '10px' }}>
          Your digital access pass for <strong>SWITCHGEAR 360° ({cityConfig.name})</strong> has been successfully issued.
        </p>
      </section>

      {/* ── Entry Pass Card (Cream Luxury) ── */}
      <div className="card-cream animate-fade-up" style={{ maxWidth: '580px', padding: '36px 28px' }}>
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--cream-muted)',
          marginBottom: '18px',
        }}>
          OFFICIAL DIGITAL ENTRY PASS &amp; VERIFICATION
        </div>

        {/* QR Code Container */}
        {qrDataUrl && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '18px',
          }}>
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1.5px solid var(--cream-border)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Pass for ${code}`}
                width={190}
                height={190}
                style={{ display: 'block', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}

        {/* Code Display */}
        <div className="code-display">
          <div className="code-digits">
            {code}
          </div>
          <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', fontWeight: 600, margin: '6px 0 0' }}>
            Present this 6-digit confirmation code or QR badge at the registration reception
          </p>
        </div>

        {/* Event Recap */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid var(--cream-border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--legrand-red)',
            letterSpacing: '0.1em',
            marginBottom: '10px',
          }}>
            EVENT PARTICULARS · {cityConfig.name.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--cream-text)' }}>
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', color: 'var(--cream-muted)' }}>Date:</strong>{' '}
              <span style={{ fontWeight: 700 }}>{cityConfig.date}</span>
            </div>
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', color: 'var(--cream-muted)' }}>Schedule:</strong>{' '}
              <span style={{ fontWeight: 700 }}>{cityConfig.time}</span>
            </div>
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', color: 'var(--cream-muted)' }}>Venue:</strong>{' '}
              <span style={{ fontWeight: 700 }}>{cityConfig.venueName}</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                {cityConfig.venueAddress}
              </div>
            </div>
            <div style={{ marginTop: '6px' }}>
              <a
                href={cityConfig.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--legrand-red)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                }}
              >
                Open Venue Location in Google Maps ↗
              </a>
            </div>
          </div>
        </div>

        {/* On Event Day instructions */}
        <div style={{ fontSize: '0.825rem', color: 'var(--cream-text)', lineHeight: 1.6, marginBottom: '22px' }}>
          <strong style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem', color: 'var(--cream-muted)' }}>
            Important Check-In Instructions:
          </strong>
          <ul style={{ paddingLeft: '18px', marginTop: '6px', color: 'var(--cream-muted)' }}>
            <li>Save this screen or present your confirmation email upon arrival.</li>
            <li>Paper printouts are not required; rapid digital check-in is active.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-legrand"
            style={{ flex: 1 }}
            onClick={handleCopy}
          >
            {copied ? 'Code Copied to Clipboard' : 'Copy 6-Digit Code'}
          </button>
          <Link
            href={`/${cityConfig.slug}`}
            className="btn-gold"
            style={{ flex: 1, textAlign: 'center' }}
          >
            Register Another Guest →
          </Link>
        </div>

        {/* Calligraphy Script */}
        <div className="presence-script">
          We look forward to your presence.
        </div>
      </div>

      {/* Skyline footer */}
      <footer className="executive-footer" style={{ maxWidth: '680px' }}>
        <div className="footer-skyline-text">
          {cityConfig.name.toUpperCase()} &nbsp;|&nbsp; IDEAS &nbsp;|&nbsp; CONNECTIONS &nbsp;|&nbsp; A BRIGHTER TOMORROW
        </div>
      </footer>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="page-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Loading invitation pass…</span>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
