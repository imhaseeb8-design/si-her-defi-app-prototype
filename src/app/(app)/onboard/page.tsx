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
import { IntroVideo, WATCH_THRESHOLD } from '@/components/onboarding/IntroVideo';
import type { Part1, Part1Progress } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';
import { Check } from '@/components/ui/Check';


type StepState = 'done' | 'current' | 'todo';
// Shown under the intro video. Prototype copy: in the real app these are CMS fields (e.g. video.title, video.description).
const VIDEO_TITLE = 'A welcome from Kara Howard';
const VIDEO_DESCRIPTION = 'Kara Howard, Co-Founder and Ecosystem Lead at SI<3>, welcomes you to the cohort. She covers what Si Her DeFi is, how the weekly sessions and quizzes work, and how you earn your badges and certificate.';

function Step({ n, state, title, sub, children }: { n: number; state: StepState; title: string; sub: string; children?: React.ReactNode }) {
  const dot = state === 'done' ? 'bg-[#16a34a] text-white' : state === 'current' ? 'bg-[#7c2ae8] text-white' : 'border border-[#dcdce8] text-[#8e8ea6]';
  return (
    <div className="flex items-start gap-3">
      <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-medium mt-0.5 ${dot}`}>{state === 'done' ? <Check className="size-3.5" strokeWidth={2.4} /> : n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#171730]">{title}</p>
        <p className="text-[11px] text-[#8e8ea6]">{sub}</p>
        {children}
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
  const [watchFraction, setWatchFraction] = useState(0);

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

  const closeQuestions = async () => { await save({}); setQuestionIndex(null); };

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
      <Link className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7c2ae8] transition-colors link-cta" href="/dashboard"><Arrow dir="left" /> Back to dashboard</Link>
      <div>
        <h1 className="text-[24px] sm:text-[26px] font-medium tracking-tight text-[#171730]">{c.page.title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[#5f5f7a]">{c.page.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-2">
            <IntroVideo url={c.video.url} title={c.video.caption} watched={progress.videoWatched} onProgress={setWatchFraction} onWatched={() => save({ videoWatched: true })} />
            {/* what the video is about, and the button to mark it watched */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[#ececf2] bg-white p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#151534]">{VIDEO_TITLE}</p>
                <p className="mt-1 text-[12.5px] leading-5 text-[#5f5f7a]">{VIDEO_DESCRIPTION}</p>
                <p className="mt-1.5 text-[12px] text-[#8e8ea6]">{c.video.minutes} minutes</p>
              </div>
              {progress.videoWatched ? (
                <span className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 text-[14px] font-medium text-[#16a34a]">
                  <Check className="size-4" />Watched
                </span>
              ) : (
                <div className="w-full shrink-0 sm:w-44" role="progressbar" aria-label="Video watched" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(watchFraction * 100)}>
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="text-[#5f5f7a]">Watched</span>
                    <span className="font-medium tabular-nums text-[#151534]">{Math.round(watchFraction * 100)}%</span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0f0f6]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#9b4dff] to-[#7c2ae8] transition-[width] duration-500" style={{ width: `${watchFraction * 100}%` }} />
                    <span className="absolute inset-y-0 w-px bg-[#7c2ae8]/40" style={{ left: `${WATCH_THRESHOLD * 100}%` }} aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-[#8e8ea6]">Watch {WATCH_THRESHOLD * 100}% to unlock the next steps</p>
                </div>
              )}
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#f0eafb] px-4 py-3 text-[12.5px] leading-5 text-[#5b21b6]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#7c2ae8]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25v3.5M8 5.25h.01" /></svg>
              <span>{c.taskNote}</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-[#ececf2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-[11px] font-medium text-[#8e8ea6]">Your task</h3>
            <div className="space-y-4">
              <Step n={1} state={steps[0]} title={c.tasks.video} sub={`${c.video.minutes} minutes · ${progress.videoWatched ? 'watched' : 'start here'}`} />
              <Step n={2} state={steps[1]} title={c.tasks.socials} sub={`${followedCount} of ${required.length} followed · Both required`}>
                <div className="mt-2.5 space-y-2">
                  {socials.map((soc) => {
                    const followed = progress.followedSocialIds.includes(soc.id);
                    return (
                      <div key={soc.id} className="flex items-center gap-2.5 rounded-xl border border-[#ececf2] bg-[#fbfbfd] p-2">
                        <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-medium text-white ${soc.platform === 'x' ? 'bg-black' : 'bg-[#0077b5]'}`}>{soc.platform === 'x' ? '𝕏' : 'in'}</span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[#45465f]" title={soc.handle}>{soc.platform === 'x' ? 'X' : 'LinkedIn'}</span>
                        {!progress.videoWatched ? (
                          <span className="inline-flex shrink-0 cursor-not-allowed items-center gap-1 rounded-lg border border-[#ece8f4] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#b9aed0]" title="Watch Kara's intro first">Follow <Arrow dir="up-right" /></span>
                        ) : (
                        <a
                          href={soc.url} target="_blank" rel="noopener noreferrer"
                          onClick={() => { if (!followed) save({ followedSocialIds: [...progress.followedSocialIds, soc.id] }); }}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition ${followed ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]' : 'border-[#d4c2f5] bg-white text-[#7c2ae8] hover:bg-[#f8f5fe]'}`}
                        >
                          {followed ? <>Followed <Check className="size-3.5" /></> : <>Follow <Arrow dir="up-right" /></>}
                        </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Step>
              <Step n={3} state={steps[2]} title={c.tasks.questions} sub={`About ${c.questionsMinutes} minutes`} />
            </div>
            {completed ? (
              <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
            ) : (
              <>
                <Button disabled={!progress.videoWatched || !socialsDone} onClick={() => setQuestionIndex(Math.max(0, questions.findIndex((x) => !progress.answers[x.id]?.trim())))}>
                  {hasAnswers ? 'Resume questions' : 'Continue to questions'}
                </Button>
                {!(progress.videoWatched && socialsDone) && <p className="text-center text-[11px] text-[#b45309]">{!progress.videoWatched ? `Watch ${WATCH_THRESHOLD * 100}% of Kara’s intro to unlock the next steps.` : 'Follow both accounts in step 2 to continue.'}</p>}
              </>
            )}
            <p className="text-center text-[11px] font-medium text-[#8e8ea6]">Required before the modules open</p>
          </div>
        </div>
      </div>

      {q && questionIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="onboard-question-title" onKeyDown={(e) => { if (e.key === 'Escape' && !busy) closeQuestions(); }} className="relative w-full rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-[#ececf2] max-w-lg">
            {/* close sits on the card's corner; it saves your answers so far, like the old "Save & exit" */}
            <button type="button" disabled={busy} onClick={closeQuestions} aria-label="Close, your answers are saved" title="Close, your answers are saved" className="absolute -right-3 -top-3 grid size-9 cursor-pointer place-items-center rounded-full border border-[#ececf2] bg-white text-[#5f5f7a] transition hover:text-[#171730] hover:bg-[#f8f8fc] disabled:opacity-50">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
            <div>
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#8e8ea6]">
                <span>{tagCase(c.questionsHeader)}</span>
                <span className="tabular-nums">{questionIndex + 1} of {questions.length}</span>
              </div>
              <div className="relative mt-2 h-1 w-full rounded-full bg-[#e4e4ee]">
                <div className="absolute top-0 left-0 h-full rounded-full bg-[#7c2ae8] transition-all duration-300" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <p className="mt-4 text-[12px] text-[#5f5f7a] leading-relaxed">{c.questionsIntro}</p>
            <h3 id="onboard-question-title" className="mt-3 text-[16px] font-medium text-[#171730]">
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
              <button type="button" disabled={questionIndex === 0 || busy} onClick={() => setQuestionIndex(questionIndex - 1)} className="text-[12.5px] font-medium text-[#7c2ae8] link-cta cursor-pointer disabled:opacity-50"><Arrow dir="left" /> Back</button>
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
              <Check className="size-7" />
            </span>
            <h3 id="onboard-done-title" className="mt-4 text-[20px] font-medium text-[#171730]">{c.completion.title}</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#5f5f7a] max-w-xs mx-auto">{c.completion.message}</p>
            <div className="mt-6"><Button onClick={() => router.push('/dashboard')}>Back to dashboard</Button></div>
            <p className="mt-3.5 text-[11px] text-[#8e8ea6]">🔒 {c.completion.nextStepNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
