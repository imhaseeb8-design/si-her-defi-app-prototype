'use client';
// Stand-in for the third-party Reown AppKit modals the live app opens (captures C06, C07, C10).
// Only the look is approximated; the real app renders Reown's own web component.
import type { ReactNode } from 'react';
import { OneInchIcon, WalletConnectIcon } from './WalletIcons';

function Frame({ title, onClose, left, children }: { title: string; onClose: () => void; left?: ReactNode; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-[360px] rounded-[30px] border border-white/5 bg-[#191a1a] p-4 text-[#e4e7e7] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="grid size-8 place-items-center text-[#9a9a9a]">{left}</span>
          <p className="text-[15px] font-medium">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-[#9a9a9a] hover:bg-white/5">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Row = ({ icon, label, tag, onClick, muted }: { icon: ReactNode; label: string; tag?: string; onClick?: () => void; muted?: boolean }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2.5 text-left text-[14px] hover:bg-white/[0.08] ${muted ? 'text-[#9a9a9a]' : ''}`}>
    <span className="grid size-9 place-items-center overflow-hidden rounded-xl">{icon}</span>
    <span className="flex-1">{label}</span>
    {tag && <span className="rounded-md bg-[#2b6eff]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#6c9bff]">{tag}</span>}
    <span className="text-[#6b6b6b]">›</span>
  </button>
);

export function SwitchNetworkModal({ onSwitch, onDisconnect, onClose }: { onSwitch: () => void; onDisconnect: () => void; onClose: () => void }) {
  return (
    <Frame title="Switch Network" onClose={onClose}>
      <p className="px-4 pb-4 text-center text-[13px] leading-relaxed text-[#9a9a9a]">This app doesn’t support your current network. Switch to an available option to continue.</p>
      <Row icon={<span className="grid size-9 place-items-center rounded-full bg-[#0052ff] text-[11px] font-medium text-white">B</span>} label="Base" onClick={onSwitch} />
      <p className="py-2 text-center text-[12px] text-[#6b6b6b]">or</p>
      <Row icon={<span className="text-[16px]">⏏</span>} label="Disconnect" onClick={onDisconnect} muted />
    </Frame>
  );
}

export function ConnectWalletModal({ onPick, onClose }: { onPick: () => void; onClose: () => void }) {
  return (
    <Frame title="Connect Wallet" onClose={onClose} left={<span className="text-[15px]">?</span>}>
      <div className="space-y-2">
        <Row icon={<WalletConnectIcon className="size-9" />} label="WalletConnect" tag="QR CODE" onClick={onPick} />
        <Row icon={<OneInchIcon />} label="1inch Wallet" onClick={onPick} />
        <Row icon={<span className="grid size-9 place-items-center rounded-xl bg-[#1e5bff] text-white">W</span>} label="My Wallet" onClick={onPick} />
        <Row icon={<span className="grid size-9 place-items-center rounded-xl bg-[#3375bb] text-white">T</span>} label="Trust Wallet" onClick={onPick} />
        <Row icon={<span className="text-[15px]">⌕</span>} label="Search Wallet" tag="380+" onClick={onPick} muted />
      </div>
      <p className="mt-4 text-center text-[11px] text-[#6b6b6b]">UX by <span className="rounded bg-white/10 px-1">/ /</span> reown</p>
    </Frame>
  );
}

export function QrModal({ name, onScanned, onClose }: { name: string; onScanned: () => void; onClose: () => void }) {
  return (
    <Frame title={name} onClose={onClose} left={<span className="text-[15px]">‹</span>}>
      <div className="mx-auto grid size-[220px] place-items-center rounded-3xl bg-white p-4">
        <div className="grid size-full grid-cols-9 gap-0.5">
          {Array.from({ length: 81 }).map((_, i) => (
            <span key={i} className={((i * 37) % 7 < 3 || [0, 1, 2, 9, 18, 6, 7, 8, 17, 26, 54, 63, 72, 73, 74].includes(i)) ? 'bg-black rounded-[2px]' : ''} />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[13px] text-[#9a9a9a]">Scan this QR code with your phone</p>
      <button type="button" onClick={onScanned} className="mt-3 w-full rounded-2xl bg-white/[0.06] py-2.5 text-[12.5px] text-[#c9c9c9] hover:bg-white/[0.1]">Prototype: simulate scan & approve</button>
    </Frame>
  );
}
