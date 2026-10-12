'use client';
// Onboarding Part 2 — a short close-out reflection. Opens once every session and its quiz are done;
// finishing it completes onboarding (2 of 2) and points to minting the certificate.
// Prototype content: the CMS has no Part 2 yet (see GET /onboard/part2 in the mock).
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LabelInput } from '@/components/ui/LabelInput';
import { Arrow } from '@/components/ui/Arrow';
import { Check } from '@/components/ui/Check';
import { useSession } from '@/components/app/SessionProvider';
import { onboardApi } from '@/lib/api';
import type { Part2 } from '@/lib/types';

export default function Part2Page() {
  const session = useSession();
  const [data, setData] = useState<Part2 | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onboardApi.getPart2().then((d) => { setData(d); setAnswers(d.progress.answers); setDone(!!d.progress.completedAt); }).catch(() => {});
  }, []);

  if (!data) return <div className="grid min-h-[60vh] place-items-center text-[#7c2ae8]"><Spinner className="size-6" /></div>;

  const back = <Link className="link-cta text-[12px] font-medium text-[#7c2ae8]" href="/dashboard"><Arrow dir="left" /> Back to dashboard</Link>;

  if (!data.unlocked) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {back}
        <div className="rounded-2xl border border-[#ececf2] bg-white p-6 space-y-3">
          <span className="text-[12px] text-[#a894c8]">Part 2 · Locked</span>
          <h1 className="text-[22px] font-medium tracking-tight text-[#171730]">Onboarding Part 2</h1>
          <p className="text-[13px] leading-6 text-[#5f5f7a]">It opens once you’ve finished every session and its quiz.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {back}
        <div className="rounded-2xl border border-[#ececf2] bg-white p-6 sm:p-8 text-center space-y-4">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]"><Check className="size-7" /></span>
          <div>
            <h1 className="text-[22px] font-medium tracking-tight text-[#171730]">Onboarding complete</h1>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#5f5f7a]">Thank you for closing out the cohort. One last step: mint your certificate on Base, with every badge you earned.</p>
          </div>
          <div className="mx-auto max-w-sm space-y-2.5 pt-1">
            <ButtonLink href="/certificate?mint=1">Mint your certificate</ButtonLink>
            <Link href="/dashboard" className="link-cta text-[12.5px] font-medium text-[#5f5f7a]">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const submit = async () => {
    const empty = data.questions.filter((q) => q.required && !answers[q.id]?.trim()).map((q) => q.id);
    setMissing(empty);
    if (empty.length) return;
    setBusy(true);
    try { await onboardApi.submitPart2(answers); setDone(true); session.refresh(); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {back}
      <div>
        <p className="text-[12px] text-[#7c2ae8]">Part 2 of 2</p>
        <h1 className="mt-1 text-[24px] sm:text-[26px] font-medium tracking-tight text-[#171730]">{data.title}</h1>
        <p className="mt-1 text-[13px] leading-6 text-[#5f5f7a]">{data.subtitle}</p>
      </div>
      <div className="rounded-2xl border border-[#ececf2] bg-white p-5 sm:p-6 space-y-6">
        {data.questions.map((q, i) => (
          <div key={q.id} className="space-y-2.5">
            <h2 className="text-[15px] font-medium text-[#171730]">
              <span className="mr-1.5 text-[#a894c8] tabular-nums">{i + 1}.</span>{q.question}
              {!q.required && <span className="ml-1.5 text-[12px] font-normal text-[#8e8ea6]">optional</span>}
            </h2>
            <LabelInput
              id={q.id} name={q.id} label={q.required ? 'Your answer' : 'Your answer (optional)'} multiline height={104} corner={12}
              maxLength={q.maxLength} placeholder={q.placeholder} value={answers[q.id] ?? ''} disabled={busy}
              invalid={missing.includes(q.id)} describedBy={missing.includes(q.id) ? `${q.id}-err` : undefined}
              onChange={(v) => { setAnswers({ ...answers, [q.id]: v }); if (missing.includes(q.id)) setMissing(missing.filter((x) => x !== q.id)); }}
            />
            <div className="flex items-start justify-between gap-3 text-[11.5px] text-[#8e8ea6]">
              <span id={`${q.id}-err`} className="text-red-500">{missing.includes(q.id) ? 'Add a short answer to continue.' : ''}</span>
              <span className="shrink-0">Max {q.maxLength} characters</span>
            </div>
          </div>
        ))}
        <div className="border-t border-[#f0f0f5] pt-5">
          <Button onClick={submit} loading={busy} loadingLabel="Submitting">Finish Part 2</Button>
        </div>
      </div>
    </div>
  );
}
