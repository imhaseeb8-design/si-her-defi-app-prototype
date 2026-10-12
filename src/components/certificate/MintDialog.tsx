'use client';
// Minting the certificate on Base, step by step: review → confirm in your wallet → minting → minted.
// In the prototype the wallet signature and the transaction are simulated; the real app asks the
// connected wallet to sign, then sends the mint (gas covered by Si Her DAO) and waits for the receipt.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Arrow } from '@/components/ui/Arrow';
import { Check } from '@/components/ui/Check';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { certificateApi, errorMessage } from '@/lib/api';
import { shortAddress } from '@/lib/format';
import type { Certificate } from '@/lib/types';

type Step = 'review' | 'sign' | 'minting' | 'done' | 'error';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
    <span className="text-[#8e8ea6]">{label}</span>
    <span className="text-right font-medium text-[#171730]">{children}</span>
  </div>
);

const STEPS: { id: Step; label: string }[] = [
  { id: 'sign', label: 'Confirm in your wallet' },
  { id: 'minting', label: 'Writing to Base' },
  { id: 'done', label: 'Minted' },
];

export function MintDialog({ cert, onClose, onMinted }: { cert: Certificate; onClose: () => void; onMinted: (c: Certificate) => void }) {
  const [step, setStep] = useState<Step>('review');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Certificate | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && (step === 'review' || step === 'done' || step === 'error')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  const mint = async () => {
    setError('');
    setStep('sign');
    await wait(1600); // wallet signature prompt
    setStep('minting');
    try {
      const [c] = await Promise.all([certificateApi.mint(), wait(2600)]); // transaction + confirmation
      setResult(c);
      setStep('done');
      onMinted(c);
    } catch (e) {
      setError(errorMessage(e));
      setStep('error');
    }
  };

  const progress = (
    <ol className="mt-5 space-y-3 text-left">
      {STEPS.map((s, i) => {
        const at = STEPS.findIndex((x) => x.id === step);
        const state = i < at || step === 'done' ? 'done' : i === at ? 'now' : 'todo';
        return (
          <li key={s.id} className="flex items-center gap-3 text-[13.5px]">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${state === 'done' ? 'bg-[#16a34a] text-white' : state === 'now' ? 'bg-[#f4effe] text-[#7c2ae8]' : 'border border-[#e2e2ec] text-[#b4b4c4]'}`}>
              {state === 'done' ? <Check className="size-3.5" strokeWidth={2.6} /> : state === 'now' ? <Spinner className="size-3.5" /> : <span className="text-[11px]">{i + 1}</span>}
            </span>
            <span className={state === 'todo' ? 'text-[#a3a3b8]' : 'text-[#171730]'}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171730]/40 p-4 backdrop-blur-xs">
      <div role="dialog" aria-modal="true" aria-labelledby="mint-title" className="relative w-full max-w-[460px] rounded-3xl border border-[#ececf2] bg-white p-6 sm:p-7">
        {(step === 'review' || step === 'done' || step === 'error') && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute -right-3 -top-3 grid size-9 cursor-pointer place-items-center rounded-full border border-[#ececf2] bg-white text-[#5f5f7a] transition hover:bg-[#f8f8fc] hover:text-[#171730]">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        )}

        {step === 'review' && (
          <>
            <p className="text-[12px] text-[#7c2ae8]">Mint on Base</p>
            <h2 id="mint-title" className="mt-1 text-[21px] font-medium tracking-tight text-[#171730]">Mint your certificate</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#5f5f7a]">Your certificate becomes a soulbound token in your wallet: permanent, verifiable, and it can’t be transferred.</p>
            <div className="mt-4 divide-y divide-[#f0f0f5] rounded-2xl border border-[#ececf2] px-4">
              <Row label="Certificate">{cert.content.credentialName}</Row>
              <Row label="Badges">{cert.badges.length} of {cert.totalBadges}</Row>
              <Row label="Mints to"><span className="tabular-nums">{shortAddress(cert.walletAddress ?? '')}</span></Row>
              <Row label="Network"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0052ff]" />Base</span></Row>
              <Row label="Gas fee"><span className="text-[#16a34a]">Covered by Si Her DAO</span></Row>
            </div>
            <div className="mt-6 space-y-2.5 text-center">
              <Button onClick={mint} showIcon={false}>Mint on Base</Button>
              <button type="button" onClick={onClose} className="link-cta text-[12.5px] font-medium text-[#5f5f7a]">Not now</button>
            </div>
          </>
        )}

        {(step === 'sign' || step === 'minting') && (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f4effe] text-[#7c2ae8]"><Spinner className="size-6" /></span>
            <h2 id="mint-title" className="mt-4 text-[20px] font-medium tracking-tight text-[#171730]">{step === 'sign' ? 'Confirm in your wallet' : 'Minting on Base…'}</h2>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-6 text-[#5f5f7a]">
              {step === 'sign' ? 'Approve the signature request in your wallet. There’s no fee to pay.' : 'Writing your certificate to Base. This usually takes a few seconds; keep this window open.'}
            </p>
            {progress}
          </div>
        )}

        {step === 'done' && result && (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]"><Check className="size-7" /></span>
            <h2 id="mint-title" className="mt-4 text-[21px] font-medium tracking-tight text-[#171730]">Minted on Base</h2>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#5f5f7a]">Your Si Her DeFi certificate is in your wallet. Share it, add it to LinkedIn, or verify it any time.</p>
            <div className="mt-4 divide-y divide-[#f0f0f5] rounded-2xl border border-[#ececf2] px-4 text-left">
              <Row label="Token"><span className="tabular-nums">#{result.onChain.tokenId}</span></Row>
              <Row label="Transaction"><span className="tabular-nums">{shortAddress(result.onChain.txHash ?? '')}</span></Row>
            </div>
            <div className="mt-6 space-y-2.5">
              <Button onClick={onClose} showIcon={false}>View your certificate</Button>
              <a href={result.onChain.explorerUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[#e4d6fb] bg-[#f6f0fe] text-[15px] font-medium text-[#7c2ae8] transition hover:bg-[#efe5fd]">View on BaseScan <Arrow dir="up-right" /></a>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center">
            <h2 id="mint-title" className="text-[20px] font-medium tracking-tight text-[#171730]">Couldn’t mint your certificate</h2>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#5f5f7a]">{error || 'Something went wrong. Nothing was charged; you can try again.'}</p>
            <div className="mt-6 space-y-2.5">
              <Button onClick={mint} showIcon={false}>Try again</Button>
              <button type="button" onClick={onClose} className="link-cta text-[12.5px] font-medium text-[#5f5f7a]">Not now</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
