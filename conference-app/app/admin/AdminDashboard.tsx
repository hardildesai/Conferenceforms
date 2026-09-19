'use client';

import { useState, useMemo, useRef } from 'react';
import type { Registration } from '@/types/database';
import { useRouter } from 'next/navigation';

interface Props {
  registrations: Registration[];
}

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

function exportCSV(data: Registration[]) {
  const headers = [
    'ID', 'Created At', 'Company', 'Name', 'Designation', 'Email',
    'Phone', 'Code', 'Email Sent', 'WhatsApp Sent', 'Attended', 'Attended At',
  ];
  const rows = data.map((r) => [
    r.id,
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
  a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
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
  }
): string {
  return template
    .replace(/\{name\}/gi, data.visitorName)
    .replace(/\{visitor_name\}/gi, data.visitorName)
    .replace(/\{code\}/gi, data.code)
    .replace(/\{company\}/gi, data.companyName)
    .replace(/\{company_name\}/gi, data.companyName)
    .replace(/\{designation\}/gi, data.designation ?? '')
    .replace(/\{event_name\}/gi, 'Exclusive Legrand Experience Evening')
    .replace(/\{date\}/gi, 'Thursday, 24 September 2026')
    .replace(/\{venue\}/gi, 'Megma Restaurant, Odhav, Ahmedabad');
}

export default function AdminDashboard({ registrations }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  // Custom message template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customSubject, setCustomSubject] = useState('Your Entry Pass & Code for {event_name}');
  const [customEmailBody, setCustomEmailBody] = useState(
    'Hello {name},\n\nYour registration from {company} ({designation}) is confirmed for the Legrand Experience Evening.\nYour unique attendance code is: {code}\nVenue: {venue} on {date}.\n\nPlease show your code or attached QR image at entrance.'
  );
  const [customWaBody, setCustomWaBody] = useState(
    'Hello {name}, your attendance code for Legrand Experience Evening is *{code}*. Venue: {venue} on {date}. Show this message or QR at entrance!'
  );

  // Single recipient message modal state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [modalMode, setModalMode] = useState<'email' | 'whatsapp' | null>(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalBody, setModalBody] = useState('');
  
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, 'ok' | 'err'>>({});

  const activeInputRef = useRef<'subject' | 'emailBody' | 'waBody'>('emailBody');

  const stats = useMemo(() => ({
    total: registrations.length,
    emailSent: registrations.filter((r) => r.email_sent).length,
    whatsappSent: registrations.filter((r) => r.whatsapp_sent).length,
    attended: registrations.filter((r) => r.attended).length,
  }), [registrations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      (r) =>
        r.visitor_name.toLowerCase().includes(q) ||
        r.company_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.code.includes(q) ||
        r.designation.toLowerCase().includes(q)
    );
  }, [registrations, search]);

  function insertTag(tag: string) {
    if (activeInputRef.current === 'subject') {
      setCustomSubject((prev) => prev + tag);
    } else if (activeInputRef.current === 'emailBody') {
      setCustomEmailBody((prev) => prev + tag);
    } else if (activeInputRef.current === 'waBody') {
      setCustomWaBody((prev) => prev + tag);
    }
  }

  function openSendModal(reg: Registration, mode: 'email' | 'whatsapp') {
    setSelectedReg(reg);
    setModalMode(mode);

    if (mode === 'email') {
      setModalSubject(substitutePlaceholders(customSubject, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
      }));
      setModalBody(substitutePlaceholders(customEmailBody, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
      }));
    } else {
      setModalBody(substitutePlaceholders(customWaBody, {
        visitorName: reg.visitor_name,
        companyName: reg.company_name,
        designation: reg.designation,
        code: reg.code,
      }));
    }
  }

  async function handleSendEmailSubmit() {
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

      setResendStatus((prev) => ({ ...prev, [id]: res.ok ? 'ok' : 'err' }));
      setTimeout(() => setResendStatus((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } catch {
      setResendStatus((prev) => ({ ...prev, [id]: 'err' }));
    } finally {
      setResendingId(null);
      setSelectedReg(null);
      setModalMode(null);
    }
  }

  function handleSendWhatsAppSubmit() {
    if (!selectedReg) return;
    const cleanPhone = selectedReg.phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(modalBody);
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
    setSelectedReg(null);
    setModalMode(null);
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.refresh();
    router.push('/admin');
  }

  return (
    <div className="admin-shell">
      {/* ── Sticky topbar ── */}
      <div className="admin-topbar">
        <div className="admin-topbar-brand">
          <LegrandLogo height={24} />
          <span className="admin-brand-text" style={{ marginLeft: '12px' }}>Admin Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-legrand btn-sm"
            onClick={() => setShowTemplateModal(!showTemplateModal)}
          >
            💬 Custom Message Templates
          </button>
          <button id="export-csv-btn" className="btn btn-gold btn-sm" onClick={() => exportCSV(registrations)}>
            📥 Export CSV
          </button>
          <button id="admin-logout-btn" className="btn btn-dark btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* ── Page title ── */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Registrations Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Exclusive Legrand Experience Evening · 24 September 2026
          </p>
          <div style={{ width: '48px', height: '3px', background: 'linear-gradient(90deg, var(--legrand-red), var(--gold))', borderRadius: '2px', marginTop: '10px' }} />
        </div>

        {/* ── Template Editor Drawer ── */}
        {showTemplateModal && (
          <div className="card-cream animate-fade-up" style={{ marginBottom: '24px', border: '2px solid var(--border-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                ✏️ Global Message Template Editor
              </h3>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                onClick={() => setShowTemplateModal(false)}
              >
                Close ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--cream-muted)', marginBottom: '12px' }}>
              Click any tag below to insert dynamic values into the custom subject or message body:
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['{name}', '{code}', '{company}', '{designation}', '{date}', '{venue}'].map((tag) => (
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
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Email Template */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '6px' }}>
                  📧 Email Subject:
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onFocus={() => { activeInputRef.current = 'subject'; }}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="input-cream"
                  style={{ marginBottom: '10px' }}
                />

                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '6px' }}>
                  📧 Email Message Body:
                </label>
                <textarea
                  rows={5}
                  value={customEmailBody}
                  onFocus={() => { activeInputRef.current = 'emailBody'; }}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="input-cream"
                  style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              {/* WhatsApp Template */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '6px' }}>
                  💬 WhatsApp Custom Message:
                </label>
                <textarea
                  rows={8}
                  value={customWaBody}
                  onFocus={() => { activeInputRef.current = 'waBody'; }}
                  onChange={(e) => setCustomWaBody(e.target.value)}
                  className="input-cream"
                  style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Registered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.emailSent}</div>
            <div className="stat-label">Emails Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#25D366' }}>{stats.whatsappSent}</div>
            <div className="stat-label">WhatsApp Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--legrand-red)' }}>{stats.attended}</div>
            <div className="stat-label">Attended</div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="toolbar">
          <input
            id="admin-search-input"
            type="text"
            className="input-dark search-input"
            placeholder="Search by name, company, email, or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {filtered.length} / {registrations.length}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Code</th>
                <th style={{ textAlign: 'center' }}>Email</th>
                <th style={{ textAlign: 'center' }}>WA</th>
                <th style={{ textAlign: 'center' }}>Attended</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    {search ? 'No results matching your search.' : 'No registrations yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => (
                  <tr key={reg.id}>
                    <td className="td-primary">{reg.visitor_name}</td>
                    <td>{reg.company_name}</td>
                    <td>{reg.designation}</td>
                    <td style={{ fontSize: '0.8rem' }}>{reg.email}</td>
                    <td style={{ fontSize: '0.8rem' }}>{reg.phone}</td>
                    <td>
                      <code style={{
                        fontFamily: 'monospace',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--legrand-red)',
                        letterSpacing: '0.1em',
                      }}>
                        {reg.code}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {reg.email_sent
                        ? <span className="badge badge-success">✓</span>
                        : <span className="badge badge-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {reg.whatsapp_sent
                        ? <span className="badge badge-success">✓</span>
                        : <span className="badge badge-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {reg.attended
                        ? <span className="badge badge-success">✓</span>
                        : <span className="badge badge-muted">—</span>}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(reg.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-dark btn-sm"
                          onClick={() => openSendModal(reg, 'email')}
                          disabled={resendingId === reg.id}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="Send Custom Email"
                        >
                          📧 Custom Email
                        </button>
                        <button
                          type="button"
                          className="btn btn-gold btn-sm"
                          onClick={() => openSendModal(reg, 'whatsapp')}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="Send Custom WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Single Recipient Custom Message Modal ── */}
      {selectedReg && modalMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div className="card-cream animate-fade-up" style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream-text)', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {modalMode === 'email' ? '📧 Send Custom Email' : '💬 Send Custom WhatsApp'}
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
              Recipient: <strong style={{ color: 'var(--cream-text)' }}>{selectedReg.visitor_name}</strong> ({selectedReg.company_name}) — Code: <strong style={{ color: 'var(--legrand-red)' }}>{selectedReg.code}</strong>
            </p>

            {modalMode === 'email' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '4px' }}>
                  Email Subject:
                </label>
                <input
                  type="text"
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  className="input-cream"
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '4px' }}>
                Custom Message Content:
              </label>
              <textarea
                rows={6}
                value={modalBody}
                onChange={(e) => setModalBody(e.target.value)}
                className="input-cream"
                style={{ fontFamily: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                  onClick={handleSendEmailSubmit}
                  disabled={resendingId === selectedReg.id}
                >
                  {resendingId === selectedReg.id ? 'Sending…' : 'Send Email Now →'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleSendWhatsAppSubmit}
                >
                  Open WhatsApp Chat →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
