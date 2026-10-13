'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { CitySlug, CITIES } from '@/lib/cities';

type CheckinStatus = 'idle' | 'loading' | 'success' | 'already_attended' | 'not_found' | 'wrong_city' | 'error';

interface CheckinResult {
  status: CheckinStatus;
  visitor_name?: string;
  company_name?: string;
  designation?: string;
  attended_at?: string;
  error?: string;
}

interface Counter {
  attended: number;
  total: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

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

export default function CheckinClient({ city }: { city?: CitySlug }) {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [counter, setCounter] = useState<Counter>({ attended: 0, total: 0 });
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cityConf = city ? CITIES[city] : null;
  const cityName = cityConf ? cityConf.name : 'All';

  async function refreshCounter() {
    try {
      const url = city ? `/api/checkin?city=${city}` : '/api/checkin';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCounter({ attended: data.attended, total: data.total });
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    refreshCounter();
    const interval = setInterval(refreshCounter, 10000);
    return () => clearInterval(interval);
  }, [city]);

  async function executeCheckin(scannedCode: string) {
    if (!scannedCode || scannedCode.length !== 6) return;

    setResult({ status: 'loading' });

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scannedCode, city }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setResult({ status: 'not_found', error: data.error });
      } else if (!res.ok) {
        setResult({ status: (data.status as CheckinStatus) || 'error', error: data.error ?? 'Something went wrong' });
      } else {
        setResult({ status: data.status, ...data });
        if (data.status === 'success') await refreshCounter();
      }
    } catch {
      setResult({ status: 'error', error: 'Network error. Please try again.' });
    }

    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Camera QR Scanner Lifecycle — runs ONLY when mode === 'qr' AND result === null
  useEffect(() => {
    if (mode !== 'qr' || result !== null) {
      setIsScannerActive(false);
      return;
    }

    let html5QrCode: any = null;
    let isMounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        html5QrCode = new Html5Qrcode('qr-reader-container');

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            const digits = decodedText.trim().replace(/\D/g, '');
            const candidate = digits.length >= 6 ? digits.slice(-6) : decodedText.trim();
            if (/^\d{6}$/.test(candidate)) {
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => {}).then(() => {
                  if (isMounted) executeCheckin(candidate);
                });
              } else {
                executeCheckin(candidate);
              }
            }
          },
          () => {} // silent scan frame error
        );

        if (isMounted) {
          setIsScannerActive(true);
          setScannerError(null);
        }
      } catch (err: any) {
        console.error('QR Scanner Start Error:', err);
        if (isMounted) {
          setScannerError('Could not access camera. Please allow camera permissions or use Manual Entry.');
          setIsScannerActive(false);
        }
      }
    }

    const timer = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {}).then(() => {
          try { html5QrCode.clear(); } catch {}
        });
      }
    };
  }, [mode, result]);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    executeCheckin(code);
  }

  return (
    <main className="page-shell">
      {/* Topbar */}
      <header className="switchgear-topbar animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <LegrandLogo height={32} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            background: 'var(--legrand-red)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {cityName} Scanner Desk
          </span>
        </div>
      </header>

      {/* Header and live counter */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111111', margin: '0 0 4px', textTransform: 'uppercase' }}>
          SWITCHGEAR 360° Check-In Desk
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px' }}>
          {cityConf ? `${cityConf.venueName} · ${cityConf.date}` : 'Digital Venue Verification'}
        </p>

        {/* Live Attendance Counter */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '24px',
          background: '#ffffff',
          border: '1.5px solid var(--border-light)',
          borderRadius: '14px',
          padding: '12px 28px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
              Checked In
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--success)' }}>
              {counter.attended}
            </div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border-light)' }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
              Total {cityName}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111111' }}>
              {counter.total}
            </div>
          </div>
        </div>
      </div>

      {/* ── Result Popover / Overlay Card ── */}
      {result && (
        <div className="card-cream animate-fade-up" style={{
          marginBottom: '16px',
          border: result.status === 'success' ? '2px solid var(--success)' : result.status === 'already_attended' ? '2px solid var(--gold)' : '2px solid var(--danger)',
          textAlign: 'center',
          padding: '24px 20px',
        }}>
          {result.status === 'loading' && (
            <div>
              <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
              <p style={{ marginTop: '10px', color: 'var(--cream-text)', fontWeight: 600 }}>Verifying attendance code…</p>
            </div>
          )}

          {result.status === 'success' && (
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Verified Entry
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--success)', fontSize: '1.5rem', margin: '0 0 6px' }}>
                Welcome to Legrand!
              </h2>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--cream-text)', margin: '0 0 4px' }}>
                {result.visitor_name}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--cream-muted)', margin: '0 0 16px' }}>
                {result.company_name} {result.designation ? `· ${result.designation}` : ''}
              </p>
              <button
                type="button"
                className="btn btn-legrand"
                onClick={() => setResult(null)}
                style={{ width: '100%' }}
              >
                Scan Next Attendee →
              </button>
            </div>
          )}

          {result.status === 'already_attended' && (
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Duplicate Check-In
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: '#d97706', fontSize: '1.3rem', margin: '0 0 6px' }}>
                Already Checked In!
              </h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream-text)', margin: '0 0 4px' }}>
                {result.visitor_name}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', margin: '0 0 14px' }}>
                Checked in at: {result.attended_at ? formatTime(result.attended_at) : 'earlier today'}
              </p>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setResult(null)}
                style={{ width: '100%' }}
              >
                Done / Next Attendee →
              </button>
            </div>
          )}

          {result.status === 'wrong_city' && (
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                City Discrepancy
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)', fontSize: '1.3rem', margin: '0 0 6px' }}>
                Wrong Event / City
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--danger)', margin: '0 0 16px', fontWeight: 600 }}>
                {result.error}
              </p>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setResult(null)}
                style={{ width: '100%' }}
              >
                Dismiss / Try Again
              </button>
            </div>
          )}

          {(result.status === 'not_found' || result.status === 'error') && (
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Code Not Recognized
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)', fontSize: '1.3rem', margin: '0 0 6px' }}>
                Invalid Code
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--cream-muted)', margin: '0 0 16px' }}>
                {result.error || 'Code not found. Please double check the 6 digits.'}
              </p>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => setResult(null)}
                style={{ width: '100%' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mode Switcher & Scanner Card ── */}
      {!result && (
        <div className="card-cream animate-fade-up" style={{ width: '100%', maxWidth: '440px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'qr' ? 'btn-legrand' : 'btn-dark'}`}
              style={{ flex: 1 }}
              onClick={() => { setMode('qr'); setScannerError(null); }}
            >
              QR Scanner
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'manual' ? 'btn-legrand' : 'btn-dark'}`}
              style={{ flex: 1 }}
              onClick={() => { setMode('manual'); setTimeout(() => inputRef.current?.focus(), 100); }}
            >
              Manual 6-Digit Code
            </button>
          </div>

          {mode === 'qr' && (
            <div>
              <div
                id="qr-reader-container"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#000000',
                  minHeight: '260px',
                }}
              />

              {scannerError && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(226,0,15,0.08)', borderRadius: '6px' }}>
                  <p style={{ color: 'var(--legrand-red)', fontSize: '0.8rem', margin: 0 }}>{scannerError}</p>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--cream-muted)', marginTop: '12px', margin: '12px 0 0' }}>
                Point attendee&apos;s phone QR pass into the camera box
              </p>
            </div>
          )}

          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label htmlFor="manual-code" style={{ textAlign: 'center', display: 'block', fontSize: '0.85rem' }}>
                  Attendee 6-Digit Attendance Code
                </label>
                <input
                  id="manual-code"
                  ref={inputRef}
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="input-cream"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    letterSpacing: '0.3em',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-legrand"
                disabled={code.length !== 6}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Verify &amp; Check In →
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
