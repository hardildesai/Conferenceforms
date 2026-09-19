'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

type CheckinStatus = 'idle' | 'loading' | 'success' | 'already_attended' | 'not_found' | 'error';

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

export default function CheckinClient() {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [counter, setCounter] = useState<Counter>({ attended: 0, total: 0 });
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refreshCounter() {
    try {
      const res = await fetch('/api/checkin');
      if (res.ok) {
        const data = await res.json();
        setCounter(data);
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    refreshCounter();
    const interval = setInterval(refreshCounter, 10000);
    return () => clearInterval(interval);
  }, []);

  async function executeCheckin(scannedCode: string) {
    if (!scannedCode || scannedCode.length !== 6) return;

    setResult({ status: 'loading' });

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scannedCode }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setResult({ status: 'not_found', error: data.error });
      } else if (!res.ok) {
        setResult({ status: 'error', error: data.error ?? 'Something went wrong' });
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

    let scannerInstance: import('html5-qrcode').Html5Qrcode | null = null;
    let isStopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (isStopped) return;

        scannerInstance = new Html5Qrcode('qr-reader');
        setScannerError(null);

        await scannerInstance.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            // Extract 6-digit code from decoded text or URL
            const match = decodedText.match(/\b\d{6}\b/);
            const codeFound = match ? match[0] : decodedText.replace(/\D/g, '').slice(0, 6);

            if (codeFound && codeFound.length === 6) {
              // Immediately stop camera scan before processing checkin
              if (scannerInstance && scannerInstance.isScanning) {
                scannerInstance.stop().catch(() => {});
              }
              executeCheckin(codeFound);
            }
          },
          () => {
            // ignore scan frame errors
          }
        );
        setIsScannerActive(true);
      } catch (err: unknown) {
        console.error('Camera scanner error:', err);
        setIsScannerActive(false);
        setScannerError('Camera access denied or unavailable. Please enable camera permissions or use Manual Entry.');
      }
    }

    startScanner();

    return () => {
      isStopped = true;
      setIsScannerActive(false);
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().catch(() => {});
      }
    };
  }, [mode, result]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await executeCheckin(code);
  }

  function handleReset() {
    setResult(null);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const progressPct = counter.total > 0
    ? Math.round((counter.attended / counter.total) * 100)
    : 0;

  return (
    <main className="page-shell">
      {/* Legrand topbar */}
      <div className="legrand-topbar animate-fade-up">
        <div className="legrand-logo-wrap">
          <LegrandLogo size={22} />
          <span className="legrand-logo-text">
            legrand<span className="legrand-logo-reg">®</span>
          </span>
        </div>
      </div>

      <div className="gold-divider" style={{ width: '100%', maxWidth: '560px' }} />

      {/* Page title */}
      <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '20px', animationDelay: '0.05s' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Event Day
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Guest Check-In
        </h1>
        <div className="gold-divider-thick" style={{ marginTop: '12px' }} />
      </div>

      {/* Live counter */}
      <div className="live-counter animate-fade-up" style={{ width: '100%', maxWidth: '480px', animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Attendance
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
          <span className="counter-value">{counter.attended}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>/ {counter.total}</span>
          <span style={{ color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 600 }}>({progressPct}%)</span>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '10px', height: '4px', background: 'rgba(200,151,58,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--legrand-red), var(--gold))',
            borderRadius: '2px',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Mode Switcher Tabs — shown when not viewing a result */}
      {!result && (
        <div className="animate-fade-up" style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '480px', marginBottom: '12px', animationDelay: '0.12s' }}>
          <button
            type="button"
            onClick={() => { setMode('qr'); setResult(null); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: mode === 'qr' ? '2px solid var(--legrand-red)' : '1px solid var(--border)',
              background: mode === 'qr' ? 'rgba(226,0,15,0.12)' : 'rgba(255,255,255,0.03)',
              color: mode === 'qr' ? 'var(--legrand-red)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📷 Scan QR Code
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setResult(null); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: mode === 'manual' ? '2px solid var(--gold)' : '1px solid var(--border)',
              background: mode === 'manual' ? 'rgba(200,151,58,0.12)' : 'rgba(255,255,255,0.03)',
              color: mode === 'manual' ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            ⌨️ 6-Digit Code
          </button>
        </div>
      )}

      {/* Main scanning / input card — shown when no result card is active */}
      {!result && (
        <div className="card-cream animate-fade-up" style={{ animationDelay: '0.15s' }}>

          {/* 📷 QR SCANNER MODE */}
          {mode === 'qr' && (
            <div>
              <p style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--cream-muted)',
                marginBottom: '14px',
              }}>
                Point Camera at Attendee QR Code
              </p>

              <div style={{ position: 'relative', width: '100%', background: '#000000', borderRadius: '12px', overflow: 'hidden', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div id="qr-reader" style={{ width: '100%' }} />
                
                {!isScannerActive && !scannerError && (
                  <div style={{ position: 'absolute', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>
                    Starting Camera Scanner…
                  </div>
                )}

                {scannerError && (
                  <div style={{ position: 'absolute', padding: '20px', textAlign: 'center', color: '#ff6b6b', fontSize: '0.875rem' }}>
                    ⚠️ {scannerError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ⌨️ MANUAL 6-DIGIT ENTRY MODE */}
          {mode === 'manual' && (
            <form onSubmit={handleSubmit}>
              <p style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--cream-muted)',
                marginBottom: '14px',
              }}>
                Enter 6-Digit Attendance Code
              </p>

              <input
                id="checkin-code-input"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                placeholder="_ _ _ _ _ _"
                className="input-cream checkin-input"
                autoComplete="off"
                autoFocus
                style={{ marginBottom: '16px' }}
              />

              <button
                id="checkin-submit-btn"
                type="submit"
                className="btn btn-legrand"
                disabled={code.length !== 6}
              >
                Check In Guest →
              </button>
            </form>
          )}
        </div>
      )}

      {/* Result card */}
      {result && result.status !== 'loading' && result.status !== 'idle' && (
        <div className="card-cream animate-fade-up" style={{ animationDelay: '0s' }}>

          {/* ── Success ── */}
          {result.status === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: 'var(--success-dim)',
                border: '2px solid rgba(34,197,94,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.75rem',
              }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--success)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                Checked In!
              </h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream-text)', marginBottom: '2px' }}>
                {result.visitor_name}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--cream-muted)' }}>
                {result.company_name}
                {result.designation ? ` · ${result.designation}` : ''}
              </p>
              <div style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: 'var(--success-dim)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--success)',
                fontWeight: 600,
              }}>
                Welcome to the Legrand Experience Evening 🎉
              </div>
            </div>
          )}

          {/* ── Already attended ── */}
          {result.status === 'already_attended' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: 'var(--warning-dim)',
                border: '2px solid rgba(245,158,11,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '1.75rem',
              }}>⚠️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--warning)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                Already Checked In
              </h2>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cream-text)', marginBottom: '2px' }}>
                {result.visitor_name}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--cream-muted)', marginBottom: '8px' }}>
                {result.company_name}
              </p>
              {result.attended_at && (
                <p style={{ fontSize: '0.8125rem', color: 'rgba(245,158,11,0.8)', fontWeight: 500 }}>
                  Checked in at {formatTime(result.attended_at)}
                </p>
              )}
            </div>
          )}

          {/* ── Not found ── */}
          {result.status === 'not_found' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '50%',
                background: 'rgba(226,0,15,0.08)',
                border: '2px solid rgba(226,0,15,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '1.75rem',
              }}>❌</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--legrand-red)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                Code Not Found
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--cream-muted)' }}>
                {result.error ?? 'This code is not registered. Please verify and try again.'}
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {result.status === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--legrand-red)', fontWeight: 500 }}>⚠️ {result.error}</p>
            </div>
          )}

          <div className="divider" />
          <button id="checkin-reset-btn" className="btn btn-legrand" onClick={handleReset}>
            ← Next Guest
          </button>
        </div>
      )}

      {/* Footer link */}
      <div className="animate-fade-up" style={{ marginTop: '28px', animationDelay: '0.25s', paddingBottom: '8px' }}>
        <a href="/hotstart" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textDecoration: 'none' }}>
          Admin Dashboard →
        </a>
      </div>
    </main>
  );
}
