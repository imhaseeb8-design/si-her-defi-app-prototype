'use client';
// "Claim your seat" — redesigned (Figma Post-UX-Fixes → Email sign up → "01 · Sign up — default", node 1023:234).
// Live baseline: capture/shots/A01–A02, A07–A08 (and git history for the previous version).
// The email field is Bencho's floating-label input — now the standard for every text field.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OnboardingLayout, cardV2 } from '@/components/onboarding/v2/OnboardingLayout';
import { Button } from '@/components/ui/Button';
import { LabelInput } from '@/components/ui/LabelInput';
import { authApi, errorMessage } from '@/lib/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const value = email.trim();
    // The button stays enabled (Figma default state); an empty or malformed email is explained
    // under the field instead of silently disabling the button.
    if (!value) { setError('Enter the email address you applied with.'); return; }
    if (!EMAIL.test(value)) { setError('Please enter a valid email address.'); return; }
    setBusy(true);
    setError(null);
    try {
      await authApi.claimSeat(value);
      router.push(`/verify?email=${encodeURIComponent(value.toLowerCase())}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const change = (v: string) => { setEmail(v); if (error) setError(null); };

  return (
    <OnboardingLayout step={0}>
      <section className={cardV2} aria-labelledby="claim-title">
        <div className="flex w-full flex-col">
          <div className="flex flex-col gap-2">
            <h1 id="claim-title" className="text-[22px] font-medium leading-7 tracking-[-0.33px] text-[#151534]">Claim your seat</h1>
            <p className="text-[14px] leading-[22px] text-[#4c4d77]">Enter the same email address you used to apply for Si Her DeFi. We&apos;ll send a 6-digit code — no password to make or remember.</p>
          </div>

          <form noValidate onSubmit={submit}>
            <div className="pt-4">
              <LabelInput
                field="Email" label="Email address" corner={12} height={48}
                id="email" name="email" autoComplete="email"
                value={email} onChange={change} disabled={busy}
                invalid={!!error} describedBy={error ? 'email-error' : undefined}
              />
            </div>
            {error && <p id="email-error" role="alert" className="mt-2 text-[12px] leading-4 text-red-500">{error}</p>}

            <div className="pt-5">
              <Button type="submit" loading={busy} loadingLabel="Sending code…">Send my code</Button>
            </div>
          </form>

          <p className="pt-3 text-[12.5px] leading-5 text-[#8688ae]">
            By continuing you agree to the{' '}
            <a href="https://si3.space/policy/membersPolicy" target="_blank" rel="noopener noreferrer" className="font-medium text-[#7b2fbe] underline decoration-from-font underline-offset-2">cohort guidelines</a>. We&apos;ll only email you about Si Her DeFi.
          </p>
        </div>

        <p className="text-[13px] text-[#4c4d77]">
          <span className="font-medium">Already registered?</span> Use the same email here to sign in
        </p>
      </section>
    </OnboardingLayout>
  );
}
