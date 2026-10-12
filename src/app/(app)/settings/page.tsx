'use client';
// Settings (captures H01, H02, M15). Note: Disconnect is immediate in the live app — no confirmation.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/app/AppShell';
import { useSession } from '@/components/app/SessionProvider';
import { Button } from '@/components/ui/Button';
import { errorMessage, profileApi, settingsApi, walletApi } from '@/lib/api';
import type { Profile, Settings } from '@/lib/types';
import { LabelInput } from '@/components/ui/LabelInput';
import { toDataUrl } from '@/lib/image';
import { Arrow } from '@/components/ui/Arrow';

const section = 'rounded-2xl border border-[#ececf2] bg-white p-6 shadow-[0_2px_12px_rgba(23,23,48,0.03)]';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${on ? 'bg-[#7c2ae8]' : 'bg-[#e2e2ec]'}`}>
      <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

type Field = 'name' | 'role' | 'organization' | 'socialLink' | 'bio';
const FIELDS: { key: Exclude<Field, 'bio'>; label: string; placeholder: string; type?: 'text' | 'url'; autoComplete?: string }[] = [
  { key: 'name', label: 'Your name', placeholder: 'Firstname Lastname', autoComplete: 'name' },
  { key: 'role', label: 'Professional role (optional)', placeholder: 'Engineer, Writer, etc.', autoComplete: 'organization-title' },
  { key: 'organization', label: 'Organization (optional)', placeholder: 'Name of your organization', autoComplete: 'organization' },
  { key: 'socialLink', label: 'Social link (optional)', placeholder: 'https://linkedin.com/in/your-username', type: 'url', autoComplete: 'url' },
];
const pick = (p: Profile | null) => ({ name: p?.name ?? '', role: p?.role ?? '', organization: p?.organization ?? '', socialLink: p?.socialLink ?? '', bio: p?.bio ?? '' });

/** Profile details edited in place: same floating-label fields as onboarding, saved without leaving Settings. */
function ProfileForm({ profile, onSaved }: { profile: Profile | null; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState(pick(profile));
  const [photo, setPhoto] = useState(profile?.photoUrl ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  // load once the session has the profile; later refreshes don't overwrite what you're typing
  const loaded = useRef(false);
  useEffect(() => { if (profile && !loaded.current) { loaded.current = true; setValues(pick(profile)); setPhoto(profile.photoUrl ?? ''); } }, [profile]);

  const original = pick(profile);
  const dirty = (Object.keys(values) as Field[]).some((k) => values[k] !== original[k]) || photo !== (profile?.photoUrl ?? '');
  const set = (k: Field, v: string) => { setValues({ ...values, [k]: v }); setSaved(false); if (k === 'name' && nameError) setNameError(null); };

  const choose = async (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('That photo is over 5 MB. Try a smaller one.'); return; }
    setError(null); setSaved(false); setPhoto(await toDataUrl(f));
  };
  const reset = () => { setValues(original); setPhoto(profile?.photoUrl ?? ''); setNameError(null); setError(null); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) { setNameError('Add your name — it’s the one printed on your certificate.'); return; }
    setBusy(true); setError(null);
    try { await profileApi.updateProfile({ ...values, photoUrl: photo }); await onSaved(); setSaved(true); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <form noValidate onSubmit={save} className="space-y-5">
      <input ref={file} accept="image/png,image/jpeg,image/webp" className="hidden" type="file" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="flex items-center gap-4">
        <Avatar src={photo} name={values.name} className="size-16 shadow-xs" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => file.current?.click()} className="rounded-lg bg-[#f2e8ff] px-3 py-1 text-[12px] font-medium text-[#7c2ae8] transition-colors hover:bg-[#ead5ff] cursor-pointer">{photo ? 'Replace photo' : 'Upload a photo'}</button>
            {photo && <button type="button" onClick={() => { setPhoto(''); setSaved(false); }} className="rounded-lg px-2 py-1 text-[12px] text-[#8e8ea6] transition-colors hover:text-[#5f5f7a] cursor-pointer">Remove</button>}
          </div>
          <p className="text-[11px] text-[#8e8ea6]">JPG, PNG or WebP · up to 5 MB</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <LabelInput
              id={`settings-${f.key}`} name={f.key} label={f.label} type={f.type ?? 'text'} corner={12} height={48}
              placeholder={f.placeholder} autoComplete={f.autoComplete} value={values[f.key]} disabled={busy}
              invalid={f.key === 'name' && !!nameError} describedBy={f.key === 'name' && nameError ? 'settings-name-error' : undefined}
              onChange={(v) => set(f.key, v)}
            />
            {f.key === 'name' && nameError && <p id="settings-name-error" role="alert" className="mt-1.5 text-[12px] text-red-500">{nameError}</p>}
          </div>
        ))}
        <div className="sm:col-span-2">
          <LabelInput
            id="settings-bio" name="bio" label="Bio (optional)" multiline height={96} corner={12} maxLength={300}
            placeholder="A line about you and what you're building" value={values.bio} disabled={busy} onChange={(v) => set('bio', v)}
          />
          <p className="mt-1 text-right text-[11px] text-[#8e8ea6]">Max 300 characters</p>
        </div>
      </div>
      {error && <p role="alert" className="text-[12px] text-red-500">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#f0f0f5] pt-4">
        {saved && !dirty && <span className="mr-auto text-[12px] text-[#16a34a]">Profile saved</span>}
        {dirty && !busy && <button type="button" onClick={reset} className="rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#5f5f7a] transition-colors hover:text-[#171730] cursor-pointer">Cancel</button>}
        <Button type="submit" size="md" showIcon={false} loading={busy} loadingLabel="Saving" disabled={!dirty}>Save changes</Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, wallet, refresh } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState<keyof Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { settingsApi.getSettings().then(setSettings).catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  const update = async (k: keyof Settings, v: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [k]: v });
    setSaving(k);
    try { setSettings(await settingsApi.updateSettings({ [k]: v })); setToast('Preferences saved'); } catch { setSettings(settings); } finally { setSaving(null); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { await walletApi.disconnect(); await refresh(); setToast('Wallet disconnected successfully'); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {toast && <div className="fixed top-5 right-5 z-60 rounded-xl bg-[#171730] px-4 py-2.5 text-[12.5px] font-medium text-white shadow-xl">{toast}</div>}
      <div>
        <h1 className="text-[24px] font-medium tracking-tight text-[#171730]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#5f5f7a]">Manage your cohort profile, connected wallet, and platform preferences.</p>
      </div>

      <section id="profile" className={`${section} scroll-mt-6 space-y-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[16px] font-medium text-[#171730]">Profile information</h2>
            <p className="text-[12px] text-[#8e8ea6]">Your name appears on your certificate. Members see your photo, role and bio on your profile.</p>
          </div>
          <span className="self-start rounded-full bg-[#f6f6fa] px-2.5 py-1 text-[11.5px] text-[#5f5f7a]">Cohort 01 · Si Her DeFi</span>
        </div>
        <ProfileForm profile={profile} onSaved={refresh} />
      </section>

      <section className={`${section} space-y-4`}>
        <h2 className="text-[16px] font-medium text-[#171730]">Connected wallet</h2>
        <p className="text-[12px] text-[#8e8ea6]">Your on-chain certificate will be minted to this address on Base Mainnet.</p>
        {wallet ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#f9f9fc] border border-[#e4e4ed]">
            <div className="flex items-center gap-3">
              <span className="size-3 shrink-0 rounded-full bg-[#0052ff]" />
              <div>
                <p className="tabular-nums text-[13px] font-medium text-[#171730] break-all sm:break-normal">{wallet}</p>
                <p className="text-[11px] text-[#8e8ea6]">Base Mainnet</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://basescan.org/address/${wallet}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#e2e2ec] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#5f5f7a] hover:bg-gray-50 transition">View on BaseScan <Arrow dir="up-right" /></a>
              <button type="button" disabled={busy} onClick={disconnect} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11.5px] font-medium text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50">{busy ? 'Disconnecting…' : 'Disconnect'}</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9f9fc] border border-[#e4e4ed]">
            <div>
              <p className="text-[13px] font-medium text-[#171730]">No wallet connected</p>
              <p className="text-[11px] text-[#8e8ea6]">Connect a wallet to receive your certificate.</p>
            </div>
            <Button size="md" onClick={() => router.push('/wallet')}>Connect wallet</Button>
          </div>
        )}
      </section>

      <section className={`${section} space-y-4`}>
        <h2 className="text-[16px] font-medium text-[#171730]">Account preferences</h2>
        <div className="divide-y divide-[#f0f0f5] text-[13px]">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[#171730]">Email notifications</p>
              <p className="text-[11px] text-[#8e8ea6]">Get updates when new modules, live sessions, and materials are published.</p>
            </div>
            <Toggle on={!!settings?.emailNotifications} disabled={!settings || saving === 'emailNotifications'} onChange={(v) => update('emailNotifications', v)} />
          </div>
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[#171730]">On-chain verification privacy</p>
              <p className="text-[11px] text-[#8e8ea6]">Display your full name publicly on the Base certificate registry & verification page.</p>
            </div>
            <Toggle on={!!settings?.onChainVerificationPrivacy} disabled={!settings || saving === 'onChainVerificationPrivacy'} onChange={(v) => update('onChainVerificationPrivacy', v)} />
          </div>
        </div>
      </section>
    </div>
  );
}
