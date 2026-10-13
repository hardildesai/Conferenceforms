'use client';

import { useState, useMemo, useRef } from 'react';
import type { Registration } from '@/types/database';
import { useRouter } from 'next/navigation';
import { CitySlug, CITIES, VALID_CITY_SLUGS } from '@/lib/cities';

interface Props {
  registrations: Registration[];
  city?: CitySlug;
  allCityCounts?: Record<string, number>;
  totalAllCount?: number;
}

type FilterStatus = 'all' | 'attended' | 'unattended' | 'email_pending' | 'wa_pending';

function LegrandLogo({ height, size }: { height?: number; size?: number }) {
  const logoHeight = height ?? size ?? 24;
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

function exportCSV(data: Registration[], cityName: string) {
  const headers = [
    'ID', 'City', 'Created At', 'Company', 'Name', 'Designation', 'Email',
    'Phone', 'Code', 'Email Sent', 'WhatsApp Sent', 'Attended', 'Attended At',
  ];
  const rows = data.map((r) => [
    r.id,
    r.city || 'ahmedabad',
    r.created_at,
    `"${r.company_name.replace(/"/g, '""')}"`,
    `"${r.visitor_name.replace(/"/g, '""')}"`,
    `"${r.designation.replace(/"/g, '""')}"`,
    r.email,
    r.phone,
    r.code,
    r.email_sent ? 'Yes' : 'No',
    r.whatsapp_sent ? 'Yes' : 'No',
    r.attended ? 'Yes' : 'No',
    r.attended_at ?? '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations-${cityName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function substitutePlaceholders(
  template: string,
  data: {
    visitorName: string;
    companyName: string;
    designation?: string;
    code: string;
    city?: string;
  }
): string {
  const cityConf = data.city && CITIES[data.city as CitySlug] ? CITIES[data.city as CitySlug] : null;
  const eventName = cityConf ? cityConf.eventName : 'Switchgear 360°';
  const eventDate = cityConf ? cityConf.date : 'October 2026';
  const eventVenue = cityConf ? `${cityConf.venueName}, ${cityConf.venueAddress}` : 'Gujarat, India';
  const mapsLink = cityConf ? cityConf.mapsUrl : 'https://maps.google.com';

  return template
    .replace(/\{name\}/gi, data.visitorName)
    .replace(/\{visitor_name\}/gi, data.visitorName)
    .replace(/\{code\}/gi, data.code)
    .replace(/\{company\}/gi, data.companyName)
    .replace(/\{company_name\}/gi, data.companyName)
    .replace(/\{designation\}/gi, data.designation ?? '')
    .replace(/\{city\}/gi, cityConf?.name ?? (data.city || ''))
    .replace(/\{event_name\}/gi, eventName)
    .replace(/\{date\}/gi, eventDate)
    .replace(/\{venue\}/gi, eventVenue)
    .replace(/\{maps_link\}/gi, mapsLink);
}

export default function AdminDashboard({ registrations, city, allCityCounts, totalAllCount }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const cityConf = city ? CITIES[city] : null;
  const currentCityName = cityConf ? cityConf.name : 'All Cities';

  // Selection state for batch email
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Global custom template editor state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customSubject, setCustomSubject] = useState(
    cityConf ? `Your Entry Pass & Code for Legrand ${cityConf.name}` : 'Your Entry Pass & Code for {event_name}'
  );
  const [customEmailBody, setCustomEmailBody] = useState(
    `Hello {name},\n\nYour registration from {company} ({designation}) is confirmed for the Switchgear 360° (${currentCityName}).\nYour unique attendance code is: {code}\nVenue: {venue}\nDate: {date}\n\nPlease show your code or attached QR image at entrance.`
  );
  const [customWaBody, setCustomWaBody] = useState(
    `Hello {name}, your attendance code for Legrand Switchgear 360° (${currentCityName}) is *{code}*. Venue: {venue} on {date}. Show this message or QR at entrance!`
  );

  // Single recipient modal state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [modalMode, setModalMode] = useState<'email' | 'whatsapp' | null>(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalBody, setModalBody] = useState('');

  // Batch broadcast modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTarget, setBatchTarget] = useState<'selected' | 'all'>('selected');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchBody, setBatchBody] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ total: number; successCount: number; failedCount: number } | null>(null);

  const [resendingId, setResendingId] = useState<string | null>(null);

  const activeInputRef = useRef<'subject' | 'emailBody' | 'waBody' | 'batchSubject' | 'batchBody'>('emailBody');

  // Breakdown statistics
  const stats = useMemo(() => {
    const total = registrations.length;
    const emailSent = registrations.filter((r) => r.email_sent).length;
    const emailPending = total - emailSent;
    const whatsappSent = registrations.filter((r) => r.whatsapp_sent).length;
    const whatsappPending = total - whatsappSent;
    const attended = registrations.filter((r) => r.attended).length;
    const unattended = total - attended;

    // City breakdowns
    const byCity: Record<string, { total: number; attended: number }> = {};
    for (const c of VALID_CITY_SLUGS) {
      const cityRegs = registrations.filter((r) => (r.city || 'ahmedabad').toLowerCase() === c);
      byCity[c] = {
        total: cityRegs.length,
        attended: cityRegs.filter((r) => r.attended).length,
      };
    }

    return {
      total,
      emailSent,
      emailPending,
      whatsappSent,
      whatsappPending,
      attended,
      unattended,
      byCity,
    };
  }, [registrations]);

  // Filtered registrations
  const filtered = useMemo(() => {
    let result = registrations;

    // City filter (if in All Cities view)
    if (!city && cityFilter !== 'all') {
      result = result.filter((r) => (r.city || 'ahmedabad').toLowerCase() === cityFilter);
    }

    // Status filter
    if (filterStatus === 'attended') {
      result = result.filter((r) => r.attended);
    } else if (filterStatus === 'unattended') {
      result = result.filter((r) => !r.attended);
    } else if (filterStatus === 'email_pending') {
      result = result.filter((r) => !r.email_sent);
    } else if (filterStatus === 'wa_pending') {
      result = result.filter((r) => !r.whatsapp_sent);
    }

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.visitor_name.toLowerCase().includes(q) ||
          r.company_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.code.includes(q) ||
          r.designation.toLowerCase().includes(q)
      );
    }

    return result;
  }, [registrations, search, filterStatus, cityFilter, city]);

  const isAllSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  function toggleSelectRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function insertTag(tag: string) {
    if (activeInputRef.current === 'subject') {
      setCustomSubject((prev) => prev + tag);
    } else if (activeInputRef.current === 'emailBody') {
      setCustomEmailBody((prev) => prev + tag);
    } else if (activeInputRef.current === 'waBody') {
      setCustomWaBody((prev) => prev + tag);
    } else if (activeInputRef.current === 'batchSubject') {
      setBatchSubject((prev) => prev + tag);
    } else if (activeInputRef.current === 'batchBody') {
      setBatchBody((prev) => prev + tag);
    }
  }

  function openSingleModal(reg: Registration, mode: 'email' | 'whatsapp') {
    setSelectedReg(reg);
    setModalMode(mode);

    if (mode === 'email') {
      setModalSubject(substitutePlaceholders(customSubject, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
        city: reg.city || city,
      }));
      setModalBody(substitutePlaceholders(customEmailBody, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
        city: reg.city || city,
      }));
    } else {
      setModalBody(substitutePlaceholders(customWaBody, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
        city: reg.city || city,
      }));
    }
  }

  function openBatchModal(target: 'selected' | 'all') {
    setBatchTarget(target);
    setBatchSubject(customSubject);
    setBatchBody(customEmailBody);
    setBatchResult(null);
    setShowBatchModal(true);
  }

  async function handleSendSingleEmail() {
    if (!selectedReg) return;
    const id = selectedReg.id;
    setResendingId(id);

    try {
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          customSubject: modalSubject,
          customMessage: modalBody,
        }),
      });

      if (res.ok) router.refresh();
      else alert('Failed to send email. Check Brevo logs.');
    } catch {
      alert('Network error while sending email.');
    } finally {
      setResendingId(null);
      setSelectedReg(null);
      setModalMode(null);
    }
  }

  function handleSendSingleWhatsApp() {
    if (!selectedReg) return;
    const cleanPhone = selectedReg.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const encodedMsg = encodeURIComponent(modalBody);
    const waUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
    setSelectedReg(null);
    setModalMode(null);
  }

  async function handleBatchEmailBroadcast() {
    setBatchLoading(true);
    setBatchResult(null);

    const idsToSend = batchTarget === 'selected' ? Array.from(selectedIds) : [];

    try {
      const res = await fetch('/api/admin/batch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAll: batchTarget === 'all',
          ids: idsToSend,
          customSubject: batchSubject,
          customMessage: batchBody,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBatchResult({
          total: data.total,
          successCount: data.successCount,
          failedCount: data.failedCount,
        });
        router.refresh();
      } else {
        alert(data.error || 'Failed to send batch broadcast');
      }
    } catch {
      alert('Network error during batch email broadcast.');
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.refresh();
    router.push(city ? `/${city}/hotstart` : '/hotstart');
  }

  return (
    <div className="admin-shell">
      {/* ── Top Navigation Bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <LegrandLogo height={28} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="admin-brand-text">Admin Portal</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Switchgear 360° Management
            </span>
          </div>
        </div>

        {/* City Switcher Pill Navigation */}
        <nav className="admin-city-nav">
          <a
            href="/hotstart"
            className={`admin-city-tab ${!city ? 'active-all' : ''}`}
          >
            <span>All Cities</span>
            <span className="admin-city-tab-count">
              {totalAllCount !== undefined ? totalAllCount : registrations.length}
            </span>
          </a>
          {VALID_CITY_SLUGS.map((slug) => {
            const isCurrent = city === slug;
            const cityCount = allCityCounts?.[slug] ?? (stats.byCity[slug]?.total ?? 0);
            return (
              <a
                key={slug}
                href={`/${slug}/hotstart`}
                className={`admin-city-tab ${isCurrent ? 'active' : ''}`}
              >
                <span>{CITIES[slug].name}</span>
                <span className="admin-city-tab-count">{cityCount}</span>
              </a>
            );
          })}
        </nav>

        {/* Topbar Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {city && (
            <a
              href={`/${city}/lcheckin`}
              className="btn btn-dark btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {CITIES[city].name} Scanner
            </a>
          )}
          <button
            type="button"
            className="btn btn-dark btn-sm"
            onClick={() => setShowTemplateModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            Templates
          </button>
          <button
            id="export-csv-btn"
            className="btn btn-gold btn-sm"
            onClick={() => exportCSV(filtered, currentCityName)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            Export CSV ({filtered.length})
          </button>
          <button
            id="admin-logout-btn"
            className="btn btn-dark btn-sm"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="admin-content">
        {/* ── Event Header ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {currentCityName} Dashboard
            </h1>
            {cityConf ? (
              <span style={{
                background: 'rgba(226,0,15,0.15)',
                border: '1px solid var(--legrand-red)',
                color: 'var(--legrand-red)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '100px',
                textTransform: 'uppercase',
              }}>
                {cityConf.name} Edition
              </span>
            ) : (
              <span style={{
                background: 'rgba(200,151,58,0.15)',
                border: '1px solid var(--gold-border)',
                color: 'var(--gold-light)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '100px',
                textTransform: 'uppercase',
              }}>
                Multi-City Master View
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {cityConf ? `${cityConf.eventName} · ${cityConf.date} · ${cityConf.venueName}` : 'Switchgear 360° Across Ahmedabad, Surat & Rajkot'}
          </p>
        </div>

        {/* ── 4 Structured Metric Cards ── */}
        <div className="metrics-grid">
          {/* Card 1: Registered */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-label">Total Registrations</span>
                <span className="metric-badge">{currentCityName}</span>
              </div>
              <div className="metric-value-wrap">
                <span className="metric-value">{stats.total}</span>
                <span className="metric-sub">guests registered</span>
              </div>
            </div>
            <div>
              <div className="metric-progress-bg">
                <div className="metric-progress-fill" style={{ width: '100%', background: 'var(--gold)' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                100% database recorded
              </p>
            </div>
          </div>

          {/* Card 2: Email Delivered */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-label">Email Passes</span>
                <span className="metric-badge" style={{ color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)' }}>
                  {stats.total ? Math.round((stats.emailSent / stats.total) * 100) : 0}% Sent
                </span>
              </div>
              <div className="metric-value-wrap">
                <span className="metric-value" style={{ color: 'var(--success)' }}>{stats.emailSent}</span>
                <span className="metric-sub">/ {stats.total} delivered</span>
              </div>
            </div>
            <div>
              <div className="metric-progress-bg">
                <div
                  className="metric-progress-fill"
                  style={{
                    width: `${stats.total ? (stats.emailSent / stats.total) * 100 : 0}%`,
                    background: 'var(--success)',
                  }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {stats.emailPending} pending passes
              </p>
            </div>
          </div>

          {/* Card 3: WhatsApp Sent */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-label">WhatsApp Passes</span>
                <span className="metric-badge" style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.1)' }}>
                  {stats.total ? Math.round((stats.whatsappSent / stats.total) * 100) : 0}% Sent
                </span>
              </div>
              <div className="metric-value-wrap">
                <span className="metric-value" style={{ color: '#25D366' }}>{stats.whatsappSent}</span>
                <span className="metric-sub">/ {stats.total} dispatched</span>
              </div>
            </div>
            <div>
              <div className="metric-progress-bg">
                <div
                  className="metric-progress-fill"
                  style={{
                    width: `${stats.total ? (stats.whatsappSent / stats.total) * 100 : 0}%`,
                    background: '#25D366',
                  }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {stats.whatsappPending} pending via batch
              </p>
            </div>
          </div>

          {/* Card 4: Attendance / Check-In */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-label">Venue Check-Ins</span>
                <span className="metric-badge" style={{ color: 'var(--legrand-red)', borderColor: 'rgba(226,0,15,0.3)', background: 'rgba(226,0,15,0.1)' }}>
                  {stats.total ? Math.round((stats.attended / stats.total) * 100) : 0}% Turnout
                </span>
              </div>
              <div className="metric-value-wrap">
                <span className="metric-value" style={{ color: 'var(--legrand-red)' }}>{stats.attended}</span>
                <span className="metric-sub">/ {stats.total} checked in</span>
              </div>
            </div>
            <div>
              <div className="metric-progress-bg">
                <div
                  className="metric-progress-fill"
                  style={{
                    width: `${stats.total ? (stats.attended / stats.total) * 100 : 0}%`,
                    background: 'var(--legrand-red)',
                  }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {stats.unattended} guests yet to arrive
              </p>
            </div>
          </div>
        </div>

        {/* ── All-Cities Breakdown Strip (shown in master view) ── */}
        {!city && (
          <div className="city-breakdown-panel">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Regional Breakdown:
            </span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {VALID_CITY_SLUGS.map((slug) => {
                const c = stats.byCity[slug] || { total: 0, attended: 0 };
                const cConf = CITIES[slug];
                return (
                  <a
                    key={slug}
                    href={`/${slug}/hotstart`}
                    style={{ textDecoration: 'none' }}
                    className="city-breakdown-card"
                  >
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>{cConf.name}:</span>
                    <span style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: '0.85rem' }}>{c.total}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({c.attended} checked in)
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Global Template Editor Drawer ── */}
        {showTemplateModal && (
          <div className="card-cream animate-fade-up" style={{ marginBottom: '20px', border: '2px solid var(--border-gold)', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Message Template Editor ({currentCityName})
              </h3>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => setShowTemplateModal(false)}
              >
                Close ✕
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--cream-muted)', marginBottom: '12px' }}>
              Click any placeholder tag to append it into your subject or body:
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['{name}', '{code}', '{company}', '{designation}', '{city}', '{date}', '{venue}', '{maps_link}'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  style={{
                    background: 'rgba(226,0,15,0.08)',
                    border: '1px solid var(--legrand-red)',
                    color: 'var(--legrand-red)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                  Default Email Subject
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onFocus={() => { activeInputRef.current = 'subject'; }}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="input-cream"
                  style={{ width: '100%', marginBottom: '12px' }}
                />

                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                  Default Email Body
                </label>
                <textarea
                  value={customEmailBody}
                  onFocus={() => { activeInputRef.current = 'emailBody'; }}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="input-cream"
                  rows={6}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                  Default WhatsApp Message
                </label>
                <textarea
                  value={customWaBody}
                  onFocus={() => { activeInputRef.current = 'waBody'; }}
                  onChange={(e) => setCustomWaBody(e.target.value)}
                  className="input-cream"
                  rows={9}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Interactive Toolbar & Filter Card ── */}
        <div className="admin-toolbar-card">
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder={`Search ${currentCityName} attendees…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-cream"
              style={{
                width: '100%',
                paddingRight: search ? '32px' : '12px',
                fontSize: '0.85rem',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="filter-pills-group">
            <button
              type="button"
              className={`filter-pill-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({registrations.length})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterStatus === 'attended' ? 'active' : ''}`}
              onClick={() => setFilterStatus('attended')}
            >
              Checked In ({stats.attended})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterStatus === 'unattended' ? 'active' : ''}`}
              onClick={() => setFilterStatus('unattended')}
            >
              Not Checked In ({stats.unattended})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterStatus === 'email_pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('email_pending')}
            >
              Email Pending ({stats.emailPending})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterStatus === 'wa_pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('wa_pending')}
            >
              WhatsApp Pending ({stats.whatsappPending})
            </button>
          </div>

          {/* Batch Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  className="btn btn-legrand btn-sm"
                  onClick={() => openBatchModal('selected')}
                >
                  Broadcast to Selected ({selectedIds.size})
                </button>
                <button
                  type="button"
                  className="btn btn-dark btn-sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </button>
              </>
            )}

            <button
              type="button"
              className="btn btn-gold btn-sm"
              onClick={() => openBatchModal('all')}
            >
              Broadcast to ALL ({registrations.length})
            </button>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              Showing {filtered.length} of {registrations.length}
            </span>
          </div>
        </div>

        {/* ── Attendee Table ── */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    title="Select / Deselect All Filtered"
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th>Attendee &amp; Role</th>
                <th>Company</th>
                {!city && <th>City</th>}
                <th>Contact Details</th>
                <th>Entry Code</th>
                <th style={{ textAlign: 'center' }}>Email</th>
                <th style={{ textAlign: 'center' }}>WhatsApp</th>
                <th style={{ textAlign: 'center' }}>Check-In</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={city ? 9 : 10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    {search ? `No attendees match "${search}".` : `No registrations match the selected filters.`}
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => {
                  const regCity = (reg.city || 'ahmedabad').toLowerCase();
                  const initials = reg.visitor_name
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={reg.id}
                      style={{
                        background: selectedIds.has(reg.id) ? 'rgba(226,0,15,0.07)' : undefined,
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(reg.id)}
                          onChange={() => toggleSelectRow(reg.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>

                      {/* Attendee Name & Designation */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(200,151,58,0.15)',
                            border: '1px solid var(--gold-border)',
                            color: 'var(--gold-light)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {initials || 'G'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                              {reg.visitor_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {reg.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {reg.company_name}
                        </span>
                      </td>

                      {/* City Pill (only in All Cities mode) */}
                      {!city && (
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: regCity === 'rajkot'
                              ? 'rgba(234,88,12,0.15)'
                              : regCity === 'surat'
                              ? 'rgba(59,130,246,0.15)'
                              : 'rgba(226,0,15,0.15)',
                            color: regCity === 'rajkot'
                              ? '#fb923c'
                              : regCity === 'surat'
                              ? '#60a5fa'
                              : 'var(--legrand-red)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}>
                            {regCity}
                          </span>
                        </td>
                      )}

                      {/* Contact Details */}
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {reg.phone}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {reg.email}
                        </div>
                      </td>

                      {/* Code */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(reg.code)}
                          title="Click to copy code"
                          style={{
                            background: 'rgba(226,0,15,0.08)',
                            border: '1px solid rgba(226,0,15,0.35)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <code style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--legrand-red)',
                            letterSpacing: '0.08em',
                          }}>
                            {reg.code}
                          </code>
                          <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)' }}>
                            {copiedCode === reg.code ? 'Copied' : 'Copy'}
                          </span>
                        </button>
                      </td>

                      {/* Email Status */}
                      <td style={{ textAlign: 'center' }}>
                        {reg.email_sent ? (
                          <span className="badge badge-success">✓ Sent</span>
                        ) : (
                          <span className="badge badge-muted">Pending</span>
                        )}
                      </td>

                      {/* WhatsApp Status */}
                      <td style={{ textAlign: 'center' }}>
                        {reg.whatsapp_sent ? (
                          <span className="badge" style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}>
                            ✓ Sent
                          </span>
                        ) : (
                          <span className="badge badge-muted">Pending</span>
                        )}
                      </td>

                      {/* Check-In Status */}
                      <td style={{ textAlign: 'center' }}>
                        {reg.attended ? (
                          <span className="badge badge-success" title={reg.attended_at ?? undefined}>
                            ✓ In
                          </span>
                        ) : (
                          <span className="badge badge-muted">Absent</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            onClick={() => openSingleModal(reg, 'email')}
                            disabled={resendingId === reg.id}
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            title="Send Custom Email"
                          >
                            Email
                          </button>
                          <button
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={() => openSingleModal(reg, 'whatsapp')}
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            title="Send Custom WhatsApp"
                          >
                            WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Single Recipient Custom Message Modal ── */}
      {selectedReg && modalMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          backdropFilter: 'blur(6px)',
        }}>
          <div className="card-cream animate-fade-up" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {modalMode === 'email' ? 'Send Custom Email Pass' : 'Send Custom WhatsApp'}
              </h3>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => { setSelectedReg(null); setModalMode(null); }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '14px' }}>
              Recipient: <strong style={{ color: 'var(--cream-text)' }}>{selectedReg.visitor_name}</strong> ({selectedReg.company_name}) · Code: <strong style={{ color: 'var(--legrand-red)' }}>{selectedReg.code}</strong> · City: <strong>{(selectedReg.city || city || 'ahmedabad').toUpperCase()}</strong>
            </p>

            {modalMode === 'email' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                  Email Subject
                </label>
                <input
                  type="text"
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  className="input-cream"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                Message Content
              </label>
              <textarea
                value={modalBody}
                onChange={(e) => setModalBody(e.target.value)}
                className="input-cream"
                rows={7}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => { setSelectedReg(null); setModalMode(null); }}
              >
                Cancel
              </button>
              {modalMode === 'email' ? (
                <button
                  type="button"
                  className="btn btn-legrand"
                  onClick={handleSendSingleEmail}
                  disabled={resendingId === selectedReg.id}
                >
                  {resendingId === selectedReg.id ? 'Sending…' : 'Send Email Now →'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleSendSingleWhatsApp}
                >
                  Open WhatsApp Chat →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Email Broadcast Modal ── */}
      {showBatchModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          backdropFilter: 'blur(6px)',
        }}>
          <div className="card-cream animate-fade-up" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Broadcast Custom Email — {currentCityName}
              </h3>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => setShowBatchModal(false)}
                disabled={batchLoading}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '14px' }}>
              Broadcasting to: <strong style={{ color: 'var(--legrand-red)' }}>
                {batchTarget === 'all' ? `ALL ${registrations.length} ${currentCityName} Attendees` : `${selectedIds.size} Selected Attendees`}
              </strong>
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                Email Subject
              </label>
              <input
                type="text"
                value={batchSubject}
                onChange={(e) => setBatchSubject(e.target.value)}
                className="input-cream"
                style={{ width: '100%' }}
                disabled={batchLoading}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream-text)', display: 'block', marginBottom: '4px' }}>
                Email Message Body
              </label>
              <textarea
                value={batchBody}
                onChange={(e) => setBatchBody(e.target.value)}
                className="input-cream"
                rows={7}
                style={{ width: '100%', resize: 'vertical' }}
                disabled={batchLoading}
              />
            </div>

            {batchResult && (
              <div style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}>
                <p style={{ color: 'var(--success)', margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                  ✓ Broadcast Completed: {batchResult.successCount} sent successfully
                  {batchResult.failedCount > 0 && ` (${batchResult.failedCount} failed)`}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setShowBatchModal(false)}
                disabled={batchLoading}
              >
                {batchResult ? 'Done' : 'Cancel'}
              </button>
              {!batchResult && (
                <button
                  type="button"
                  className="btn btn-legrand"
                  onClick={handleBatchEmailBroadcast}
                  disabled={batchLoading || (batchTarget === 'selected' && selectedIds.size === 0)}
                >
                  {batchLoading ? 'Sending Broadcast…' : `Send to ${batchTarget === 'all' ? registrations.length : selectedIds.size} Attendees →`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
