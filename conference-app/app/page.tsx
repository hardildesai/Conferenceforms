import Link from 'next/link';
import { CITIES, VALID_CITY_SLUGS } from '@/lib/cities';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legrand Switchgear 360° — Select Your City (Ahmedabad · Surat · Rajkot)',
  description: 'Join Legrand for Switchgear 360°: Safety, Efficiency, Performance across Gujarat. Register for Ahmedabad, Surat, and Rajkot.',
};

function LegrandLogo({ height = 30 }: { height?: number }) {
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
          <LegrandLogo height={30} />
        </div>
        <div className="topbar-tagline">
          BETTER SPACES FOR A BRIGHTER TOMORROW
        </div>
      </header>

      {/* ── Switchgear 360° Hero Header (Clean & Uncluttered) ── */}
      <section className="animate-fade-up" style={{ textAlign: 'center', maxWidth: '780px', margin: '8px auto 20px', width: '100%' }}>
        <div className="invitation-kicker" style={{ fontSize: '0.7rem', letterSpacing: '0.18em', marginBottom: '3px' }}>
          YOU ARE CORDIALLY INVITED TO
        </div>

        <h1 className="executive-title" style={{ fontSize: 'clamp(1.9rem, 6.5vw, 3.2rem)', marginBottom: '4px', lineHeight: 1.15 }}>
          <span className="red">SWITCHGEAR</span>{' '}
          <span className="light">360°</span>
        </h1>

        <div className="executive-subtitle" style={{ fontSize: 'clamp(0.85rem, 3vw, 1.05rem)', letterSpacing: '0.12em', marginBottom: '10px' }}>
          GUJARAT SYMPOSIUM · SAFETY · EFFICIENCY · PERFORMANCE
        </div>

        <p className="executive-desc" style={{ fontSize: '0.88rem', maxWidth: '580px', margin: '0 auto 16px', lineHeight: 1.5 }}>
          Join Legrand for an executive symposium showcasing next-generation low-voltage switchgear, protection and intelligent power architectures across Gujarat.
        </p>

        <div style={{
          display: 'inline-block',
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--gold-light)',
          background: 'rgba(200, 151, 58, 0.08)',
          border: '1px solid var(--gold-border)',
          borderRadius: '100px',
          padding: '5px 16px',
        }}>
          SELECT YOUR EVENT CITY
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <Link
                  href={`/${city.slug}`}
                  className="btn-legrand"
                  style={{ width: '100%', textAlign: 'center', fontSize: '0.88rem', padding: '12px 18px' }}
                >
                  Register for {city.name} →
                </Link>

                <a
                  href={city.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold btn-sm"
                  style={{ textAlign: 'center', fontSize: '0.78rem', padding: '7px 12px' }}
                >
                  Open Location in Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Executive Footer Ribbon ── */}
      <footer className="executive-footer" style={{ maxWidth: '1100px', marginTop: '28px' }}>
        <div className="footer-skyline-text">
          GUJARAT &nbsp;|&nbsp; IDEAS &nbsp;|&nbsp; CONNECTIONS &nbsp;|&nbsp; A BRIGHTER TOMORROW
        </div>
      </footer>
    </main>
  );
}
