import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { DemoPanel } from '@/components/demo/DemoPanel';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Si Her DeFi',
  description: 'Verify your email to claim your seat in the Si Her DeFi cohort. Twelve partner-led modules and an on-chain certificate on Base.',
  icons: { icon: '/siherdefi/favicon.ico' },
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
