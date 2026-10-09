'use client';
// Weekly module (captures F01–F09, M12–M13): recording or upcoming hero, about, chapters, quiz card,
// speakers, share. Quiz opens in QuizDialog.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/app/SessionProvider';
import { ScheduleModal } from '@/components/dashboard/ScheduleModal';
import { HintButton, QuizDialog } from '@/components/module/QuizDialog';
import { VideoPlayer, toSeconds, type PlayerHandle } from '@/components/module/VideoPlayer';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { modulesApi, onboardApi, quizApi } from '@/lib/api';
import { dayTime, timeUntil } from '@/lib/format';
import { now } from '@/lib/mock/server';
import type { Module, Quiz, QuizHint } from '@/lib/types';

const card = 'rounded-2xl border border-[#ececf2] bg-white p-5 sm:p-6 shadow-2xs space-y-4';
const cta = 'w-full rounded-xl bg-gradient-to-r from-[#5b1ea6] via-[#7526dd] to-[#8a33ea] py-3 text-[13.5px] font-semibold text-white shadow-md shadow-purple-950/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';
const share = (text: string) => `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;

function QuizCard({ m, quiz, part1Done, onStart }: { m: Module; quiz: Quiz; part1Done: boolean; onStart: () => void }) {
  const last = quiz.lastResult;
  if (quiz.isPassed) {
    return (
      <div className={card}>
        <span className="text-[10.5px] font-bold tracking-wider text-[#7c2ae8] uppercase">COMPLETED</span>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-12 object-contain" src={quiz.badge.image} />
          <div>
            <h4 className="text-[15px] font-bold text-[#171730]">Badge earned ✓</h4>
            <p className="text-[12px] text-[#5f5f7a]">{quiz.badge.name}</p>
          </div>
        </div>
        <Link className="block w-full rounded-xl bg-gradient-to-r from-[#5b1ea6] via-[#7526dd] to-[#8a33ea] py-3 text-center text-[13px] font-semibold text-white shadow-md shadow-purple-950/20 transition hover:brightness-105" href="/certificate">View your certificate →</Link>
      </div>
    );
  }
  const locked = quiz.attemptsRemaining <= 0 && !!quiz.retryAvailableAt && new Date(quiz.retryAvailableAt) > now();
  if (locked) {
    return (
      <div className={card}>
        <span className="text-[10.5px] font-bold tracking-wider text-[#7c2ae8] uppercase">TRY AGAIN SOON</span>
        <div className="space-y-3">
          <div>
            <h4 className="text-[16.5px] font-bold text-[#171730]">Earn your week {m.week} badge</h4>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f5f7a]">You’ve used all {quiz.maxAttempts} attempts{last ? ` (last: ${last.score} of ${last.totalQuestions})` : ''}. Take some time to rewatch the session — a fresh set of attempts opens soon.</p>
          </div>
          <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-3 text-[12px] text-[#5b21b6]">
            <p className="font-semibold">You can try again {timeUntil(quiz.retryAvailableAt!) ?? 'soon'}</p>
            <p className="mt-0.5 text-[11px] text-[#7c3aed]">{dayTime(quiz.retryAvailableAt!)}</p>
          </div>
        </div>
      </div>
    );
  }
  const retry = !!last && !last.passed;
  return (
    <div className={card}>
      <span className="text-[10.5px] font-bold tracking-wider text-[#7c2ae8] uppercase">READY WHEN YOU ARE</span>
      <div>
        <h4 className="text-[16.5px] font-bold text-[#171730]">Earn your week {m.week} badge</h4>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f5f7a]">Answer all {quiz.totalQuestions} correctly to earn the badge. {quiz.maxAttempts} attempts — if you don’t pass, rewatch and retry.</p>
      </div>
      <ul className="space-y-2.5 text-[12px] text-[#5f5f7a]">
        <li className="flex items-center gap-2.5"><span className="grid size-4 place-items-center rounded border border-[#b8b8cc] text-[10px]">✓</span><span>{quiz.totalQuestions} questions · all {quiz.passingScore} correct</span></li>
        <li className="flex items-center gap-2.5"><span className="grid size-4 place-items-center text-[12px] text-[#8e8ea6]">★</span><span>Attempt {Math.min(quiz.attemptsUsed + 1, quiz.maxAttempts)} of {quiz.maxAttempts}</span></li>
      </ul>
      {retry && last && <p className="rounded-xl bg-[#fffbeb] p-3 text-[11.5px] text-[#92400e]">Last attempt: {last.score} of {last.totalQuestions}. Review the hints below the video, then try again.</p>}
      {part1Done ? (
        <button type="button" onClick={onStart} className={cta}>{retry ? 'Try again →' : 'Start quiz →'}</button>
      ) : (
        <Link href="/onboard" className={`block text-center ${cta}`}>🔒 Finish Part 1 to unlock</Link>
      )}
    </div>
  );
}

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const [m, setM] = useState<Module | null>(null);
  const [all, setAll] = useState<Module[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [part1Done, setPart1Done] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [scheduling, setScheduling] = useState<Module | null>(null);
  const player = useRef<PlayerHandle>(null);
  const session = useSession();

  const load = useCallback(async () => {
    try {
      const [mod, list, q, st] = await Promise.all([modulesApi.getOne(slug), modulesApi.getAll(), quizApi.getQuiz(slug), onboardApi.getStatus()]);
      setM(mod); setAll(list.sort((a, b) => a.week - b.week)); setQuiz(q); setPart1Done(st.part1Done);
    } catch {
      setNotFound(true);
    }
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  if (notFound) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center text-center">
        <div>
          <p className="text-[18px] font-bold text-[#171730]">We couldn’t find that module</p>
          <Link href="/dashboard" className="mt-3 inline-block text-[12.5px] font-semibold text-[#7c2ae8] hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }
  if (!m || !quiz) return <div className="grid min-h-[60vh] place-items-center text-[#7c2ae8]"><Spinner className="size-6" /></div>;

  const upcoming = m.sessionState === 'upcoming';
  const next = all.find((x) => x.week > m.week);
  const rewatch = (h: QuizHint) => player.current?.seek(toSeconds(h.timestamp));
  const review = !quiz.isPassed ? quiz.lastResult?.review.filter((r) => r.hint) ?? [] : [];
  const shareText = quiz.isPassed
    ? `I just earned the "${quiz.badge.name}" badge in the Si Her DeFi cohort 🎉`
    : `I'm learning "${m.title}" in the Si Her DeFi cohort${m.partnerName && m.partnerName !== 'Si Her DeFi' ? ` with ${m.partnerName}` : ''}.`;

  return (
    <div className="mx-auto max-w-[1040px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#7c2ae8] transition-colors hover:underline" href="/dashboard">← Back to dashboard</Link>
        <span className="text-[11px] font-semibold tracking-wider text-[#8e8ea6] uppercase">{m.dateLabel}</span>
      </div>
      <div>
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#171730]">{m.title}</h1>
        {m.partnerName && m.partnerName !== 'Si Her DeFi' && <p className="mt-1 text-[13px] text-[#5f5f7a]">With {m.partnerName}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {!upcoming && m.videoUrl ? (
            <VideoPlayer ref={player} src={m.videoUrl} poster={m.thumbnailUrl} label={`${m.companyTag} · SESSION RECORDING`} />
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#17142b] via-[#331c4b] to-[#121124] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {(m.bannerUrl || m.thumbnailUrl) && <img alt="" className="absolute inset-0 size-full object-cover" src={(m.bannerUrl || m.thumbnailUrl)!} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/90 uppercase backdrop-blur-sm">
                  <span>{m.companyTag}</span><span className="text-white/40">·</span><span>{upcoming ? 'UPCOMING SESSION' : m.sessionState === 'live' ? 'LIVE NOW' : 'RECORDING COMING SOON'}</span>
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 p-5">
                <div className="space-y-1">
                  <p className="text-[14px] font-bold text-white">Live {dayTime(m.scheduledDate)}</p>
                  {upcoming && <p className="text-[12px] text-white/75">Starts {timeUntil(m.scheduledDate)}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {m.sessionState === 'live' && m.liveLink && (
                    <a href={m.liveLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-[#171730] hover:bg-gray-100">Join live session ↗</a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#ececf2] bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider text-[#8e8ea6] uppercase">ABOUT THIS MODULE</h3>
            <p className="text-[12.5px] leading-relaxed text-[#5f5f7a]">{m.description}</p>
            {m.aboutText.map((p, i) => <p key={i} className="text-[12.5px] leading-relaxed text-[#5f5f7a]">{p}</p>)}
          </div>

          {!upcoming && m.chapters.length > 0 && (
            <div className="rounded-2xl border border-[#ececf2] bg-white p-6 shadow-2xs space-y-3">
              <h3 className="text-[11px] font-bold tracking-wider text-[#8e8ea6] uppercase">IN THIS SESSION</h3>
              <div className="divide-y divide-[#f0f0f5]">
                {m.chapters.map((c) => (
                  <button key={c.time} type="button" onClick={() => player.current?.seek(toSeconds(c.time))} className="group flex w-full items-center justify-between py-3 text-left transition-colors cursor-pointer text-[#171730] hover:text-[#7c2ae8]">
                    <div className="flex items-center gap-4"><span className="font-mono text-[12px] text-[#8e8ea6] w-12">{c.time}</span><span className="text-[13px]">{c.title}</span></div>
                    <span className="text-[14px] text-[#b0b0c2] group-hover:text-[#7c2ae8]">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {review.length > 0 && (
            <div className="rounded-2xl border border-[#fef3c7] bg-[#fffbeb] p-5 space-y-2">
              <h3 className="text-[11px] font-bold tracking-wider text-[#b45309] uppercase">WORTH A REWATCH</h3>
              {review.map((r) => <HintButton key={r.questionNumber} hint={r.hint!} onRewatch={rewatch} />)}
            </div>
          )}

          {next && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[12px]">
              <span className="text-[#5f5f7a]">Next up: <Link className="font-semibold text-[#171730] hover:text-[#7c2ae8]" href={`/module/${next.slug}`}>{next.title}</Link> — {dayTime(next.scheduledDate)}</span>
              <button type="button" onClick={() => setScheduling(next)} className="font-semibold text-[#7c2ae8] hover:underline cursor-pointer">Add to calendar ↗</button>
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-4">
          <QuizCard m={m} quiz={quiz} part1Done={part1Done} onStart={() => setQuizOpen(true)} />
          {m.speakers.length > 0 && (
            <div className="space-y-3">
              <h3 className="px-1 text-[11px] font-bold tracking-wider text-[#8e8ea6] uppercase">SPEAKERS ({m.speakers.length})</h3>
              <div className="space-y-3">
                {m.speakers.map((s) => (
                  <div key={s.name} className="rounded-2xl border border-[#ececf2] bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all hover:border-[#dcdce8]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-[#f0f0f5] px-2 py-0.5 text-[10px] font-bold text-[#5f5f7a]">{s.companyTag}</span>
                      <span className="text-[12px] font-bold text-[#171730]">{s.companyName}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {s.headshotUrl && <img alt={s.name} className="size-12 rounded-full object-cover border border-[#ececf2] shrink-0 shadow-2xs" src={s.headshotUrl} />}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14.5px] font-bold text-[#171730] truncate">{s.name}</h4>
                        <p className="text-[11.5px] text-[#5f5f7a] mt-0.5 leading-snug line-clamp-2">{s.role}</p>
                      </div>
                    </div>
                    {s.bio && <p className="text-[11px] text-[#71718a] leading-relaxed line-clamp-4 bg-[#fafafc] p-2.5 rounded-xl border border-[#f0f0f5]">{s.bio}</p>}
                    {typeof s.telegramHandle === 'string' && s.telegramHandle && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <a href={`https://t.me/${s.telegramHandle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#e2e2ec] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5f5f7a] hover:bg-gray-50 hover:text-[#171730] transition-colors">
                          <span>Telegram</span><span className="text-[10px]">↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-[#ececf2] bg-white p-5 shadow-2xs space-y-3">
            <h4 className="text-[13px] font-bold text-[#171730]">Share your progress</h4>
            <p className="text-[11.5px] leading-relaxed text-[#8e8ea6]">It doesn’t affect your badge or certificate.</p>
            <a href={share(shareText)} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl border border-[#e2e2ec] py-2 text-center text-[12px] font-semibold text-[#171730] transition hover:bg-gray-50">Share on LinkedIn ↗</a>
          </div>
        </div>
      </div>

      {quizOpen && <QuizDialog module={m} quiz={quiz} onClose={() => { setQuizOpen(false); load(); session.refresh(); }} onFinished={() => {}} onRewatch={rewatch} />}
      {scheduling && <ScheduleModal module={scheduling} onClose={() => setScheduling(null)} onScheduled={() => load()} />}
    </div>
  );
}
