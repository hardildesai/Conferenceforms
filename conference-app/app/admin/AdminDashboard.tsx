'use client';

import { useState, useMemo } from 'react';
import type { Registration } from '@/types/database';
import { useRouter } from 'next/navigation';

interface Props {
  registrations: Registration[];
}

function LegrandLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="3" fill="#e2000f"/>
      <path d="M5 5H9V19H5V5Z" fill="white"/>
      <path d="M9 15H19V19H9V15Z" fill="white"/>
      <path d="M13 5H17V15H13V5Z" fill="white"/>
    </svg>
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

export default function AdminDashboard({ registrations }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, 'ok' | 'err'>>({});

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

  async function handleResend(id: string) {
    setResendingId(id);
    try {
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setResendStatus((prev) => ({ ...prev, [id]: res.ok ? 'ok' : 'err' }));
      setTimeout(() => setResendStatus((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    } catch {
      setResendStatus((prev) => ({ ...prev, [id]: 'err' }));
    } finally {
      setResendingId(null);
    }
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
          <div className="admin-brand-logo">
            <LegrandLogo size={18} />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--legrand-red)', fontSize: '0.9rem' }}>
              legrand<span style={{ fontSize: '0.6em', verticalAlign: 'super' }}>®</span>
            </span>
            <span className="admin-brand-text" style={{ marginLeft: '8px' }}>Admin Dashboard</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
            Registrations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Exclusive Legrand Experience Evening · 24 September 2026
          </p>
          <div style={{ width: '48px', height: '3px', background: 'linear-gradient(90deg, var(--legrand-red), var(--gold))', borderRadius: '2px', marginTop: '10px' }} />
        </div>

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
                      <button
                        id={`resend-btn-${reg.id}`}
                        className="btn btn-dark btn-sm"
                        onClick={() => handleResend(reg.id)}
                        disabled={resendingId === reg.id}
                        style={{
                          color: resendStatus[reg.id] === 'ok'
                            ? 'var(--success)'
                            : resendStatus[reg.id] === 'err'
                            ? 'var(--danger)'
                            : undefined,
                          fontSize: '0.775rem',
                          padding: '5px 10px',
                        }}
                      >
                        {resendingId === reg.id
                          ? '…'
                          : resendStatus[reg.id] === 'ok'
                          ? '✓ Sent'
                          : resendStatus[reg.id] === 'err'
                          ? '✗ Failed'
                          : 'Resend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
