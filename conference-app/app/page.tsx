import Link from 'next/link';
import { CITIES, VALID_CITY_SLUGS } from '@/lib/cities';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legrand Switchgear 360° — Select Your City (Ahmedabad · Surat · Rajkot)',
  description: 'Join Legrand for Switchgear 360°: Safety, Efficiency, Performance across Gujarat. Register for Ahmedabad, Surat, and Rajkot.',
};

function LegrandLogo({ height = 32 }: { height?: number }) {
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

export default function LandingHubPage() {
  const cityList = VALID_CITY_SLUGS.map((slug) => CITIES[slug]);

  return (
    <main className="page-shell">
      {/* ── Executive Topbar ── */}
      <header className="executive-topbar animate-fade-up">
        <div className="topbar-brand">
          <LegrandLogo height={32} />
        </div>
        <div>
          <span className="topbar-tagline">
            BETTER SPACES FOR A BRIGHTER TOMORROW
          </span>
        </div>
      </header>

      {/* ── Switchgear 360° Hero Header ── */}
      <section className="animate-fade-up" style={{ textAlign: 'center', maxWidth: '820px', margin: '14px auto 20px' }}>
        <div className="invitation-kicker">
          YOU ARE CORDIALLY INVITED TO
        </div>

        <h1 className="executive-title">
          <span className="red">SWITCHGEAR</span>{' '}
          <span className="light">360°</span>
        </h1>

        <div className="executive-subtitle">
          SAFETY · EFFICIENCY · PERFORMANCE
        </div>

        <p className="executive-desc">
          Join Legrand for an exclusive symposium exploring our complete range of low-voltage switchgear, protection and intelligent control solutions for a safer, smarter and more sustainable tomorrow.
        </p>

        {/* ── 4 Executive Pillars ── */}
        <div className="pillars-strip">
          <div className="pillar-box">
            <span className="pillar-sub">PILLAR I</span>
            <span className="pillar-title">ENHANCED SAFETY</span>
          </div>
          <div className="pillar-box">
            <span className="pillar-sub">PILLAR II</span>
            <span className="pillar-title">GREATER EFFICIENCY</span>
          </div>
          <div className="pillar-box">
            <span className="pillar-sub">PILLAR III</span>
            <span className="pillar-title">RELIABLE PERFORMANCE</span>
          </div>
          <div className="pillar-box">
            <span className="pillar-sub">PILLAR IV</span>
            <span className="pillar-title">SUSTAINABLE TOMORROW</span>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="highlights-bar">
          <span>KNOWLEDGE SHARING</span>
          <span style={{ color: 'var(--gold)' }}>•</span>
          <span>EXECUTIVE NETWORKING</span>
          <span style={{ color: 'var(--gold)' }}>•</span>
          <span>LIVE PRODUCT SHOWCASE</span>
          <span style={{ color: 'var(--gold)' }}>•</span>
          <span>TECHNICAL ADVISORY</span>
        </div>

        <div style={{
          fontSize: '0.8rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--gold-light)',
          margin: '28px 0 12px',
        }}>
          SELECT YOUR EVENT LOCATION
        </div>
      </section>

      {/* ── 3 Cities Interactive Cards Grid ── */}
      <section className="city-hub-grid animate-fade-up">
        {cityList.map((city) => (
          <div key={city.slug} className="city-hub-card">
            {/* Flyer Thumbnail Banner */}
            <div className="city-hub-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={city.flyerImage}
                alt={`Legrand ${city.name} Invitation`}
              />
              <div className="city-hub-badge-city">
                {city.name} Edition
              </div>
              <div className="city-hub-badge-time">
                {city.time}
              </div>
            </div>

            {/* City Card Body */}
            <div className="city-hub-body">
              <div>
                <h2 className="city-hub-title">
                  {city.name}
                </h2>

                {/* Date Box */}
                <div className="city-hub-datebox">
                  <div className="city-hub-datelabel">
                    EVENT DATE
                  </div>
                  <div className="city-hub-dateval">
                    {city.date}
                  </div>
                </div>

                {/* Venue Details */}
                <div className="city-hub-venuebox">
                  <div className="city-hub-venuelabel">
                    EXCLUSIVE VENUE
                  </div>
                  <div className="city-hub-venuename">
                    {city.venueName}
                  </div>
                  <div className="city-hub-venueaddr">
                    {city.venueAddress}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <Link
                  href={`/${city.slug}`}
                  className="btn-legrand"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Register for {city.name} →
                </Link>

                <a
                  href={city.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold btn-sm"
                  style={{ textAlign: 'center' }}
                >
                  Open Location in Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Executive Footer Ribbon ── */}
      <footer className="executive-footer" style={{ maxWidth: '1100px' }}>
        <div className="footer-skyline-text">
          GUJARAT &nbsp;|&nbsp; IDEAS &nbsp;|&nbsp; CONNECTIONS &nbsp;|&nbsp; A BRIGHTER TOMORROW
        </div>
      </footer>
    </main>
  );
}
