'use client';
// "Set up your profile" (captures B01–B06). `?from=dashboard` = editing later ("Save changes").
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { OnboardingShell, Spinner } from '@/components/onboarding/OnboardingShell';
import { errorMessage, profileApi } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import type { Profile } from '@/lib/types';

type Field = 'name' | 'role' | 'organization' | 'socialLink' | 'bio';
const FIELDS: { key: Exclude<Field, 'bio'>; id: string; label: string; placeholder: string; optional?: boolean }[] = [
  { key: 'name', id: 'name', label: 'Your name', placeholder: 'Firstname Lastname' },
  { key: 'role', id: 'role', label: 'Professional role', placeholder: 'Engineer, Writer, etc.', optional: true },
  { key: 'organization', id: 'org', label: 'Organization', placeholder: 'Name of your organization', optional: true },
  { key: 'socialLink', id: 'social', label: 'Social link', placeholder: 'https://linkedin.com/in/your-username', optional: true },
];
const inputClass = 'w-full rounded-xl border border-[#e2e2ec] bg-white px-3.5 py-2 text-[13px] font-normal text-[#171730] shadow-xs outline-none transition focus:border-[#7c2ae8] focus:ring-1 focus:ring-[#7c2ae8]';

const Tag = () => (
  <span className="rounded-full bg-[#eeeef6] px-2 py-0.5 text-[8.5px] font-bold tracking-wider text-[#7e7e96] uppercase">FROM YOUR APPLICATION</span>
);

async function toDataUrl(file: File, max = 512): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = url; });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.85);
}

function ProfileForm({ email }: { email: string }) {
  const router = useRouter();
  const fromDashboard = useSearchParams().get('from') === 'dashboard';
  const [values, setValues] = useState<Record<Field, string>>({ name: '', role: '', organization: '', socialLink: '', bio: '' });
  const [photo, setPhoto] = useState('');
  const [prefilled, setPrefilled] = useState<Set<Field>>(new Set());
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
      setPrefilled(new Set(fromApp ? (Object.keys(v) as Field[]).filter((k) => v[k]) : []));
    })();
  }, []);

  const pick = async (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('That photo is over 5 MB. Try a smaller one.'); return; }
    setPhoto(await toDataUrl(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <form className="w-full" onSubmit={submit}>
          <input ref={file} accept="image/png,image/jpeg,image/webp" className="hidden" placeholder="Upload your profile picture" type="file" onChange={(e) => pick(e.target.files?.[0])} />
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#171730]">Set up your profile</h1>
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
            <label className="block text-[12.5px] font-semibold text-[#171730]">Profile photo</label>
            <div className="mt-2 flex items-center gap-3.5">
              {photo ? (
                <>
                  <div className="relative size-13 shrink-0 overflow-hidden rounded-full border border-black/10 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="Profile avatar" className="size-full object-cover" src={photo} />
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <button type="button" onClick={() => file.current?.click()} className="rounded-lg bg-[#f2e8ff] px-3 py-1 text-[12px] font-semibold text-[#7c2ae8] transition-colors hover:bg-[#ead5ff] cursor-pointer">Replace</button>
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
                    <button type="button" onClick={() => file.current?.click()} className="rounded-lg bg-[#f2e8ff] px-3.5 py-1 text-[12.5px] font-semibold text-[#7c2ae8] transition-colors hover:bg-[#ead5ff] cursor-pointer">Upload a photo</button>
                    <p className="mt-1 text-[11px] text-[#8e8ea6]">JPG, PNG or WebP · up to 5 MB · shown on your certificate</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-4.5 space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor={f.id} className="text-[12px] font-semibold text-[#171730]">
                    {f.label}{f.optional && <> <span className="font-normal text-[#8e8ea6]">— optional</span></>}
                  </label>
                  {prefilled.has(f.key) && <Tag />}
                </div>
                <input id={f.id} placeholder={f.placeholder} required={!f.optional} className={inputClass} type="text" value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="bio" className="text-[12px] font-semibold text-[#171730]">Bio <span className="font-normal text-[#8e8ea6]">— optional</span></label>
                {prefilled.has('bio') && <Tag />}
              </div>
              <textarea id="bio" rows={3} maxLength={300} placeholder="A line about you and what you're building" className={`resize-none ${inputClass}`} value={values.bio} onChange={(e) => setValues({ ...values, bio: e.target.value })} />
              <p className="mt-0.5 text-right text-[10.5px] text-[#8e8ea6] tabular-nums">{values.bio.length} / 300</p>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-[12px] text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#501c9c] via-[#6d25d6] to-[#983cf4] px-4 py-3 text-[14px] font-semibold text-white shadow-md shadow-purple-950/20 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-90 cursor-pointer">
            {busy ? (<><Spinner /><span>Saving profile</span></>) : (<><span>{fromDashboard ? 'Save changes' : 'Save & continue'}</span><span aria-hidden="true" className="text-base font-normal">→</span></>)}
          </button>
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
