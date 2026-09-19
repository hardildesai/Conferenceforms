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

      {/* ── Registration Form (Cream Card) ── */}
      <div
        className="card-cream animate-fade-up"
        style={{ marginTop: '8px', animationDelay: '0.2s' }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', textAlign: 'center', marginBottom: '6px', fontSize: '1.2rem', fontWeight: 700 }}>
          Register Your Attendance
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--cream-muted)', fontSize: '0.8125rem', marginBottom: '24px' }}>
          All fields are required. Your code will be emailed instantly.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div style={{
              background: 'rgba(226,0,15,0.08)',
              border: '1px solid rgba(226,0,15,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '20px',
            }}>
              <p style={{ color: 'var(--legrand-red)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                ⚠️ {submitError}
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="company_name">
              Company Name<span className="required-star">*</span>
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              value={form.company_name}
              onChange={handleChange}
              placeholder="Acme Power Solutions"
              className={`input-cream${fieldErrors.company_name ? ' error' : ''}`}
              autoComplete="organization"
              disabled={loading}
            />
            {fieldErrors.company_name && (
              <span className="field-error">{fieldErrors.company_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="visitor_name">
              Full Name<span className="required-star">*</span>
            </label>
            <input
              id="visitor_name"
              name="visitor_name"
              type="text"
              value={form.visitor_name}
              onChange={handleChange}
              placeholder="Jane Smith"
              className={`input-cream${fieldErrors.visitor_name ? ' error' : ''}`}
              autoComplete="name"
              disabled={loading}
            />
            {fieldErrors.visitor_name && (
              <span className="field-error">{fieldErrors.visitor_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="designation">
              Designation<span className="required-star">*</span>
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              value={form.designation}
              onChange={handleChange}
              placeholder="Head of Electrical Engineering"
              className={`input-cream${fieldErrors.designation ? ' error' : ''}`}
              disabled={loading}
            />
            {fieldErrors.designation && (
              <span className="field-error">{fieldErrors.designation}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address<span className="required-star">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@company.com"
              className={`input-cream${fieldErrors.email ? ' error' : ''}`}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="phone">
              Phone Number<span className="required-star">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className={`input-cream${fieldErrors.phone ? ' error' : ''}`}
              autoComplete="tel"
              inputMode="tel"
              disabled={loading}
            />
            {fieldErrors.phone && (
              <span className="field-error">{fieldErrors.phone}</span>
            )}
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-legrand"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Registering…
              </>
            ) : (
              'Confirm Registration →'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="divider" style={{ marginTop: '20px', borderColor: 'var(--cream-border)' }} />
        <p style={{ textAlign: 'center', fontSize: '0.775rem', color: 'var(--cream-muted)', lineHeight: 1.6 }}>
          A unique attendance code will be emailed immediately after registration.<br/>
          For assistance: <strong>Mayur Patel · Harshal Buch · Hemant Kelaskar</strong>
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
