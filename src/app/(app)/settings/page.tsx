'use client';
// Settings (captures H01, H02, M15). Note: Disconnect is immediate in the live app — no confirmation.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/app/AppShell';
import { useSession } from '@/components/app/SessionProvider';
import { Button, ButtonLink } from '@/components/ui/Button';
import { settingsApi, walletApi } from '@/lib/api';
import type { Settings } from '@/lib/types';

const section = 'rounded-2xl border border-[#ececf2] bg-white p-6 shadow-[0_2px_12px_rgba(23,23,48,0.03)]';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${on ? 'bg-[#7c2ae8]' : 'bg-[#e2e2ec]'}`}>
      <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
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
        <h1 className="text-[24px] font-bold tracking-tight text-[#171730]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#5f5f7a]">Manage your cohort profile, connected wallet, and platform preferences.</p>
      </div>

      <section className={`${section} space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#171730]">Profile information</h2>
            <p className="text-[12px] text-[#8e8ea6]">This is how your credentials appear on your on-chain certificate.</p>
          </div>
          <ButtonLink href="/profile?from=dashboard" size="md" className="self-start sm:self-auto">Edit profile</ButtonLink>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Avatar src={profile?.photoUrl} name={profile?.name} className="size-16 shadow-xs" />
          <div>
            <h3 className="text-[16px] font-bold text-[#171730]">{profile?.name}</h3>
            {profile?.role && <p className="text-[12.5px] font-medium text-[#7c2ae8]">{profile.role}</p>}
            {profile?.organization && <p className="text-[12px] text-[#8e8ea6] mt-0.5">{profile.organization}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[12.5px]">
          <div className="p-3 rounded-xl bg-[#f9f9fc] border border-[#ececf2]">
            <span className="text-[#8e8ea6] block text-[11px] font-medium">Social profile</span>
            <span className="text-[#171730] font-medium truncate block mt-0.5">{profile?.socialLink || '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#f9f9fc] border border-[#ececf2]">
            <span className="text-[#8e8ea6] block text-[11px] font-medium">Cohort</span>
            <span className="text-[#171730] font-medium block mt-0.5">Cohort 01 — Si Her DeFi</span>
          </div>
        </div>
      </section>

      <section className={`${section} space-y-4`}>
        <h2 className="text-[16px] font-bold text-[#171730]">Connected wallet</h2>
        <p className="text-[12px] text-[#8e8ea6]">Your on-chain certificate will be minted to this address on Base Mainnet.</p>
        {wallet ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#f9f9fc] border border-[#e4e4ed]">
            <div className="flex items-center gap-3">
              <span className="size-3 shrink-0 rounded-full bg-[#0052ff]" />
              <div>
                <p className="tabular-nums text-[13px] font-semibold text-[#171730] break-all sm:break-normal">{wallet}</p>
                <p className="text-[11px] text-[#8e8ea6]">Base Mainnet</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://basescan.org/address/${wallet}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#e2e2ec] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#5f5f7a] hover:bg-gray-50 transition">View on BaseScan ↗</a>
              <button type="button" disabled={busy} onClick={disconnect} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11.5px] font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50">{busy ? 'Disconnecting…' : 'Disconnect'}</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9f9fc] border border-[#e4e4ed]">
            <div>
              <p className="text-[13px] font-semibold text-[#171730]">No wallet connected</p>
              <p className="text-[11px] text-[#8e8ea6]">Connect a wallet to receive your certificate.</p>
            </div>
            <Button size="md" onClick={() => router.push('/wallet')}>Connect wallet</Button>
          </div>
        )}
      </section>

      <section className={`${section} space-y-4`}>
        <h2 className="text-[16px] font-bold text-[#171730]">Account preferences</h2>
        <div className="divide-y divide-[#f0f0f5] text-[13px]">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#171730]">Email notifications</p>
              <p className="text-[11px] text-[#8e8ea6]">Get updates when new modules, live sessions, and materials are published.</p>
            </div>
            <Toggle on={!!settings?.emailNotifications} disabled={!settings || saving === 'emailNotifications'} onChange={(v) => update('emailNotifications', v)} />
          </div>
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#171730]">On-chain verification privacy</p>
              <p className="text-[11px] text-[#8e8ea6]">Display your full name publicly on the Base certificate registry & verification page.</p>
            </div>
            <Toggle on={!!settings?.onChainVerificationPrivacy} disabled={!settings || saving === 'onChainVerificationPrivacy'} onChange={(v) => update('onChainVerificationPrivacy', v)} />
          </div>
        </div>
      </section>
    </div>
  );
}
