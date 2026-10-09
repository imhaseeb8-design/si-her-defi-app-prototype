'use client';
// "Check your inbox" — 6-digit code step (captures A03–A05, A09–A11).
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { OnboardingShell, cardClass } from '@/components/onboarding/OnboardingShell';
import { authApi, errorMessage, nextOnboardingRoute, setAuthToken, setAuthUser } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const RESEND_SECONDS = 40;

function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') || '';
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const code = digits.join('');
  const complete = code.length === 6;

  const setFrom = (start: number, value: string) => {
    const chars = value.replace(/\D/g, '').slice(0, 6 - start).split('');
    if (!chars.length) return;
    setDigits((d) => { const n = [...d]; chars.forEach((c, i) => { n[start + i] = c; }); return n; });
    setError(null);
    refs.current[Math.min(start + chars.length, 5)]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setDigits((d) => { const n = [...d]; if (n[i]) n[i] = ''; else if (i > 0) { n[i - 1] = ''; refs.current[i - 1]?.focus(); } return n; });
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp(email, code);
      setAuthToken(res.token);
      setAuthUser(res.user);
      // Straight on to the next step — the separate "Email verified" screen was removed (Phase 2):
      // new applicants land on Create your profile, returning ones wherever they left off.
      router.replace(nextOnboardingRoute({ name: res.profile?.name, walletAddress: res.user.walletAddress }));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const resend = async () => {
    try { await authApi.resendOtp(email); } catch { /* ignore */ }
    setDigits(Array(6).fill(''));
    setError(null);
    setLeft(RESEND_SECONDS);
    refs.current[0]?.focus();
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <section className={cardClass}>
      <h1 className="text-center text-xl font-medium tracking-tight text-ink">Check your inbox</h1>
      <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">We sent a 6-digit code to</p>
      <p className="text-center text-[13px] leading-relaxed">
        <span className="font-medium text-ink">{email}</span> <span className="text-muted">·</span>{' '}
        <Link className="font-medium text-brand underline underline-offset-2" href="/login">change</Link>
      </p>
      <form className="mt-6" noValidate onSubmit={submit}>
        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i} ref={(el) => { refs.current[i] = el; }} autoFocus={i === 0} type="text" inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1} of 6`} value={d} disabled={busy}
              onChange={(e) => setFrom(i, e.target.value)} onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => { e.preventDefault(); setFrom(0, e.clipboardData.getData('text')); }}
              onFocus={(e) => e.target.select()}
              className={`h-12 min-w-0 flex-1 rounded-lg border text-center text-base font-medium text-ink transition outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${error ? 'border-red-400 bg-red-50/50' : 'border-line bg-white'}`}
            />
          ))}
        </div>
        {error && <p role="alert" className="mt-3 text-center text-[12px] font-medium text-red-500">{error}</p>}
        <div className="mt-5">
          <Button type="submit" disabled={!complete} loading={busy} loadingLabel="Verifying…" showIcon={false}>Verify email</Button>
        </div>
        <p className="mt-4 text-center text-[12px] text-muted">
          {left > 0 ? (
            <>Didn’t get it? Resend in <span className="font-medium text-ink tabular-nums">{mm}:{ss}</span></>
          ) : (
            <>Didn’t get it? <button type="button" onClick={resend} className="font-medium text-brand underline underline-offset-2 hover:no-underline">Resend code</button></>
          )}
        </p>
      </form>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">Check spam if it hasn’t landed in a minute. This code expires after 10 minutes.</p>
    </section>
  );
}

export default function VerifyPage() {
  return (
    <OnboardingShell right={{ kind: 'help' }} step={0} zeroWidth="calc(0% + 0px)" aside="login">
      <Suspense><VerifyForm /></Suspense>
    </OnboardingShell>
  );
}
