'use client';
// "Set up your profile" (captures B01–B06). `?from=dashboard` = editing later ("Save changes").
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { errorMessage, profileApi } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { LabelInput } from '@/components/ui/LabelInput';
import { toDataUrl } from '@/lib/image';

type Field = 'name' | 'role' | 'organization' | 'socialLink' | 'bio';
// Every text field is the floating-label LabelInput (same as the sign-in email field).
// Optional fields say so in their label; the old placeholders become hints shown on focus.
const FIELDS: { key: Exclude<Field, 'bio'>; id: string; label: string; placeholder: string; type?: 'text' | 'url'; autoComplete?: string }[] = [
  { key: 'name', id: 'name', label: 'Your name', placeholder: 'Firstname Lastname', autoComplete: 'name' },
  { key: 'role', id: 'role', label: 'Professional role (optional)', placeholder: 'Engineer, Writer, etc.', autoComplete: 'organization-title' },
  { key: 'organization', id: 'org', label: 'Organization (optional)', placeholder: 'Name of your organization', autoComplete: 'organization' },
  { key: 'socialLink', id: 'social', label: 'Social link (optional)', placeholder: 'https://linkedin.com/in/your-username', type: 'url', autoComplete: 'url' },
];

/** Shown inside a field while its value is still the one from the application. */
const Tag = () => (
  <span className="rounded-full bg-[#eeeef6] px-2 py-0.5 text-[11px] font-medium text-[#7e7e96] whitespace-nowrap">From your application</span>
);


