'use client';
// Onboarding Part 1 — "Welcome to Si Her DeFi" (captures E01–E15, M09–M10):
// watch the intro, follow SI<3> on X + LinkedIn, then 4 questions in a dialog. Progress saves as a draft.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LabelInput } from '@/components/ui/LabelInput';
import { onboardApi } from '@/lib/api';
import { tagCase } from '@/lib/format';
import type { Part1, Part1Progress } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

const embed = (url: string) => {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
};

type StepState = 'done' | 'current' | 'todo';
function Step({ n, state, title, sub }: { n: number; state: StepState; title: string; sub: string }) {
  const dot = state === 'done' ? 'bg-[#16a34a] text-white' : state === 'current' ? 'bg-[#7c2ae8] text-white' : 'border border-[#dcdce8] text-[#8e8ea6]';
  return (
    <div className="flex items-start gap-3">
      <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold mt-0.5 ${dot}`}>{state === 'done' ? '✓' : n}</span>
      <div>
        <p className="text-[13px] font-bold text-[#171730]">{title}</p>
        <p className="text-[11px] text-[#8e8ea6]">{sub}</p>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Part1 | null>(null);
  const [progress, setProgress] = useState<Part1Progress | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onboardApi.getPart1().then((d) => { setData(d); setProgress(d.progress); }).catch(() => {});
  }, []);

  if (!data || !progress) {
    return <div className="grid min-h-[60vh] place-items-center text-[#7c2ae8]"><Spinner className="size-6" /></div>;
  }

  const c = data.content;
  const socials = [...c.socials].sort((a, b) => a.order - b.order);
  const questions = [...c.questions].sort((a, b) => a.order - b.order);
  const required = socials.filter((s) => s.required);
  const followedCount = required.filter((s) => progress.followedSocialIds.includes(s.id)).length;
  const socialsDone = followedCount === required.length;
  const completed = progress.status === 'completed';
  const hasAnswers = Object.values(progress.answers).some((a) => a?.trim());

  const save = async (patch: Partial<Part1Progress>) => {
    const next = { ...progress, ...patch };
    setProgress(next);
    if (!completed) await onboardApi.saveDraft({ videoWatched: next.videoWatched, followedSocialIds: next.followedSocialIds, answers: next.answers }).catch(() => {});
  };

  const steps: StepState[] = (() => {
    const flags = [progress.videoWatched, socialsDone, completed];
    const firstOpen = flags.findIndex((f) => !f);
    return flags.map((f, i) => (f ? 'done' : i === firstOpen ? 'current' : 'todo'));
  })();

  const q = questionIndex !== null ? questions[questionIndex] : null;
  const answer = q ? progress.answers[q.id] ?? '' : '';
  const isLast = questionIndex === questions.length - 1;

  const submit = async () => {
    setBusy(true);
    await onboardApi.submitPart1({ videoWatched: progress.videoWatched, followedSocialIds: progress.followedSocialIds, answers: progress.answers });
    setProgress({ ...progress, status: 'completed' });
    setBusy(false);
    setQuestionIndex(null);
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7c2ae8] transition-colors hover:underline" href="/dashboard"><Arrow dir="left" /> Back to dashboard</Link>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eafb] px-3 py-1 text-[11px] font-bold text-[#7c2ae8]">● {tagCase(c.stepLabel)}</span>
        <h1 className="mt-2 text-[24px] sm:text-[26px] font-bold tracking-tight text-[#171730]">{c.page.title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[#5f5f7a]">{c.page.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0e0c18] shadow-md">
              {c.video.url ? (
                <iframe src={embed(c.video.url)} title={c.video.caption} className="absolute inset-0 size-full" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
              ) : (
                <p className="absolute inset-0 grid place-items-center text-[12px] text-white/60">The intro video will appear here soon.</p>
              )}
            </div>
            {!progress.videoWatched && (
              <div className="flex justify-end">
                <button type="button" onClick={() => save({ videoWatched: true })} className="text-[11.5px] font-semibold text-[#7c2ae8] hover:underline cursor-pointer">I’ve watched it ✓</button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-[#171730]">{c.socialsHeading}</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${socialsDone ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fef3c7] text-[#b45309]'}`}>{socialsDone ? 'Done' : 'Required'}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {socials.map((s) => {
                const followed = progress.followedSocialIds.includes(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#ececf2] bg-white p-3.5 shadow-xs">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-white font-bold text-xs ${s.platform === 'x' ? 'bg-black' : 'bg-[#0077b5]'}`}>{s.platform === 'x' ? '𝕏' : 'in'}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-[#171730]">{s.label}</p>
                        <p className="truncate text-[11px] text-[#8e8ea6]">{s.handle}</p>
                      </div>
                    </div>
                    <a
                      href={s.url} target="_blank" rel="noopener noreferrer"
                      onClick={() => { if (!followed) save({ followedSocialIds: [...progress.followedSocialIds, s.id] }); }}
                      className={`shrink-0 rounded-full border px-3.5 py-1 text-[11.5px] font-semibold transition cursor-pointer ${followed ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]' : 'border-[#e2e2ec] text-[#171730] hover:bg-gray-50 hover:border-[#7c2ae8]'}`}
                    >
                      {followed ? 'Followed ✓' : <>Follow <Arrow dir="up-right" /></>}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-[#ececf2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-[11px] font-bold text-[#8e8ea6]">Your task</h3>
            <div className="space-y-4">
              <Step n={1} state={steps[0]} title={c.tasks.video} sub={`${c.video.minutes} minutes · ${progress.videoWatched ? 'watched' : 'start here'}`} />
              <Step n={2} state={steps[1]} title={c.tasks.socials} sub={`${followedCount} of ${required.length} followed · Both required`} />
              <Step n={3} state={steps[2]} title={c.tasks.questions} sub={`About ${c.questionsMinutes} minutes`} />
            </div>
            <div className="rounded-xl bg-[#f0eafb] p-3 text-[#5b21b6] text-[11.5px] leading-relaxed flex items-start gap-2">
              <span className="text-[#7c2ae8] font-bold" aria-hidden="true">ℹ</span>
              <span>{c.taskNote}</span>
            </div>
            {completed ? (
              <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
            ) : (
              <>
                <Button disabled={!socialsDone} onClick={() => setQuestionIndex(Math.max(0, questions.findIndex((x) => !progress.answers[x.id]?.trim())))}>
                  {hasAnswers ? 'Resume questions' : 'Continue to questions'}
                </Button>
                {!socialsDone && <p className="text-center text-[11px] text-[#b45309]">Follow the required accounts above to continue.</p>}
              </>
            )}
            <p className="text-center text-[11px] font-bold text-[#8e8ea6]">Required before the modules open</p>
          </div>
        </div>
      </div>

      {q && questionIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="onboard-question-title" className="relative w-full rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-[#ececf2] max-w-lg">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8e8ea6]">
                <span>{tagCase(c.questionsHeader)}</span><span>{questionIndex + 1} of {questions.length}</span>
              </div>
              <div className="relative mt-2 h-1 w-full rounded-full bg-[#e4e4ee]">
                <div className="absolute top-0 left-0 h-full rounded-full bg-[#7c2ae8] transition-all duration-300" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <p className="mt-4 text-[12px] text-[#5f5f7a] leading-relaxed">{c.questionsIntro}</p>
            <h3 id="onboard-question-title" className="mt-3 text-[16px] font-bold text-[#171730]">
              {q.question}{!q.required && <span className="ml-1.5 text-[12px] font-normal text-[#8e8ea6]">— optional</span>}
            </h3>
            <div className="mt-3">
              <LabelInput
                key={q.id} id={q.id} label={q.required ? 'Your answer' : 'Your answer (optional)'} multiline height={112} corner={12}
                autoFocus maxLength={q.maxLength} placeholder={q.placeholder} value={answer}
                onChange={(v) => setProgress({ ...progress, answers: { ...progress.answers, [q.id]: v } })}
              />
              <div className="mt-1 flex items-start justify-between gap-3 text-[11px] text-[#8e8ea6]">
                <span>{q.hint}</span>
                <span className="shrink-0">Max {q.maxLength} characters</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[#f0f0f5]">
              <button type="button" disabled={questionIndex === 0 || busy} onClick={() => setQuestionIndex(questionIndex - 1)} className="text-[12.5px] font-semibold text-[#7c2ae8] hover:underline cursor-pointer disabled:opacity-50"><Arrow dir="left" /> Back</button>
              <button type="button" disabled={busy} onClick={async () => { await save({}); setQuestionIndex(null); }} className="text-[12px] text-[#8e8ea6] hover:text-[#171730] cursor-pointer disabled:opacity-50">Save & exit</button>
              <Button
                size="md" showIcon={!isLast} disabled={q.required && !answer.trim()} loading={busy} loadingLabel={isLast ? 'Submitting…' : 'Saving…'}
                onClick={async () => { if (isLast) await submit(); else { await save({}); setQuestionIndex(questionIndex + 1); } }}
              >
                {isLast ? 'Submit' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="onboard-done-title" className="relative w-full rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-[#ececf2] max-w-md text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <h3 id="onboard-done-title" className="mt-4 text-[20px] font-bold text-[#171730]">{c.completion.title}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#5f5f7a] max-w-xs mx-auto">{c.completion.message}</p>
            <div className="mt-6"><Button onClick={() => router.push('/dashboard')}>Back to dashboard</Button></div>
            <p className="mt-3.5 text-[11px] text-[#8e8ea6]">🔒 {c.completion.nextStepNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
