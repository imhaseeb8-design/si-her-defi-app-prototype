'use client';
// Prototype-only control panel (not part of the product). Jump to any stage of the journey and pick how
// the simulated backend and wallet behave. Hide with ?demo=0 or the ✕ button.
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useDemo } from '@/lib/hooks/useDemo';
import { DEFAULT_NOW, applyPreset, getState, setState, type Preset, type WalletMode } from '@/lib/mock/server';

const PRESETS: { id: Preset; label: string; to: string }[] = [
  { id: 'new', label: 'New applicant (signed out)', to: '/login' },
  { id: 'verified', label: 'Email verified, no profile', to: '/profile' },
  { id: 'profile', label: 'Profile done, no wallet', to: '/wallet' },
  { id: 'wallet', label: 'Wallet linked, onboarding not started', to: '/dashboard' },
  { id: 'part1-draft', label: 'Onboarding Part 1 in progress', to: '/dashboard' },
  { id: 'part1-done', label: 'Part 1 done — first module open', to: '/dashboard' },
  { id: 'badge', label: 'First badge earned', to: '/dashboard' },
  { id: 'badges-some', label: '4 badges earned', to: '/dashboard' },
  { id: 'badges-all', label: 'All 12 badges earned', to: '/dashboard' },
  { id: 'minted', label: 'Certificate minted', to: '/certificate' },
];

const WALLET_MODES: { id: WalletMode; label: string }[] = [
  { id: 'metamask', label: 'MetaMask installed (approves)' },
  { id: 'none', label: 'No wallet extension' },
  { id: 'reject-connect', label: 'Rejects connection' },
  { id: 'reject-sign', label: 'Rejects signature' },
  { id: 'wrong-network', label: 'Wrong network first' },
];

export function DemoPanel() {
  const demo = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Hook for automated screenshot runs (tools/capture/proto.js).
    (window as unknown as { __demo: unknown }).__demo = { applyPreset, setState, getState };
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('demo');
    if (q === '0') window.localStorage.setItem('siherdefi_demo_hidden', '1');
    if (q === '1') window.localStorage.removeItem('siherdefi_demo_hidden');
    setHidden(window.localStorage.getItem('siherdefi_demo_hidden') === '1');
  }, [pathname]);

  if (hidden || API_BASE_URL) return null;

  const flag = <K extends keyof typeof demo.flags>(k: K, v: (typeof demo.flags)[K]) => setState((s) => { s.flags[k] = v; });
  const go = (p: (typeof PRESETS)[number]) => { applyPreset(p.id); setOpen(false); router.push(p.to); router.refresh(); };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 left-4 z-[70] flex items-center gap-2 rounded-full bg-[#171730] px-3.5 py-2 text-[12px] font-medium text-white shadow-lg shadow-black/20 hover:bg-black">
        <span className="size-2 rounded-full bg-[#a3e635]" /> Prototype
      </button>
    );
  }

  const label = 'block text-[10px] font-medium uppercase tracking-wider text-[#8e8ea6] mb-1.5';
  return (
    <div className="fixed bottom-4 left-4 z-[70] w-[300px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl border border-[#e4e4ed] bg-white p-4 text-[12px] text-[#171730] shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-medium">Prototype controls</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-0.5 text-[#5f5f7a] hover:bg-[#f4f4f8]">–</button>
          <button type="button" title="Hide (bring back with ?demo=1)" onClick={() => { window.localStorage.setItem('siherdefi_demo_hidden', '1'); setHidden(true); }} className="rounded-md px-2 py-0.5 text-[#5f5f7a] hover:bg-[#f4f4f8]">✕</button>
        </div>
      </div>
      <p className="mb-3 rounded-lg bg-[#f6f3fe] p-2.5 text-[11px] leading-relaxed text-[#5b21b6]">
        Everything runs on a simulated backend in this browser. Sign in with any email; any 6-digit code works (000000 = wrong code).
      </p>

      <span className={label}>Jump to a stage</span>
      <div className="mb-4 space-y-1">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => go(p)} className="block w-full rounded-lg border border-[#ececf2] px-2.5 py-1.5 text-left hover:border-[#7c2ae8] hover:bg-[#faf7ff]">{p.label}</button>
        ))}
      </div>

      <span className={label}>Wallet behaviour</span>
      <select value={demo.flags.walletMode} onChange={(e) => flag('walletMode', e.target.value as WalletMode)} className="mb-4 w-full rounded-lg border border-[#e2e2ec] px-2 py-1.5">
        {WALLET_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
      </select>


      <span className={label}>Errors & outcomes</span>
      <div className="mb-4 space-y-1.5">
        <label className="flex items-center gap-2"><input type="checkbox" checked={demo.flags.emailNotFound} onChange={(e) => flag('emailNotFound', e.target.checked)} /> Email not on the applicant list</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={demo.flags.wrongCode} onChange={(e) => flag('wrongCode', e.target.checked)} /> Every code is wrong</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={demo.flags.quizMode === 'fail'} onChange={(e) => flag('quizMode', e.target.checked ? 'fail' : 'pass')} /> Quiz: question 2 always wrong</label>
      </div>

      <span className={label}>Today’s date</span>
      <div className="mb-4 flex items-center gap-2">
        <input type="date" value={(demo.flags.now ?? new Date().toISOString()).slice(0, 10)} onChange={(e) => flag('now', e.target.value ? `${e.target.value}T15:00:00.000Z` : null)} className="flex-1 rounded-lg border border-[#e2e2ec] px-2 py-1" />
        <button type="button" onClick={() => flag('now', DEFAULT_NOW)} className="rounded-lg border border-[#e2e2ec] px-2 py-1 hover:bg-[#f4f4f8]">Oct 9</button>
      </div>

      <button type="button" onClick={() => go(PRESETS[0])} className="w-full rounded-lg bg-[#171730] py-2 font-medium text-white hover:bg-black">Reset everything</button>
    </div>
  );
}
