'use client';
// "Connect your wallet" (captures C01–C10). The live app uses wagmi + Reown AppKit; here the wallet is
// simulated and its behaviour is picked in the Prototype panel (no wallet / MetaMask / reject / wrong network).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OnboardingShell, Spinner } from '@/components/onboarding/OnboardingShell';
import { ConnectWalletModal, QrModal, SwitchNetworkModal } from '@/components/wallet/ReownModal';
import { CoinbaseIcon, MetaMaskIcon, OneInchIcon, QrGlyph, RainbowIcon, WalletConnectIcon } from '@/components/wallet/WalletIcons';
import { errorMessage, profileApi, walletApi } from '@/lib/api';
import { useDemo } from '@/lib/hooks/useDemo';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { DEMO_ADDRESS } from '@/lib/mock/server';

type Phase = { status: 'idle' } | { status: 'connecting' } | { status: 'signing'; address: string } | { status: 'connected'; address: string } | { status: 'disconnecting'; address: string } | { status: 'error'; message: string };
type Modal = null | 'switch' | 'reown' | { qr: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const REJECT_CONNECT = 'Connection rejected. Please approve the request in your wallet.';
const REJECT_SIGN = "Signature request rejected. Please approve it in your wallet to link it — it's free and doesn't send a transaction.";

const BaseChip = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4ed] bg-[#f9fafc] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#171730]">
    <span className="size-2 rounded-full bg-[#0052ff]" />BASE MAINNET
  </span>
);

