'use client';
// Split layout shared by sign-in, profile and wallet: header, 3-step progress, form column, artwork panel.
// Markup mirrors the live app (capture A01–C10).
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { assetPath, authApi } from '@/lib/api';

export type HeaderRight = { kind: 'registered' } | { kind: 'help' } | { kind: 'account'; email: string };

export function OnboardingHeader({ right }: { right: HeaderRight }) {
  const router = useRouter();
  const signOut = async () => {
    await authApi.logout();
    router.replace('/login');
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#ececf2] bg-white px-6 sm:px-10">
      <div className="flex items-center gap-3.5">
        <span className="flex items-center gap-2">
          <Image alt="Si Her DeFi Artwork" width={100} height={100} src={assetPath('/Logo · SI HER DeFi.png')} style={{ width: 'auto', height: 'auto' }} />
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-[#e4e4ed] bg-[#f9fafc] px-3 py-1 sm:inline-flex">
          <span className="text-[9px] font-medium text-[#8688ae]">Powered by</span>
          <span className="size-2 rounded-full bg-[#0052ff]" />
          <span className="text-[11px] font-medium text-[#0052ff]">BASE</span>
        </span>
      </div>
      <div className="text-[13px]">
        {right.kind === 'registered' && <span className="text-muted">Already registered? Use the same email to sign in.</span>}
        {right.kind === 'help' && (
          <a href="/help" className="font-medium text-brand transition-colors hover:text-brand-strong link-cta">Need help?</a>
        )}
        {right.kind === 'account' && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-[#e3e3ed] bg-white px-2.5 py-1 shadow-xs">
              <span className="grid size-4 place-items-center rounded-full bg-[#16a34a] text-white">
                <svg className="size-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2.5 6 5 8.5 9.5 3.5" />
                </svg>
              </span>
              <span className="text-[12px] font-medium text-[#171730]">{right.email}</span>
            </div>
            <button type="button" onClick={signOut} className="cursor-pointer text-[12.5px] font-medium text-[#7c2ae8] transition-colors hover:text-[#6922cf] link-cta">
              Not you?
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

const Check = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 6 5 8.5 9.5 3.5" />
  </svg>
);

/** step: 0 = email, 1 = profile, 2 = wallet */
export function Stepper({ step, zeroWidth = 'calc(0% - 0px)' }: { step: 0 | 1 | 2; zeroWidth?: string }) {
  const labels = ['Email verified', step >= 2 ? 'Profile created' : 'Create your profile', 'Connect a wallet'];
  const width = step === 0 ? zeroWidth : step === 1 ? 'calc(50% - 32px)' : 'calc(100% - 64px)';
  return (
    <div className="relative mb-8 w-full">
      <div className="absolute top-[10px] left-[32px] sm:left-[40px] right-[32px] sm:right-[40px] h-[2px] bg-[#e4e4ee]" />
      <div className="absolute top-[10px] left-[32px] sm:left-[40px] h-[2px] bg-[#7c2ae8] transition-all duration-300" style={{ width }} />
      <div className="relative flex justify-between">
        {labels.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={i} className="flex w-16 sm:w-20 flex-col items-center">
              {done ? (
                <div className="relative z-10 grid size-5 place-items-center rounded-full ring-4 ring-[#f7f7fb] transition-colors bg-[#7c2ae8] text-white shadow-xs"><Check /></div>
              ) : current ? (
                <div className="relative z-10 grid size-5 place-items-center rounded-full ring-4 ring-[#f7f7fb] transition-colors border-[2.5px] border-[#7c2ae8] bg-white shadow-xs">
                  <span className="size-2 rounded-full bg-[#7c2ae8]" />
                </div>
              ) : (
                <div className="relative z-10 grid size-5 place-items-center rounded-full ring-4 ring-[#f7f7fb] transition-colors border-[2px] border-[#dcdce8] bg-white" />
              )}
              <span className={`mt-2 text-center text-[10px] sm:text-[12px] leading-tight ${current ? 'font-medium text-[#171730]' : done ? 'font-normal text-[#6b7280]' : 'font-normal text-[#9ca3af]'}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  badge: (<><circle cx="12" cy="8.5" r="5" /><path d="m8.2 13.5-1.7 7.5 5.5-2.8 5.5 2.8-1.7-7.5" /></>),
  certificate: (<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></>),
  code: (<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>),
  gift: (<><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" rx="1" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>),
  wallet: (<><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 13a2 2 0 0 1 2-2h4v4h-4a2 2 0 0 1-2-2z" /><path d="M4 7V5a2 2 0 0 1 2-2h12" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>),
};

type AsideItem = { icon: keyof typeof ICONS; title: string; body: ReactNode };
const ASIDES: Record<'login' | 'profile' | 'wallet', { title: string; body: string; items: AsideItem[] }> = {
  login: {
    title: 'DeFi, taught by the people leading it.',
    body: 'Twelve partner-led modules, one live session a week, and an on-certificate demonstrating your DeFi credentials.',
    items: [
      { icon: 'badge', title: 'A badge for every module you pass', body: "Earned by quiz, carrying the partner's mark." },
      { icon: 'certificate', title: 'An on-chain certificate on Base', body: 'Verifiable, and addable to LinkedIn.' },
      { icon: 'code', title: 'Opportunities to stay engaged.', body: (<>Within <span className="underline underline-offset-2 hover:text-white cursor-pointer">{"Si<3>'s Ecosystem."}</span></>) },
    ],
  },
  profile: {
    title: 'Your name travels with every badge you earn.',
    body: 'At the end of the cohort, this is what’s written on the certificate you mint.',
    items: [
      { icon: 'gift', title: 'Free, for the whole cohort', body: 'No card, no fees, no token to buy.' },
      { icon: 'badge', title: 'A badge for every module you pass', body: "Earned by quiz, carrying the partner's mark." },
      { icon: 'certificate', title: 'An on-chain certificate on Base', body: 'Verifiable, and addable to LinkedIn.' },
    ],
  },
  wallet: {
    title: 'Your certification is yours, not ours.',
    body: 'It mints to your wallet on Base. Nothing here is held in an account we control.',
    items: [
      { icon: 'wallet', title: 'You keep what you earn', body: 'Your certificate stays in your wallet. Verifiable for a lifetime.' },
      { icon: 'gift', title: 'Connecting costs nothing', body: "No payment and no transaction — you're proving the wallet is yours." },
      { icon: 'clock', title: 'Takes about ten seconds', body: 'Pick your wallet, approve the request, done.' },
    ],
  },
};

export function OnboardingAside({ variant }: { variant: keyof typeof ASIDES }) {
  const a = ASIDES[variant];
  return (
    <aside className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#0d0f18] p-6 sm:p-12 min-h-[440px] lg:min-h-0 lg:p-16">
      <Image alt="Si Her DeFi Artwork" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-center" src={assetPath('/logIn.png')} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/85 pointer-events-none" />
      <div className="relative z-10 max-w-lg">
        <h2 className="text-[20px] font-medium tracking-tight text-white leading-snug">{a.title}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#FFFFFF] max-w-md">{a.body}</p>
      </div>
      <div className="relative z-10 mt-12 sm:mt-16">
        <div className="space-y-4 sm:space-y-4.5">
          {a.items.map((it) => (
            <div key={it.title} className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFFFFF] text-[#7B2FBE] backdrop-blur-md border border-[#DCC2F2] shadow-xs">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[it.icon]}</svg>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[13.5px] font-medium text-white leading-snug">{it.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-white/70">{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function OnboardingShell({ right, step, aside, zeroWidth, children }: {
  right: HeaderRight; step: 0 | 1 | 2; aside: 'login' | 'profile' | 'wallet'; zeroWidth?: string; children: ReactNode;
}) {
  // Desktop: the page is exactly the window — the form column scrolls on its own and the
  // artwork stays put, so there's never white space under either. Below lg it's one page.
  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f7fb] font-sans antialiased text-[#171730] lg:h-dvh">
      <OnboardingHeader right={right} />
      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="flex flex-2 justify-center bg-[#f7f7fb] px-4 py-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:py-8">
          <div className="w-full max-w-[440px] my-auto">
            <Stepper step={step} zeroWidth={zeroWidth} />
            {children}
          </div>
        </div>
        <OnboardingAside variant={aside} />
      </main>
    </div>
  );
}

export const cardClass = 'rounded-2xl sm:rounded-3xl border border-[#ececf2] bg-white p-5 sm:p-9 shadow-[0_2px_16px_rgba(23,23,48,0.03),0_12px_32px_-12px_rgba(23,23,48,0.06)]';


export const Spinner = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} animate-spin`} fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
