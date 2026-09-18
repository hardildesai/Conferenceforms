'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminLoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Incorrect password');
        return;
      }

      router.refresh();
      router.push(redirectTo);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gate-wrapper">
      <div className="card-cream animate-fade-up" style={{ maxWidth: '380px' }}>
        {/* Legrand logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="legrand-logo-wrap" style={{ display: 'inline-flex', marginBottom: '14px' }}>
            <LegrandLogo size={20} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--legrand-red)' }}>
              legrand<span style={{ fontSize: '0.6em', verticalAlign: 'super' }}>®</span>
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--cream-text)',
            margin: '0 0 4px',
          }}>
            Staff Access
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--cream-muted)', margin: 0 }}>
            Enter the staff password to continue
          </p>
        </div>

        <div className="gold-divider-thick" style={{ marginBottom: '24px' }} />

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(226,0,15,0.08)',
              border: '1px solid rgba(226,0,15,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '16px',
            }}>
              <p style={{ color: 'var(--legrand-red)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                ⚠️ {error}
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter staff password"
              className="input-cream"
              autoFocus
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-legrand"
            disabled={loading || !password}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <><span className="spinner" /> Verifying…</>
            ) : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
