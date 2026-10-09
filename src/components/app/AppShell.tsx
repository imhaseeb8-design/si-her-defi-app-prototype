'use client';
// Signed-in layout: desktop sidebar (collapsible), mobile top bar + drawer, account menu.
// Markup mirrors the live app (captures D01, D05, M07, M08).
import Image from 'next/image';
import Link from 'next/link';
import { NavItem } from '@/components/ui/NavItem';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { assetPath, authApi } from '@/lib/api';
import { useSession } from './SessionProvider';

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const DEFAULT_AVATAR = '/ada-portrait.jpg'; // live app's fallback avatar when no photo is set

const GearPath = 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z';

const Icon = {
  // home-09, from the Figma "Sidebar item" component
  dashboard: (<svg viewBox="0 0 18 18" aria-hidden="true" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M9.75 10.1274H8.25C7.6287 10.1274 7.125 10.6311 7.125 11.2524V15.3759C7.125 15.7904 6.78835 16.1274 6.3739 16.1233C4.63003 16.1058 3.661 16 3.01885 15.3578C2.25 14.589 2.25 13.3516 2.25 10.8767V8.99386C2.25 7.73296 2.25 7.10251 2.51693 6.55675C2.78384 6.01099 3.2815 5.62392 4.27681 4.84979L5.77682 3.68312C7.32517 2.47885 8.09933 1.87671 9 1.87671C9.90067 1.87671 10.6748 2.47885 12.2232 3.68312L13.7232 4.84978C14.7185 5.62392 15.2162 6.01099 15.4831 6.55675C15.75 7.10251 15.75 7.73296 15.75 8.99386V10.8767C15.75 13.3516 15.75 14.589 14.9812 15.3578C14.339 16 13.37 16.1058 11.6261 16.1233C11.2117 16.1274 10.875 15.7904 10.875 15.3759V11.2524C10.875 10.6311 10.3713 10.1274 9.75 10.1274Z" /></svg>),
  certificate: (<svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /><polyline points="15 13 18 22 12 19 6 22 9 13" /></svg>),
  settings: (cls = 'size-[18px]') => (<svg viewBox="0 0 24 24" aria-hidden="true" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={GearPath} /><circle cx="12" cy="12" r="3" /></svg>),
  lock: (<svg viewBox="0 0 20 20" aria-hidden="true" className="ml-auto size-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="9" width="10" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>),
  collapse: (<svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="14" height="14" rx="2" /><line x1="8" y1="3" x2="8" y2="17" /></svg>),
};

/** New Si Her DeFi wordmark (diamond + type), 22px tall in the sidebar and top bar. */
const Logo = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img alt="Si Her DeFi" src={assetPath('/v2/logo-wordmark.png')} width={120} height={22} className="block h-[22px] w-[120px] max-w-none" />
);

/* Sidebar motion: width slides on an ease-out curve; labels fade (out at once on collapse, in after a
   short delay on expand so text never spills while the panel is still narrow). Padding never changes,
   so icons stay exactly where they are. */
const EASE = 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';
const fade = (collapsed: boolean) => `transition-opacity ${collapsed ? 'opacity-0 duration-100' : 'opacity-100 duration-200 delay-100'} motion-reduce:transition-none`;
/** Folds a block's height away when collapsed (grid-rows 1fr → 0fr) while fading it. */
function Fold({ collapsed, children, className = '' }: { collapsed: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`grid transition-[grid-template-rows,opacity,margin] ${EASE} ${collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'} ${className}`} aria-hidden={collapsed}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function Avatar({ src, name, className }: { src?: string | null; name?: string; className: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-black/10 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={name ?? ''} className="absolute inset-0 size-full object-cover" src={src || assetPath(DEFAULT_AVATAR)} />
    </div>
  );
}

function Nav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const { certificateUnlocked } = useSession();
  const fadeCls = fade(collapsed);
  return (
    <>
      <NavItem href="/dashboard" icon={Icon.dashboard} label="Dashboard" labelClassName={fadeCls} onNavigate={onNavigate}
        selected={path.startsWith('/dashboard') || path.startsWith('/module') || path.startsWith('/onboard')} />
      <NavItem href="/certificate" icon={Icon.certificate} label="Certificate" labelClassName={fadeCls} onNavigate={onNavigate}
        selected={path.startsWith('/certificate')} locked={!certificateUnlocked} lockIcon={Icon.lock}
        lockedHint="Unlocks once you finish every session and quiz" />
      <NavItem href="/settings" icon={Icon.settings()} label="Settings" labelClassName={fadeCls} onNavigate={onNavigate}
        selected={path.startsWith('/settings')} />
    </>
  );
}

/** Wallet + network in one chip: "Powered by ● BASE" on top, your address (or Connect) below. */
function WalletChip({ wallet }: { wallet: string | null }) {
  const router = useRouter();
  return (
    <div className="rounded-xl border border-[#e4e4ed] bg-[#f9fafc] px-3 py-2.5">
      <div className="flex items-center gap-1.5 leading-none">
        <span className="text-[10.5px] text-[#8688ae]">Powered by</span>
        <span className="size-1.5 rounded-full bg-[#0052ff]" />
        <span className="text-[11px] font-medium tracking-[0.02em] text-[#0052ff]">BASE</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#ececf2] pt-2 text-[11.5px]">
        {wallet ? (
          <>
            <a href={`https://basescan.org/address/${wallet}`} target="_blank" rel="noopener noreferrer" className="tabular-nums font-medium text-[#171730] transition hover:text-[#0052ff]" title="View on BaseScan">{short(wallet)}</a>
            <span className="flex items-center gap-1.5 text-[11px] text-[#16a34a]"><span className="size-1.5 rounded-full bg-[#22c55e]" />Connected</span>
          </>
        ) : (
          <>
            <span className="text-[#8e8ea6]">No wallet connected</span>
            <button type="button" onClick={() => router.push('/wallet')} className="cursor-pointer text-[11px] font-medium text-[#7c2ae8] hover:underline">Connect</button>
          </>
        )}
      </div>
    </div>
  );
}

function useSignOut() {
  const router = useRouter();
  return async () => { await authApi.logout(); router.replace('/login'); };
}

function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const { profile } = useSession();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-2.5 pl-1">
          <button type="button" onClick={() => setOpen((o) => !o)} className="shrink-0 cursor-pointer rounded-full" title={profile?.name ?? 'Account'} aria-label="Open account menu">
            <Avatar src={profile?.photoUrl} name={profile?.name} className="size-8" />
          </button>
          <div className={`min-w-0 ${fade(collapsed)}`}>
            <p className="truncate text-[12px] font-medium text-[#171730] leading-tight">{profile?.name}</p>
            <p className="truncate text-[10.5px] text-[#8e8ea6] leading-tight mt-0.5">{profile?.role}</p>
          </div>
        </div>
        <button type="button" tabIndex={collapsed ? -1 : 0} onClick={() => setOpen((o) => !o)} className={`shrink-0 p-1.5 rounded-lg transition cursor-pointer ${fade(collapsed)} ${open ? 'bg-gray-100 text-[#171730]' : 'text-[#8e8ea6] hover:text-[#171730] hover:bg-gray-100'}`} title="Account options" aria-label="Account options" aria-expanded={open}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="currentColor"><circle cx="5" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" /></svg>
        </button>
      </div>
      {open && (
        <div className={`absolute bottom-12 left-0 rounded-2xl border border-[#e4e4ed] bg-white p-2 shadow-2xl z-50 ${collapsed ? 'w-[220px]' : 'right-0 w-full'}`}>
          <div className="flex items-center gap-2.5 p-2 border-b border-[#f0f0f5]">
            <Avatar src={profile?.photoUrl} name={profile?.name} className="size-8" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#171730]">{profile?.name}</p>
              <p className="truncate text-[10.5px] text-[#8e8ea6]">{profile?.role}</p>
            </div>
          </div>
          <div className="py-1 space-y-0.5">
            <Link className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium text-[#5f5f7a] hover:bg-[#f9f9fc] hover:text-[#171730] transition" href="/settings#profile">
              <svg viewBox="0 0 24 24" className="size-4 text-[#8e8ea6]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span>Edit profile</span>
            </Link>
            <Link className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium text-[#5f5f7a] hover:bg-[#f9f9fc] hover:text-[#171730] transition" href="/settings">
              {Icon.settings('size-4 text-[#8e8ea6]')}<span>Settings</span>
            </Link>
          </div>
          <div className="pt-1 border-t border-[#f0f0f5]">
            <button type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 transition cursor-pointer">
              <svg viewBox="0 0 24 24" className="size-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const { profile, wallet } = useSession();
  const signOut = useSignOut();
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" aria-hidden="true" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 z-50 flex w-[290px] max-w-[85vw] flex-col justify-between bg-white p-5 shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#ececf2]">
            <Link className="flex items-center gap-2.5" href="/dashboard" onClick={onClose}><Logo /></Link>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#8e8ea6] hover:bg-gray-100 hover:text-[#171730] transition cursor-pointer" aria-label="Close menu">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <nav className="mt-6 space-y-1.5"><Nav onNavigate={onClose} /></nav>
        </div>
        <div className="space-y-3 pt-4 border-t border-[#ececf2]">
          <WalletChip wallet={wallet} />
          <div className="rounded-xl border border-[#ececf2] bg-white p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar src={profile?.photoUrl} name={profile?.name} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-[#171730]">{profile?.name}</p>
                <p className="truncate text-[11px] text-[#8e8ea6]">{profile?.role}</p>
              </div>
            </div>
            <div className="space-y-1 pt-1 border-t border-[#f0f0f5]">
              <Link onClick={onClose} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#5f5f7a] hover:bg-gray-50 hover:text-[#171730] transition" href="/settings#profile">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3.5 text-[#8e8ea6]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m13.5 3.5 3 3L6 17H3v-3L13.5 3.5z" /></svg>
                <span>Edit profile</span>
              </Link>
              <Link onClick={onClose} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#5f5f7a] hover:bg-gray-50 hover:text-[#171730] transition" href="/settings">
                {Icon.settings('size-3.5')}<span>Settings</span>
              </Link>
              <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition cursor-pointer">
                <svg viewBox="0 0 24 24" className="size-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { wallet } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setDrawer(false); }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8f8fc] font-sans antialiased text-[#171730]">
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[#ececf2] bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link className="flex items-center gap-2" href="/dashboard"><Logo /></Link>
        <div className="flex items-center gap-2">
          {wallet ? (
            <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4ed] bg-white px-2.5 py-1 text-[11px] shadow-2xs" title={short(wallet)}>
              <span className="size-1.5 rounded-full bg-[#0052ff]" /><span className="font-medium text-[#151534]">Base</span>
              <span className="h-2.5 w-px bg-[#e7e7f1]" /><span className="size-1.5 rounded-full bg-[#16a34a]" /><span className="font-medium text-[#15803d]">Active</span>
            </button>
          ) : (
            <Link href="/wallet" className="inline-flex items-center rounded-full border border-[#e4d7fb] bg-[#f6f0ff] px-2.5 py-1 text-[11px] font-medium text-[#7c2ae8]">Connect</Link>
          )}
          <button type="button" onClick={() => setDrawer(true)} className="rounded-lg p-1.5 text-[#5f5f7a] hover:bg-gray-100 hover:text-[#171730] transition cursor-pointer" aria-label="Open mobile menu">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
          </button>
        </div>
      </header>
      {drawer && <MobileDrawer onClose={() => setDrawer(false)} />}

      <aside className={`sticky top-3 my-3 ml-3 h-[calc(100vh-1.5rem)] hidden md:flex flex-col justify-between rounded-2xl border border-[#ececf2] bg-white shadow-[0_1px_3px_rgba(23,23,48,0.04),0_10px_28px_-18px_rgba(23,23,48,0.12)] transition-[width] ${EASE} z-30 shrink-0 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <div className="px-4 py-6">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {/* the wordmark slides shut as the panel narrows; the toggle settles into the centre */}
            <Link href="/dashboard" tabIndex={collapsed ? -1 : 0} className={`block overflow-hidden transition-[width,opacity] ${EASE} ${collapsed ? 'w-0 opacity-0' : 'w-[120px] opacity-100'}`}><Logo /></Link>
            <button type="button" onClick={() => setCollapsed((c) => !c)} className="rounded-lg p-1.5 text-[#8e8ea6] hover:bg-gray-100 hover:text-[#171730] transition-colors cursor-pointer" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {Icon.collapse}
            </button>
          </div>
          <nav className="mt-8 space-y-1.5"><Nav collapsed={collapsed} /></nav>
        </div>
        <div className="border-t border-[#f0f0f5] px-4 py-4">
          <Fold collapsed={collapsed} className={collapsed ? 'mb-0' : 'mb-4'}><WalletChip wallet={wallet} /></Fold>
          <AccountMenu collapsed={collapsed} />
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-8 lg:px-14 sm:py-8 overflow-y-auto">{children}</main>
    </div>
  );
}
