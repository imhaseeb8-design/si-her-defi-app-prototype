'use client';
// Public certificate verification page (linked from the certificate). Not captured from the live app —
// it needs a real issued certificate — so this layout is an approximation built from the certificate card.
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CertificateArt } from '@/components/certificate/CertificateArt';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { assetPath, certificateApi } from '@/lib/api';
import type { Certificate } from '@/lib/types';

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => { certificateApi.verifyPublic(code).then(setCert).catch(() => setMissing(true)); }, [code]);

  return (
    <div className="min-h-screen bg-[#f8f8fc] text-[#171730]">
      <header className="flex h-16 items-center justify-between border-b border-[#ececf2] bg-white px-6 sm:px-10">
        <Link href="/login"><Image alt="Si Her DeFi Artwork" width={100} height={100} src={assetPath('/Logo · SI HER DeFi.png')} style={{ width: 'auto', height: 'auto' }} /></Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4ed] bg-[#f9fafc] px-3 py-1 text-[10px] font-bold"><span className="size-2 rounded-full bg-[#0052ff]" />Verified on Base</span>
      </header>
      <main className="mx-auto max-w-[760px] px-4 py-10 space-y-5">
        {missing ? (
          <div className="rounded-2xl border border-[#ececf2] bg-white p-8 text-center">
            <p className="text-[16px] font-bold">No certificate matches “{code}”</p>
            <p className="mt-1 text-[12.5px] text-[#5f5f7a]">Check the link or credential ID and try again.</p>
          </div>
        ) : !cert ? (
          <div className="grid min-h-[50vh] place-items-center text-[#7c2ae8]"><Spinner className="size-6" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[12.5px] text-[#166534]">
              <span className="grid size-5 place-items-center rounded-full bg-[#16a34a] text-[11px] font-bold text-white">✓</span>
              Valid credential · issued to <strong>{cert.recipientName}</strong> · ID {cert.verificationCode}
            </div>
            <CertificateArt cert={cert} preview={false} weekTitles={{}} />
          </>
        )}
      </main>
    </div>
  );
}
