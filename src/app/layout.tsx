import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { DemoPanel } from '@/components/demo/DemoPanel';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Si Her DeFi Certification',
  description: 'Verify your email to claim your seat in the Si Her DeFi cohort. Twelve partner-led modules and an on-chain certificate on Base.',
  // Si Her DeFi crystal on the brand gradient (public/icon.svg, with PNG fallbacks)
  icons: {
    icon: [{ url: '/siherdefi/icon.svg', type: 'image/svg+xml' }, { url: '/siherdefi/icon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/siherdefi/apple-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
