// Wallet logos exactly as drawn in the live app's wallet chooser.
export const MetaMaskIcon = () => (
  <svg viewBox="0 0 40 40" className="size-8" fill="none">
    <rect width="40" height="40" rx="10" fill="#F6F1ED" />
    <g transform="translate(6,6) scale(0.7)">
      <path d="M34.354 3.5L20.688 13.438l2.563-6.05L34.354 3.5z" fill="#E2761B" stroke="#E2761B" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.633 3.5l13.55 10.031-2.437-6.143L5.633 3.5z" fill="#E4761B" stroke="#E4761B" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29.292 26.594l-3.641 5.578 7.79 2.147 2.236-7.606-6.385-.12zM4.338 26.713l2.222 7.606 7.79-2.147-3.641-5.578-6.37.12z" fill="#E4761B" stroke="#E4761B" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.918 17.556l-2.168 3.279 7.724.342-.28-8.289-5.276 4.668zM26.069 17.556l-5.344-4.762-.174 8.383 7.71-.342-2.192-3.28z" fill="#E4761B" stroke="#E4761B" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.35 32.172l4.654-2.267-4.008-3.131-.646 5.398zM20.983 29.905l4.654 2.267-.632-5.398-4.022 3.131z" fill="#E4761B" stroke="#E4761B" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const CoinbaseIcon = () => (
  <svg viewBox="0 0 40 40" className="size-8" fill="none">
    <rect width="40" height="40" rx="10" fill="#0052FF" />
    <circle cx="20" cy="20" r="11" fill="#fff" />
    <rect x="14" y="17" width="12" height="6" rx="3" fill="#0052FF" />
  </svg>
);

export const RainbowIcon = () => (
  <svg viewBox="0 0 40 40" className="size-8" fill="none">
    <rect width="40" height="40" rx="10" fill="#001E59" />
    <path d="M9 29v-3.2c0-8.2 6.6-14.8 14.8-14.8H29v3.2h-5.2c-6.4 0-11.6 5.2-11.6 11.6V29H9z" fill="#FF4000" />
    <path d="M12.2 29v-3.2c0-6.4 5.2-11.6 11.6-11.6H29v3.2h-5.2c-4.6 0-8.4 3.8-8.4 8.4V29h-3.2z" fill="#FFD400" />
    <path d="M15.4 29v-3.2c0-4.6 3.8-8.4 8.4-8.4H29v3.2h-5.2c-2.9 0-5.2 2.3-5.2 5.2V29h-3.2z" fill="#00DB5E" />
    <path d="M18.6 29v-3.2c0-2.9 2.3-5.2 5.2-5.2H29V29H18.6z" fill="#00AAFF" />
  </svg>
);

export const OneInchIcon = () => (
  <svg viewBox="0 0 40 40" className="size-8" fill="none">
    <rect width="40" height="40" rx="10" fill="#000000" />
    <path d="M12.9958 30.3368H27.004V27.3877H21.8431V9.6637H18.776C18.658 12.1409 17.9503 12.7602 14.5588 12.7602H12.9958V15.5914H18.1567V27.3877H12.9958V30.3368Z" fill="#ffffff" />
    <path d="M28.4786 15.5919V9.66418H25.5295V15.5919H28.4786Z" fill="#ffffff" />
    <path d="M33.6651 15.5919V9.66418H30.716V15.5919H33.6651Z" fill="#ffffff" />
  </svg>
);

export const WalletConnectIcon = ({ className = 'size-8' }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    <rect width="40" height="40" rx="10" fill="#3B99FC" />
    <path d="M12.5 17.5c4.14-4.05 10.86-4.05 15 0l.5.49a.52.52 0 0 1 0 .74l-1.71 1.67a.27.27 0 0 1-.38 0l-.69-.67c-2.89-2.82-7.58-2.82-10.47 0l-.74.72a.27.27 0 0 1-.38 0L11.94 18.7a.52.52 0 0 1 0-.74l.56-.46zm18.52 3.45 1.52 1.49a.52.52 0 0 1 0 .74l-6.87 6.71a.54.54 0 0 1-.76 0l-4.87-4.76a.14.14 0 0 0-.19 0l-4.87 4.76a.54.54 0 0 1-.76 0L7.46 23.18a.52.52 0 0 1 0-.74l1.52-1.49a.54.54 0 0 1 .76 0l4.87 4.76a.14.14 0 0 0 .19 0l4.87-4.76a.54.54 0 0 1 .76 0l4.87 4.76a.14.14 0 0 0 .19 0l4.87-4.76a.54.54 0 0 1 .76 0z" fill="#fff" />
  </svg>
);

export const QrGlyph = () => (
  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
  </svg>
);