const NotInstalled = ({ href, name, icon }: { href: string; name: string; icon: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 rounded-xl border border-dashed border-[#dcdce8] bg-white/70 px-4 py-3 transition hover:border-[#bdbdce] hover:bg-white group">
    {icon}
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-semibold text-[#5f5f7a] group-hover:text-[#171730] transition">{name}</p>
      <p className="text-[11px] text-[#9ca3af]">Not installed — click to get it ↗</p>
    </div>
  </a>
);

export default function WalletPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const demo = useDemo();
  const mode = demo.flags.walletMode;
  const detected = mode !== 'none';
  const [phase, setPhase] = useState<Phase>({ status: 'idle' });
  const [modal, setModal] = useState<Modal>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await profileApi.getProfile().catch(() => null);
      if (!profile?.name?.trim()) { router.replace('/profile'); return; }
      const st = await walletApi.getStatus().catch(() => null);
      if (st?.connected && st.address) setPhase({ status: 'connected', address: st.address.toLowerCase() });
      setReady(true);
    })();
  }, [router]);

  // Sign the backend nonce and link the address (live: personal_sign → POST /wallet/connect).
  const link = async (address: string) => {
    setPhase({ status: 'signing', address });
    try {
      await walletApi.getNonce();
      await wait(1800);
      if (mode === 'reject-sign') throw new Error(REJECT_SIGN);
      await walletApi.connect(address, '0x2105', `0x${'ab'.repeat(65)}`);
      setPhase({ status: 'connected', address: address.toLowerCase() });
    } catch (e) {
      setPhase({ status: 'error', message: errorMessage(e) });
    }
  };

  const connectInjected = async () => {
    setPhase({ status: 'connecting' });
    await wait(1600);
    if (mode === 'reject-connect') { setPhase({ status: 'error', message: REJECT_CONNECT }); return; }
    if (mode === 'wrong-network') { setModal('switch'); return; }
    await link(DEMO_ADDRESS);
  };

  const disconnect = async () => {
    if (phase.status !== 'connected') return;
    setPhase({ status: 'disconnecting', address: phase.address });
    await walletApi.disconnect().catch(() => {});
    setPhase({ status: 'idle' });
  };

  const showConnected = phase.status === 'signing' || phase.status === 'connected' || phase.status === 'disconnecting';
  const address = 'address' in phase ? phase.address : '';

  return (
    <OnboardingShell right={{ kind: 'account', email: user?.email ?? '' }} step={2} aside="wallet">
      <div className="w-full">
        <div className="w-full space-y-4">
          <Link className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7c2ae8] transition-colors hover:underline" href="/profile">← Back to profile</Link>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#171730]">Connect your wallet</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f5f7a]">This is where your certificate mints at the end of the cohort. We only read your address — no funds needed.</p>
          </div>

          {!ready ? (
            <div className="grid h-40 place-items-center text-[#7c2ae8]"><Spinner className="size-5" /></div>
          ) : showConnected ? (
            <div className="w-full space-y-5">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-6 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
                  <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#171730]">Wallet connected</p>
                  <p className="mt-1 font-mono text-[12px] text-[#5f5f7a]">{short(address)}</p>
                </div>
                <BaseChip />
                {phase.status === 'signing' ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] px-2.5 py-1 text-[11px] font-medium text-[#6d25d6]">
                    <Spinner className="size-3.5" />Sign the message in your wallet to link it
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 border border-emerald-300/50 rounded-lg px-2.5 py-1">
                    <svg viewBox="0 0 16 16" className="size-3.5 text-emerald-600" fill="currentColor">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>Linked to your Si Her account
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[#e4e4ed] bg-[#f9fafc] px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#8e8ea6] uppercase">Address</span>
                <span className="font-mono text-[11.5px] text-[#171730] break-all text-right">{address}</span>
              </div>
              <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e2ec] px-4 py-2.5 text-[12.5px] font-semibold text-[#5f5f7a] transition hover:bg-gray-50 hover:text-[#171730]">
                <span className="size-2 rounded-full bg-[#0052ff]" />View on BaseScan ↗
              </a>
              {phase.status === 'connected' ? (
                <Link className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#501c9c] via-[#6d25d6] to-[#983cf4] px-4 py-3.5 text-[14.5px] font-semibold text-white shadow-md shadow-purple-950/20 transition hover:brightness-105 active:scale-[0.99]" href="/dashboard">
                  Go to my dashboard <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <span aria-disabled="true" className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#501c9c] via-[#6d25d6] to-[#983cf4] px-4 py-3.5 text-[14.5px] font-semibold text-white opacity-50">
                  Go to my dashboard <span aria-hidden="true">→</span>
                </span>
              )}
              <button type="button" onClick={disconnect} disabled={phase.status !== 'connected'} className="w-full text-center text-[11.5px] text-[#8e8ea6] hover:text-[#5f5f7a] transition cursor-pointer disabled:opacity-50">
                {phase.status === 'connected' ? 'Connect a different wallet' : 'Disconnecting…'}
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold tracking-wider text-[#8e8ea6] uppercase">Choose wallet</p>
                <BaseChip />
              </div>
              <div className="space-y-2.5">
                {detected ? (
                  <button type="button" onClick={connectInjected} disabled={phase.status === 'connecting'} className="flex w-full items-center gap-3.5 rounded-xl border border-[#e4e4ed] bg-white px-4 py-3 text-left transition hover:border-[#7c2ae8]/40 hover:bg-[#faf7ff] hover:shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group">
                    <MetaMaskIcon />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#171730]">MetaMask</p>
                      <p className="text-[11px] text-[#8e8ea6]">{phase.status === 'connecting' ? 'Approve in your wallet…' : 'Ready to connect'}</p>
                    </div>
                    {phase.status === 'connecting' ? (
                      <Spinner className="size-4 text-[#7c2ae8]" />
                    ) : (
                      <svg viewBox="0 0 16 16" className="size-4 text-[#c4c4d4] group-hover:text-[#7c2ae8] transition" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
                    )}
                  </button>
                ) : (
                  <NotInstalled href="https://metamask.io/download/" name="MetaMask" icon={<MetaMaskIcon />} />
                )}
                <NotInstalled href="https://www.coinbase.com/wallet/downloads" name="Coinbase Wallet" icon={<CoinbaseIcon />} />
                <NotInstalled href="https://rainbow.me/download" name="Rainbow" icon={<RainbowIcon />} />
                <div className="w-full rounded-xl border border-[#e4e4ed] bg-white px-4 py-3 hover:border-[#6d25d6] hover:bg-[#fbfaff] transition shadow-xs group">
                  <div className="flex items-center justify-between gap-3.5">
                    <button type="button" onClick={() => setModal({ qr: '1inch Wallet' })} className="flex items-center gap-3.5 min-w-0 flex-1 text-left cursor-pointer">
                      <OneInchIcon />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-[#171730] group-hover:text-[#6d25d6] transition flex items-center gap-2"><span>1inch Wallet</span></p>
                        <p className="text-[11px] text-[#8e8ea6]">Scan QR with mobile app to connect or install</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => setModal({ qr: '1inch Wallet' })} className="rounded-full bg-[#ede9fe] text-[#6d25d6] hover:bg-[#ddd6fe] border border-[#ddd6fe] px-2.5 py-1 text-[10px] font-bold tracking-wider transition cursor-pointer flex items-center gap-1 shadow-2xs">
                        <QrGlyph /><span>QR CODE</span>
                      </button>
                      <a href="https://1inch.io/wallet/" target="_blank" rel="noopener noreferrer" title="Visit official website" className="p-1 rounded-lg text-[#9ca3af] hover:text-[#171730] hover:bg-gray-100 transition text-[11px]">↗</a>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setModal('reown')} className="w-full flex items-center justify-between gap-3.5 rounded-xl border border-[#e4e4ed] bg-white px-4 py-3 hover:border-[#6d25d6] hover:bg-[#fbfaff] transition text-left cursor-pointer group shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <WalletConnectIcon />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-[#171730] group-hover:text-[#6d25d6] transition">WalletConnect</p>
                      <p className="text-[11px] text-[#8e8ea6]">Scan with your mobile wallet app to connect</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#ede9fe] text-[#6d25d6] border border-[#ddd6fe] px-2.5 py-0.5 text-[10px] font-bold">QR CODE</span>
                </button>
              </div>
              {!detected && (
                <p className="text-center text-[11px] leading-relaxed text-[#9ca3af]">
                  No wallet extension detected.{' '}
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#7c2ae8] underline underline-offset-2">Install MetaMask</a> to get started.
                </p>
              )}
              {phase.status === 'error' && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">{phase.message}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {modal === 'switch' && (
        <SwitchNetworkModal
          onSwitch={() => { setModal(null); link(DEMO_ADDRESS); }}
          onDisconnect={() => { setModal(null); setPhase({ status: 'idle' }); }}
          onClose={() => { setModal(null); setPhase({ status: 'idle' }); }}
        />
      )}
      {modal === 'reown' && <ConnectWalletModal onPick={() => setModal({ qr: 'WalletConnect' })} onClose={() => setModal(null)} />}
      {modal && typeof modal === 'object' && (
        <QrModal name={modal.qr} onClose={() => setModal(null)} onScanned={() => { setModal(null); link(DEMO_ADDRESS); }} />
      )}
    </OnboardingShell>
  );
}
