'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CityEventConfig } from '@/lib/cities';

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

export default function CityRegistrationForm({ cityConfig }: { cityConfig: CityEventConfig }) {
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
  const [showFlyerModal, setShowFlyerModal] = useState(false);

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
        body: JSON.stringify({
          ...form,
          city: cityConfig.slug,
        }),
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

      router.push(`/confirmation?code=${data.code}&name=${encodeURIComponent(data.visitor_name)}&city=${cityConfig.slug}`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      {/* ── Executive Topbar ── */}
      <header className="executive-topbar animate-fade-up" style={{ maxWidth: '640px', margin: '10px auto 6px' }}>
        <div className="topbar-brand">
          <LegrandLogo height={28} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="topbar-tagline" style={{ display: 'none' }}>
            BETTER SPACES FOR A BRIGHTER TOMORROW
          </span>
          <Link
            href="/"
            className="btn-gold btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
          >
            ← Other Cities
          </Link>
        </div>
      </header>

      {/* ── Clean Uncluttered Container ── */}
      <div className="reg-container-clean">
        {/* Minimal Hero & Meta Bar */}
        <section className="reg-header-minimal animate-fade-up">
          <div className="invitation-kicker" style={{ fontSize: '0.68rem', marginBottom: '2px', letterSpacing: '0.18em' }}>
            YOU ARE CORDIALLY INVITED TO
          </div>

          <h1 className="executive-title" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.3rem)', marginBottom: '4px', lineHeight: 1.15 }}>
            <span className="red">SWITCHGEAR</span>{' '}
            <span className="light">360°</span>
          </h1>

          {/* Clean Pill Metadata Bar (No bulky boxed cards) */}
          <div className="reg-pills-bar">
            <span className="reg-pill">
              <strong>DATE</strong> {cityConfig.date}
            </span>
            <span className="reg-pill">
              <strong>TIME</strong> {cityConfig.time}
            </span>
            <span className="reg-pill">
              <strong>VENUE</strong> {cityConfig.venueName}
            </span>
          </div>

          {/* Quick Action Links */}
          <div className="reg-meta-links">
            <a
              href={cityConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reg-meta-link"
            >
              Open Venue on Maps ↗
            </a>
            <button
              type="button"
              onClick={() => setShowFlyerModal(true)}
              className="reg-meta-link"
            >
              View Official Invitation Flyer ↗
            </button>
          </div>
        </section>

        {/* ── Registration Form Card (Prominent & Clean) ── */}
        <div className="card-cream animate-fade-up" style={{ width: '100%', maxWidth: '640px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--legrand-red)',
              marginBottom: '4px',
            }}>
              EXCLUSIVE INVITATION
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--cream-text)',
              margin: '0 0 4px',
              lineHeight: 1.25,
            }}>
              Reserve Your Presence — {cityConfig.name}
            </h2>
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', margin: 0 }}>
              Complimentary registration for verified consultants, contractors &amp; partners.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: '16px',
              }}>
                <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                  {submitError}
                </p>
              </div>
            )}

            {/* Visitor Name */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="visitor_name">
                Full Name <span style={{ color: 'var(--legrand-red)' }}>*</span>
              </label>
              <input
                id="visitor_name"
                name="visitor_name"
                type="text"
                placeholder="e.g. Rajesh Sharma"
                value={form.visitor_name}
                onChange={handleChange}
                className={`input-cream ${fieldErrors.visitor_name ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="name"
              />
              {fieldErrors.visitor_name && (
                <span className="field-error-text">{fieldErrors.visitor_name}</span>
              )}
            </div>

            {/* Company Name */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="company_name">
                Company / Firm Name <span style={{ color: 'var(--legrand-red)' }}>*</span>
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="e.g. Apex Electricals Pvt Ltd"
                value={form.company_name}
                onChange={handleChange}
                className={`input-cream ${fieldErrors.company_name ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="organization"
              />
              {fieldErrors.company_name && (
                <span className="field-error-text">{fieldErrors.company_name}</span>
              )}
            </div>

            {/* Designation */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="designation">
                Designation / Role <span style={{ color: 'var(--legrand-red)' }}>*</span>
              </label>
              <input
                id="designation"
                name="designation"
                type="text"
                placeholder="e.g. Director / Chief Electrical Consultant"
                value={form.designation}
                onChange={handleChange}
                className={`input-cream ${fieldErrors.designation ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="organization-title"
              />
              {fieldErrors.designation && (
                <span className="field-error-text">{fieldErrors.designation}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label htmlFor="email">
                Corporate Email Address <span style={{ color: 'var(--legrand-red)' }}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. rajesh@apexelectricals.com"
                value={form.email}
                onChange={handleChange}
                className={`input-cream ${fieldErrors.email ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="field-error-text">{fieldErrors.email}</span>
              )}
            </div>

            {/* Phone */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="phone">
                Mobile Number (WhatsApp) <span style={{ color: 'var(--legrand-red)' }}>*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={handleChange}
                className={`input-cream ${fieldErrors.phone ? 'input-error' : ''}`}
                disabled={loading}
                autoComplete="tel"
              />
              {fieldErrors.phone && (
                <span className="field-error-text">{fieldErrors.phone}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-legrand"
              disabled={loading}
              style={{ width: '100%', marginTop: '6px' }}
            >
              {loading ? (
                <><span className="spinner" /> Generating Digital Pass…</>
              ) : (
                `Confirm Registration for ${cityConfig.name} →`
              )}
            </button>
          </form>

          {/* Script Calligraphy */}
          <div className="presence-script" style={{ marginTop: '16px', fontSize: '1.15rem' }}>
            We look forward to your presence.
          </div>
        </div>

        {/* ── Clean Venue & Coordinators Footer Drawer (Below Form) ── */}
        <div className="reg-footer-drawer animate-fade-up">
          <div style={{ marginBottom: '6px' }}>
            <strong>{cityConfig.venueName}:</strong> {cityConfig.venueAddress}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--gold-light)' }}>EVENT COORDINATORS:</strong>{' '}
            {cityConfig.contacts.map((c, i) => (
              <span key={c.name}>
                {i > 0 && ' · '}
                <strong style={{ color: '#ffffff' }}>{c.name}</strong> ({c.title})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Executive Footer Ribbon ── */}
      <footer className="executive-footer" style={{ maxWidth: '640px', marginTop: '28px' }}>
        <div className="footer-skyline-text">
          {cityConfig.name.toUpperCase()} &nbsp;|&nbsp; IDEAS &nbsp;|&nbsp; CONNECTIONS &nbsp;|&nbsp; A BRIGHTER TOMORROW
        </div>
      </footer>

      {/* ── Official Flyer Modal Lightbox ── */}
      {showFlyerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowFlyerModal(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '580px',
              maxHeight: '92vh',
              background: '#14110d',
              border: '1.5px solid var(--gold-border)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: '#0d0b09',
              borderBottom: '1px solid rgba(200, 151, 58, 0.2)',
              color: 'var(--gold-light)',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                LEGRAND SWITCHGEAR 360° — {cityConfig.name.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cityConfig.flyerImage}
              alt={`Legrand ${cityConfig.name} Invitation Flyer`}
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 'calc(92vh - 52px)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
