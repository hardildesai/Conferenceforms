'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  company_name: string;
  visitor_name: string;
  designation: string;
  email: string;
  phone: string;
}

interface FieldErrors {
  company_name?: string;
  visitor_name?: string;
  designation?: string;
  email?: string;
  phone?: string;
}

// Official Legrand logo component using uploaded image
function LegrandLogo({ height, size }: { height?: number; size?: number }) {
  const logoHeight = height ?? size ?? 26;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/legrand-logo.png"
      alt="Legrand Logo"
      height={logoHeight}
      style={{ display: 'block', height: `${logoHeight}px`, width: 'auto', background: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}
    />
  );
}

export default function RegistrationPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    company_name: '',
    visitor_name: '',
    designation: '',
    email: '',
    phone: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setSubmitError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      router.push(`/confirmation?code=${data.code}&name=${encodeURIComponent(data.visitor_name)}`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      {/* ── Legrand Top Bar ── */}
      <div className="legrand-topbar animate-fade-up" style={{ justifyContent: 'center', margin: '16px 0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LegrandLogo height={50} />
        </div>
      </div>

      {/* ── Event Identity ── */}
      <div className="event-header animate-fade-up" style={{ animationDelay: '0.1s', width: '100%', maxWidth: '640px' }}>
        <div className="gold-divider" />
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--gold-light)',
          marginBottom: '10px',
        }}>
          ✨ You are cordially invited to ✨
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 6vw, 2.6rem)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: '8px',
        }}>
          <span style={{ color: 'var(--legrand-red)', textShadow: '0 2px 20px rgba(226,0,15,0.4)' }}>
            Exclusive Legrand Experience Evening
          </span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.1rem',
          color: 'var(--text-primary)',
          fontWeight: 600,
          letterSpacing: '0.04em',
          marginBottom: '16px',
        }}>
          Unveiling Next-Generation Power Solutions
        </p>

        <div className="gold-divider-thick" />

        {/* ── Highlighted Large Event Details Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          textAlign: 'center',
        }}>
          {/* Date Box */}
          <div style={{
            background: 'rgba(200,151,58,0.12)',
            border: '1.5px solid var(--gold-border)',
            borderRadius: '12px',
            padding: '16px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-light)', margin: '0 0 4px' }}>
              📅 Event Date
            </p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Thursday, 24 Sep 2026
            </p>
          </div>

          {/* Time Box */}
          <div style={{
            background: 'rgba(200,151,58,0.12)',
            border: '1.5px solid var(--gold-border)',
            borderRadius: '12px',
            padding: '16px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-light)', margin: '0 0 4px' }}>
              🕡 Time
            </p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              6:30 PM Onwards
            </p>
          </div>

          {/* Venue Box */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(226,0,15,0.12)',
            border: '1.5px solid rgba(226,0,15,0.4)',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--legrand-red)', margin: '0 0 6px' }}>
              📍 Venue Location
            </p>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 10px', lineHeight: 1.3 }}>
              Megma Restaurant &amp; Banquets, Odhav, Ahmedabad
            </p>
            <a
              href="https://maps.app.goo.gl/Jy4kNUzK9vDzrpjk6"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--legrand-red)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '8px 18px',
                borderRadius: '100px',
                textDecoration: 'none',
                boxShadow: '0 3px 14px rgba(226,0,15,0.4)',
              }}
            >
              🗺️ Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── Registration Concluded Card (Cream Card) ── */}
      <div
        className="card-cream animate-fade-up"
        style={{ marginTop: '8px', animationDelay: '0.2s', textAlign: 'center', padding: '36px 24px' }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(226,0,15,0.08)',
          border: '1px solid rgba(226,0,15,0.25)',
          borderRadius: '100px',
          padding: '6px 16px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--legrand-red)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            🎉 Event Concluded
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>
          Thank You for Your Support!
        </h2>

        <p style={{ color: 'var(--cream-text)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 16px' }}>
          Registration for the <strong>Exclusive Legrand Experience Evening</strong> is now officially closed.
        </p>

        <p style={{ color: 'var(--cream-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
          We extend our sincere appreciation and heartfelt thanks to all our esteemed guests, partners, and attendees for making this evening a grand success!
        </p>

        {/* Footer info */}
        <div className="divider" style={{ marginTop: '24px', borderColor: 'var(--cream-border)' }} />
        <p style={{ textAlign: 'center', fontSize: '0.775rem', color: 'var(--cream-muted)', lineHeight: 1.6, margin: 0 }}>
          For inquiries or support: <strong>Mayur Patel · Harshal Buch · Hemant Kelaskar</strong>
        </p>
      </div>

      {/* Bottom Legrand wordmark */}
      <div
        className="animate-fade-up"
        style={{
          marginTop: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          animationDelay: '0.35s',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LegrandLogo height={32} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>
          Life is On
        </p>
      </div>
    </main>
  );
}
