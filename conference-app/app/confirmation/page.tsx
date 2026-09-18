'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import QRCode from 'qrcode';

function LegrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="3" fill="#e2000f"/>
      <path d="M5 5H9V19H5V5Z" fill="white"/>
      <path d="M9 15H19V19H9V15Z" fill="white"/>
      <path d="M13 5H17V15H13V5Z" fill="white"/>
    </svg>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '------';
  const name = searchParams.get('name') ?? 'Attendee';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (code && code !== '------') {
      QRCode.toDataURL(code, {
        width: 220,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [code]);

  return (
    <main className="page-shell">
      {/* Legrand topbar */}
      <div className="legrand-topbar animate-fade-up">
        <div className="legrand-logo-wrap">
          <LegrandLogo size={22} />
          <span className="legrand-logo-text">
            legrand<span className="legrand-logo-reg">®</span>
          </span>
        </div>
      </div>

      <div className="gold-divider" style={{ width: '100%', maxWidth: '560px' }} />

      {/* Success badge */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '20px', animationDelay: '0.1s' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--success-dim)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '100px',
          padding: '6px 16px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--success)',
          marginBottom: '14px',
        }}>
          <span>✓</span> Registration Confirmed
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}>
          Welcome, <span className="gold-shimmer">{name}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9375rem' }}>
          Your place at the <strong style={{ color: 'var(--text-primary)' }}>Legrand Experience Evening</strong> is confirmed.
        </p>
      </div>

      {/* Code card — cream style */}
      <div className="card-cream animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--cream-muted)',
          marginBottom: '16px',
        }}>
          Your Entry Pass &amp; Code
        </p>

        {/* QR Code Container */}
        {qrDataUrl && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid var(--border-gold)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code for ${code}`}
                width={180}
                height={180}
                style={{ display: 'block', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}

        <div className="code-display" id="attendance-code-display">
          <div className="code-digits">{code}</div>
          <div className="gold-divider-thick" style={{ margin: '14px auto 10px' }} />
          <p style={{ color: 'var(--cream-muted)', fontSize: '0.8125rem', margin: 0 }}>
            Present this QR code or 6-digit code at the entrance
          </p>
        </div>

        {/* Event detail recap */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(226,0,15,0.04)',
          border: '1px solid rgba(226,0,15,0.15)',
          borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--cream-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Event Details
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              ['📅', 'Thursday, 24 September 2026'],
              ['🕡', '6:30 PM Onwards'],
              ['📍', 'Megma Restaurant and Banquets, Odhav, Ahmedabad'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--cream-text)' }}>
                <span style={{ flexShrink: 0 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* On event day */}
        <p style={{ fontWeight: 600, color: 'var(--cream-text)', marginBottom: '10px', fontSize: '0.9rem' }}>
          On event day:
        </p>
        <ul style={{ paddingLeft: '18px', color: 'var(--cream-muted)', fontSize: '0.875rem', lineHeight: '1.9' }}>
          <li>Screenshot this page or keep your confirmation email handy</li>
          <li>Show your 6-digit code or QR to staff at the entrance</li>
          <li>No printed tickets needed — digital check-in only</li>
        </ul>

        <div className="divider" />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-gold" style={{ flex: 1 }}>
            ← Register Another
          </Link>
          <button
            id="copy-code-btn"
            className="btn btn-dark"
            style={{ flex: 1 }}
            onClick={() => {
              navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copy-code-btn');
                if (btn) {
                  btn.textContent = '✓ Copied!';
                  setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
                }
              });
            }}
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="animate-fade-up" style={{
        marginTop: '24px',
        fontSize: '0.775rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        animationDelay: '0.35s',
      }}>
        Didn&apos;t receive the email? Check spam, or contact Mayur Patel / Harshal Buch / Hemant Kelaskar.
      </p>

      <div className="animate-fade-up" style={{ marginTop: '20px', animationDelay: '0.4s', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div className="legrand-logo-wrap" style={{ padding: '7px 16px', boxShadow: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}>
            <LegrandLogo size={16} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--legrand-red)', letterSpacing: '-0.01em' }}>
              legrand<span style={{ fontSize: '0.6em', verticalAlign: 'super' }}>®</span>
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Life is On
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="page-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
