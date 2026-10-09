'use client';
// "Claim your seat" — email step. Live: /siherdefi and /siherdefi/login (captures A01, A02, A07, A08).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OnboardingShell, Spinner, cardClass, submitClass } from '@/components/onboarding/OnboardingShell';
import { authApi, errorMessage } from '@/lib/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    setBusy(true);
    setError(null);
    try {
      await authApi.claimSeat(email);
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const enabled = !!email.trim() && !busy;
  return (
    <OnboardingShell right={{ kind: 'registered' }} step={0} aside="login">
      <section className={cardClass}>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Claim your seat</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">Enter the same email address you used to apply for Si Her DeFi. We’ll send a 6-digit code — no password to make or remember.</p>
        <form className="mt-5" noValidate onSubmit={submit}>
          <label htmlFor="email" className="block text-[13px] font-medium text-ink">Email address</label>
          <input
            id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
            placeholder="you@example.com" aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined}
            value={email} disabled={busy}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
            className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink transition outline-none placeholder:text-placeholder focus:ring-2 ${
              error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-line focus:border-brand focus:ring-brand/20'
            } disabled:opacity-60`}
          />
          {error && <p id="email-error" role="alert" className="mt-1.5 text-[12px] text-red-500">{error}</p>}
          <button type="submit" disabled={!enabled} aria-busy={busy} className={`mt-4 ${submitClass(enabled || busy)}`}>
            {busy ? (<><Spinner /> Sending code…</>) : (<>Send my code <span aria-hidden="true">→</span></>)}
          </button>
        </form>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          By continuing you agree to the{' '}
          <a href="https://si3.space/policy/membersPolicy" className="font-semibold text-brand underline underline-offset-2" target="_blank">cohort guidelines</a>. We’ll only email you about Si Her DeFi.
        </p>
      </section>
    </OnboardingShell>
  );
}