function ProfileForm({ email }: { email: string }) {
  const router = useRouter();
  const fromDashboard = useSearchParams().get('from') === 'dashboard';
  const [values, setValues] = useState<Record<Field, string>>({ name: '', role: '', organization: '', socialLink: '', bio: '' });
  const [photo, setPhoto] = useState('');
  const [prefilled, setPrefilled] = useState<Partial<Record<Field, string>>>({});
  const [nameError, setNameError] = useState<string | null>(null);
  const [banner, setBanner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [profile, prefill] = await Promise.all([profileApi.getProfile().catch(() => null), profileApi.getPrefill().catch(() => null)]);
      const p: Partial<Profile> = profile?.name ? profile : { ...profile, ...prefill };
      const v = { name: p.name || '', role: p.role || '', organization: p.organization || '', socialLink: p.socialLink || '', bio: p.bio || '' };
      setValues(v);
      setPhoto(profile?.photoUrl || '');
      const fromApp = (prefill?.prefilledFields?.length ?? 0) > 0;
      setBanner(fromApp);
      setPrefilled(fromApp ? Object.fromEntries((Object.keys(v) as Field[]).filter((k) => v[k]).map((k) => [k, v[k]])) : {});
    })();
  }, []);

  const pick = async (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('That photo is over 5 MB. Try a smaller one.'); return; }
    setPhoto(await toDataUrl(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // the app's own error under the field, not the browser's "Please fill out this field" bubble
    if (!values.name.trim()) { setNameError('Add your name — it’s the one printed on your certificate.'); return; }
    setBusy(true);
    setError(null);
    try {
      await profileApi.updateProfile({ ...values, photoUrl: photo });
      router.push(fromDashboard ? '/dashboard' : '/wallet');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <OnboardingShell right={{ kind: 'account', email }} step={1} aside="profile">
      <div className="w-full">
        <form className="w-full" noValidate onSubmit={submit}>
          <input ref={file} accept="image/png,image/jpeg,image/webp" className="hidden" placeholder="Upload your profile picture" type="file" onChange={(e) => pick(e.target.files?.[0])} />
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-medium tracking-tight text-[#171730]">Set up your profile</h1>
            <p className="mt-1 text-[12.5px] sm:text-[13px] leading-relaxed text-[#5f5f7a]">This is how you’ll appear to partners and the rest of the cohort. You can change it any time.</p>
          </div>
          {banner && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#f0eafb] p-3 text-[#5b21b6]">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0 text-[#7c2ae8] mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 7v3M10 13h.01" />
              </svg>
              <p className="text-[12px] leading-relaxed">We’ve filled this in from your Si Her DeFi application — edit anything that’s out of date.</p>
            </div>
          )}
          <div className="mt-4.5">
            <label className="block text-[12.5px] font-medium text-[#171730]">Profile photo</label>
            <div className="mt-2 flex items-center gap-3.5">
              {photo ? (
                <>
                  <div className="relative size-13 shrink-0 overflow-hidden rounded-full border border-black/10 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="Profile avatar" className="size-full object-cover" src={photo} />
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <button type="button" onClick={() => file.current?.click()} className="rounded-lg bg-[#f2e8ff] px-3 py-1 text-[12px] font-medium text-[#7c2ae8] transition-colors hover:bg-[#ead5ff] cursor-pointer">Replace</button>
                    <button type="button" onClick={() => setPhoto('')} className="text-[11px] text-[#8e8ea6] transition-colors hover:text-[#5f5f7a] cursor-pointer">Remove photo</button>
                  </div>
                </>
              ) : (
                <>
                  <div onClick={() => file.current?.click()} className="grid size-13 shrink-0 place-items-center rounded-full border border-dashed border-[#d8b4fe] bg-[#f8f4ff] text-[#7c2ae8] cursor-pointer hover:bg-[#f2e8ff] transition-colors">
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="3" x2="8" y2="13" />
                      <line x1="3" y1="8" x2="13" y2="8" />
                    </svg>
                  </div>
                  <div>
                    <button type="button" onClick={() => file.current?.click()} className="rounded-lg bg-[#f2e8ff] px-3.5 py-1 text-[12.5px] font-medium text-[#7c2ae8] transition-colors hover:bg-[#ead5ff] cursor-pointer">Upload a photo</button>
                    <p className="mt-1 text-[11px] text-[#8e8ea6]">JPG, PNG or WebP · up to 5 MB · shown on your certificate</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {FIELDS.map((f) => {
              const fromApp = !!prefilled[f.key] && values[f.key] === prefilled[f.key];
              return (
                <div key={f.key}>
                  <LabelInput
                    id={f.id} name={f.key} label={f.label} type={f.type ?? 'text'} corner={12} height={48}
                    placeholder={f.placeholder} autoComplete={f.autoComplete}
                    value={values[f.key]} disabled={busy}
                    invalid={f.key === 'name' && !!nameError} describedBy={f.key === 'name' && nameError ? 'name-error' : undefined}
                    adornment={fromApp ? <Tag /> : undefined}
                    onChange={(v) => { setValues({ ...values, [f.key]: v }); if (f.key === 'name' && nameError) setNameError(null); }}
                  />
                  {f.key === 'name' && nameError && <p id="name-error" role="alert" className="mt-1.5 text-[12px] text-red-500">{nameError}</p>}
                </div>
              );
            })}
            <div>
              <LabelInput
                id="bio" name="bio" label="Bio (optional)" multiline height={96} corner={12} maxLength={300}
                placeholder="A line about you and what you're building" value={values.bio} disabled={busy}
                adornment={prefilled.bio && values.bio === prefilled.bio ? <Tag /> : undefined}
                onChange={(v) => setValues({ ...values, bio: v })}
              />
              <p className="mt-1 text-right text-[11px] text-[#8e8ea6]">Max 300 characters</p>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-[12px] text-red-500">{error}</p>}
          <div className="mt-5">
            <Button type="submit" loading={busy} loadingLabel="Saving profile">{fromDashboard ? 'Save changes' : 'Save & continue'}</Button>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-[#8e8ea6]">Only your name is required. Next: connect a wallet on Base — it’s where your certificate lands.</p>
        </form>
      </div>
    </OnboardingShell>
  );
}

export default function ProfilePage() {
  const user = useRequireAuth();
  return <Suspense><ProfileForm email={user?.email ?? ''} /></Suspense>;
}
