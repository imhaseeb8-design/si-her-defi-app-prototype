'use client';
// Dashboard (captures D01–D07, M07, M11). Every block switches on real data: onboarding status,
// module dates vs. "today", quiz results, certificate unlock.
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/app/AppShell';
import { useSession } from '@/components/app/SessionProvider';
import { ScheduleModal } from '@/components/dashboard/ScheduleModal';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/onboarding/OnboardingShell';
import { assetPath, badgeApi, certificateApi, modulesApi, onboardApi, partnerApi } from '@/lib/api';
import { firstName, sessionWhen, shortAddress, tagCase } from '@/lib/format';
import type { Badges, Certificate, Module, OnboardStatus, Partner, Profile } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

const TOTAL_BADGES = 12;
const SESSIONS_STEP = 3;
const sectionTitle = 'text-[17px] font-medium tracking-[-0.01em] text-[#45465f]';

const CalendarIcon = ({ className = 'size-3.5 text-[#7954ad]', strokeWidth = '1.7', rx = '2' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx={rx} /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** One segment per weekly badge: earned ones fill in brand purple, the next one to earn is tinted. */
function BadgeSlots({ modules, badges }: { modules: Module[]; badges: Badges | null }) {
  const earned = new Set(badges?.badges.map((b) => b.week));
  const total = Math.max(TOTAL_BADGES, modules.length);
  const weeks = Array.from({ length: total }, (_, i) => i + 1);
  const next = weeks.find((w) => !earned.has(w));
  return (
    <ol className="mt-4 flex gap-1" aria-label={`${earned.size} of ${total} badges earned`}>
      {weeks.map((week) => {
        const m = modules.find((x) => x.week === week);
        const got = earned.has(week);
        return (
          <li
            key={week}
            title={`Week ${week}: ${m?.title ?? `Week ${week} module`} · ${got ? 'Earned' : week === next ? 'Next to earn' : 'Not earned yet'}`}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${got ? 'bg-gradient-to-r from-[#9b4dff] to-[#7c2ae8]' : week === next ? 'bg-[#e4d4ff]' : 'bg-[#f0f0f6]'}`}
          />
        );
      })}
    </ol>
  );
}

/** Who you are in the cohort: identity on top, bio, then a footer row that mirrors the badges card. */
function ProfileCard({ profile }: { profile: Profile }) {
  const link = profile.socialLink?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const meta = [profile.role, profile.organization].filter(Boolean).join(' · ');
  return (
    <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ececf2] bg-white p-6 shadow-[0_2px_12px_rgba(23,23,48,0.03)]">
      <div className="relative">
        <div className="flex items-center gap-4">
          <span className="shrink-0 rounded-full bg-gradient-to-br from-[#9b4dff] via-[#c77dff] to-[#f0abfc] p-[2px]">
            <Avatar src={profile.photoUrl} name={profile.name} className="size-14 border-2 border-white" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-medium leading-tight text-[#151534]">{profile.name}</h2>
            {meta && <p className="mt-1 truncate text-[13px] text-[#7e7e96]">{meta}</p>}
          </div>
        </div>
        {profile.bio ? (
          <p className="mt-4 line-clamp-2 text-[12.5px] leading-5 text-[#5f5f7a]">{profile.bio}</p>
        ) : (
          <Link href="/settings#profile" className="mt-4 block text-[12.5px] leading-5 text-[#9a9cbd] hover:text-[#7c2ae8]">Add a short bio. Partners see it on your profile.</Link>
        )}
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-[#f0f0f6] pt-4 text-[12.5px]">
        {link ? (
          <a href={profile.socialLink} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-[#7e7e96] transition-colors hover:text-[#151534]">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-[#9b4dff]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.83 2.83 0 0 1 4 4l-1 1M9 11.5l-1 1a2.83 2.83 0 0 1-4-4l1-1" /></svg>
            <span className="truncate">{link}</span>
          </a>
        ) : <span className="text-[#9a9cbd]">No social link yet</span>}
        <Link href="/settings#profile" className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[#7c2ae8] transition-colors hover:text-[#5e3295]">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H2v-3l8.5-8.5z" /></svg>
          Edit profile
        </Link>
      </div>
    </section>
  );
}

// Onboarding Part 2 copy (prototype: the CMS has no Part 2 content yet).
const PART2_TITLE = 'Onboarding Part 2';
const PART2_LOCKED = 'Opens later in the cohort. We’ll let you know when it’s ready.';

function StartHere({ status }: { status: OnboardStatus }) {
  const card = status.part1Card;
  if (status.part1Done) {
    const lock = <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="9" width="10" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>;
    const done = status.part2Done ? 2 : 1;
    return (
      <div className="rounded-2xl border border-[#ececf2] bg-white">
        {/* header: how far through onboarding you are */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-8 rounded-full bg-[#16a34a]" />
            <span className={`h-1.5 w-8 rounded-full ${status.part2Done ? 'bg-[#16a34a]' : 'bg-[#ecebf3]'}`} />
          </div>
          <span className="text-[12px] tabular-nums text-[#8e8ea6]">{done} of 2 complete</span>
        </div>
        <ol className="divide-y divide-[#f0f0f5]">
          <li className="flex items-center gap-4 p-4 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfdf3] text-[#16a34a]">
              <svg viewBox="0 0 12 12" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#16a34a]">Part 1 · Done</p>
              <h3 className="mt-0.5 text-[15px] font-medium text-[#151534]">{card.title}</h3>
              <p className="mt-0.5 text-[12.5px] leading-5 text-[#5f5f7a]">{card.doneMessage}</p>
            </div>
            <Link href="/onboard" className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[#7c2ae8] transition hover:bg-[#f8f5fe]">Review</Link>
          </li>
          <li className="flex items-center gap-4 p-4 sm:px-5" aria-disabled={!status.part2Unlocked}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#ece8f4] bg-[#fbfaff] text-[#a894c8]">{lock}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#a894c8]">Part 2</p>
              <h3 className="mt-0.5 text-[15px] font-medium text-[#8e8ea6]">{PART2_TITLE}</h3>
              <p className="mt-0.5 text-[12.5px] leading-5 text-[#8e8ea6]">{PART2_LOCKED}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f1ecf8] px-2.5 py-1 text-[11.5px] font-medium text-[#8a6fb8]">{lock}Locked</span>
          </li>
        </ol>
      </div>
    );
  }
  return (
    <div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-[#0f0c1b] p-6 sm:p-7 text-white shadow-md">
      <Image alt="" fill sizes="(min-width: 1024px) 960px, 100vw" className="scale-[1.22] object-cover object-center" src={card.imageUrl} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/20 pointer-events-none" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white">● {tagCase(card.stepLabel).split(' · ')[0]}</span>
          <h3 className="mt-2 text-[20px] sm:text-[22px] font-medium tracking-tight text-white">{card.title}</h3>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-white/80">{card.description}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-2">
          <div className="flex items-center gap-3">
            <ButtonLink href="/onboard" variant="white" size="md">{status.part1Status === 'draft' ? 'Continue' : 'Start here'}</ButtonLink>
            <span className="text-[11.5px] text-white/80">{card.questionCount} questions · about {card.questionsMinutes} minutes</span>
          </div>
          <p className="ml-auto text-right text-[11px] italic leading-4 text-white/70">Required before Si Her DeFi modules unlock*</p>
        </div>
      </div>
    </div>
  );
}

function FeaturedModule({ m, part1Done, onSchedule }: { m: Module; part1Done: boolean; onSchedule: (m: Module) => void }) {
  const upcoming = m.sessionState === 'upcoming';
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17142b] via-[#331c4b] to-[#121124] p-6 text-white shadow-md">
      {/* cover art for the week (prototype: one image for every module; in the real app this comes from the CMS) */}
      <Image alt="" fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-right" src={assetPath('/v2/module-cover.webp')} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#131124]/85 via-[#1a142e]/50 to-[#1a142e]/5 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#131124]/60 to-transparent pointer-events-none sm:hidden" />
      <div className="relative z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white">Week {String(m.week).padStart(2, '0')} · {m.videoUrl ? 'Session recording' : 'Recording after the live session'}</span>
        <h3 className="mt-2 text-[20px] font-medium tracking-tight text-white">{m.title}</h3>
        <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-white/80 line-clamp-2">{m.description}</p>
        <div className="mt-3">
          <span className="text-[11px] text-white/75">Presented by {m.presenter}{m.partnerName ? ` · ${m.partnerName}` : ''}</span>
        </div>
      </div>
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {part1Done ? (
            <>
              <ButtonLink href={`/module/${m.slug}`} size="md">Start session</ButtonLink>
              {upcoming && (
                <button type="button" onClick={() => onSchedule(m)} className="rounded-full border border-white/30 bg-white/15 backdrop-blur-sm px-4 py-2 text-[12px] font-medium text-white hover:bg-white/25 active:scale-[0.99] transition cursor-pointer flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 7h12M5 1.5v3M11 1.5v3" /></svg>
                  <span>{m.isScheduled ? 'Added to calendar ✓' : 'Add to calendar'}</span>
                </button>
              )}
            </>
          ) : (
            <ButtonLink href={`/module/${m.slug}`} size="md" disabled title="Opens once Si Her Onboard – Part 1 is done">Start session</ButtonLink>
          )}
          <span className="text-[11px] text-white/75">{!part1Done ? 'Finish Part 1 to unlock · ' : ''}{!upcoming && m.videoUrl ? '1 video · ' : ''}{m.quiz.questionCount} questions · 1 badge</span>
        </div>
        {part1Done && (
        <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 backdrop-blur-md">
          {upcoming ? (
            <><span className="inline-block size-2 rounded-full bg-white/50" /><span className="text-[11px] text-white/75">Recording coming soon</span></>
          ) : m.sessionState === 'live' ? (
            <><span className="inline-block size-2 rounded-full bg-red-400 animate-pulse" /><span className="text-[11px] text-white/75">Live now</span></>
          ) : (
            <><span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[11px] text-white/75">Quiz open</span></>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

/** Session card: date tile, title, day + time, speaker · company, then Add to calendar (upcoming) or Open (quiz open / badge earned). */
function SessionCard({ m, onSchedule }: { m: Module; onSchedule: (m: Module) => void }) {
  const when = sessionWhen(m.scheduledDate, m.endDate);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#ececf2] bg-white p-4 transition hover:border-[#dcd0f2] sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* a small calendar page: month on a brand strip, then the day */}
        <div className="w-[60px] shrink-0 overflow-hidden rounded-xl border border-[#e6e0f2] bg-white text-center leading-none" aria-hidden="true">
          <div className="bg-gradient-to-b from-[#8b3df0] to-[#7c2ae8] py-1 text-[10.5px] font-medium text-white">{when.month}</div>
          <div className="py-2.5 text-[22px] font-medium tabular-nums tracking-[-0.02em] text-[#151534]">{when.day}</div>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium text-[#151534]">{m.title}</h3>
          <p className="mt-1 text-[12.5px] text-[#5f5f7a]"><time dateTime={m.scheduledDate}>{when.weekday}, {when.month} {when.day} · {when.time}</time></p>
          <p className="mt-1 truncate text-[12.5px] text-[#7e7e96]"><span className="text-[#45465f]">{m.presenter}</span>{m.partnerName ? ` · ${m.partnerName}` : ''}</p>
        </div>
      </div>
      {m.sessionState === 'upcoming' ? (
        m.isScheduled ? (
          <button type="button" onClick={() => onSchedule(m)} className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 text-[14px] font-medium text-[#16a34a] transition hover:bg-[#e6fbec]">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-6.5" /></svg><span>Added to calendar</span>
          </button>
        ) : (
          <Button size="md" showIcon={false} onClick={() => onSchedule(m)} className="shrink-0 max-sm:w-full">
            <span className="inline-flex items-center gap-2"><CalendarIcon className="size-4" /><span>Add to calendar</span></span>
          </Button>
        )
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          {m.quiz.isPassed
            ? <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[12px] text-[#16a34a]">Badge earned</span>
            : <span className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-[12px] text-[#6d25d6]">Quiz open</span>}
          <ButtonLink href={`/module/${m.slug}`} size="md">Open</ButtonLink>
        </div>
      )}
    </div>
  );
}


/** Your certificate: locked until every session's quiz is passed, then a link to it. */
function CertificateRow({ unlocked, passed, total }: { unlocked: boolean; passed: number; total: number }) {
  const lockIcon = <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="9" width="10" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>;
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-5 ${unlocked ? 'border-[#ececf2] bg-white' : 'border-[#ececf2] bg-[#fbfaff]'}`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`grid size-[60px] shrink-0 place-items-center rounded-xl border ${unlocked ? 'border-[#e6e0f2] bg-[#f8f5fe] text-[#7c2ae8]' : 'border-[#ece8f4] bg-white text-[#a894c8]'}`}>
          {unlocked
            ? <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5" /><path d="M9.2 13.5 8 21l4-2.2 4 2.2-1.2-7.5" /></svg>
            : <span className="[&>svg]:size-6">{lockIcon}</span>}
        </div>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-[#151534]">
            Your certificate
            {!unlocked && <span className="rounded-full bg-[#f1ecf8] px-2 py-0.5 text-[11px] font-medium text-[#8a6fb8]">Locked</span>}
          </h3>
          <p className="mt-1 text-[12.5px] leading-5 text-[#5f5f7a]">
            {unlocked
              ? 'Minted on Base, with every badge you earned.'
              : 'Finish every session and pass each quiz to unlock it. Then mint it on Base with all your badges.'}
          </p>
          {!unlocked && <p className="mt-1 text-[12px] tabular-nums text-[#8e8ea6]">{passed} of {total} quizzes passed</p>}
        </div>
      </div>
      {unlocked
        ? <ButtonLink href="/certificate" size="md" className="shrink-0 max-sm:w-full">View certificate</ButtonLink>
        : <ButtonLink href="/certificate" size="md" disabled showIcon={false} className="shrink-0 max-sm:w-full"><span className="inline-flex items-center gap-2">{lockIcon}<span>View certificate</span></span></ButtonLink>}
    </div>
  );
}

function ReadyToMint() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-7 sm:p-8 text-white shadow-xl border border-purple-500/20 min-h-[260px] flex items-center">
      <Image alt="Your certificate is ready" fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-right" src={assetPath('/Your certificate is ready.png')} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-md space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-[11px] font-medium text-purple-200 backdrop-blur-sm">● Ready to mint</span>
        <h2 className="text-[24px] sm:text-[28px] font-medium tracking-tight text-white leading-tight">Your certificate is ready</h2>
        <p className="text-[12.5px] leading-relaxed text-white/80">Twelve modules, thirteen badges, one verifiable record on Base. Minting writes it to your wallet — it’s yours, not ours.</p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <ButtonLink href="/certificate" variant="white" size="md">Mint on Base</ButtonLink>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <span className="size-5 rounded-full bg-purple-400 border border-white" />
              <span className="size-5 rounded-full bg-blue-400 border border-white" />
              <span className="size-5 rounded-full bg-emerald-400 border border-white" />
            </div>
            <span className="text-[11.5px] text-white/75">96 learners have minted theirs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ p }: { p: Partner }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ececf2] bg-white shadow-xs transition hover:shadow-md">
      <div className="relative h-28 bg-[#1e1538] flex items-center justify-center overflow-hidden">
        {p.imageUrl ? <Image alt="" fill sizes="240px" className="object-cover" src={p.imageUrl} /> : (
          <span className="grid size-11 place-items-center rounded-full bg-[#2a1f4d] text-white/90 border border-white/10 font-medium text-sm">{p.title.charAt(0)}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] font-medium text-[#171730]">{p.title}</span>
            <span className="shrink-0 rounded-full bg-[#f4f4fa] px-2 py-0.5 text-[11px] font-medium text-[#7e7e96]">{p.tag}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#5f5f7a] line-clamp-2">{p.description}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#f0f0f5]">
          <a href={p.actionUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full rounded-xl border border-[#e2e2ec] py-2 text-[12px] font-medium text-[#171730] transition hover:bg-gray-50 cursor-pointer">{p.actionText.replace(/\s*↗\s*$/, '')} <Arrow dir="up-right" /></a>
          <p className="mt-2 text-center text-[10px] text-[#9ca3af]">{p.footerText}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, wallet, refresh } = useSession();
  const [status, setStatus] = useState<OnboardStatus | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [badges, setBadges] = useState<Badges | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [scheduling, setScheduling] = useState<Module | null>(null);
  // sessions list shows 3 at a time so any number from the CMS keeps the layout
  const [shown, setShown] = useState(SESSIONS_STEP);

  const load = useCallback(async () => {
    const [s, m, b, c, p] = await Promise.all([
      onboardApi.getStatus(), modulesApi.getAll(), badgeApi.getBadges(), certificateApi.getCertificate(), partnerApi.getPartners(),
    ]);
    setStatus(s); setModules([...m].sort((a, z) => a.week - z.week)); setBadges(b); setCert(c); setPartners(p);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  if (!status || !profile) {
    return <div className="grid min-h-[60vh] place-items-center text-[#7c2ae8]"><Spinner className="size-6" /></div>;
  }

  const featured = modules.find((m) => !m.quiz.isPassed) ?? null;
  const rest = modules.filter((m) => m !== featured);
  const earned = badges?.earnedCount ?? 0;
  const earnedWeeks = new Set(badges?.badges.map((b) => b.week));
  const nextBadge = [...modules].sort((x, y) => x.week - y.week).find((m) => !earnedWeeks.has(m.week));
  const unlocked = !!cert && cert.status !== 'locked';
  const subtitle = !status.part1Done
    ? 'Introduce yourself to unlock the weekly sessions.'
    : unlocked
      ? 'You did it. Every session and quiz is done, and your certificate is ready to mint on Base.'
      : earned === 0
        ? `You're in. Watch the Week ${String(featured?.week ?? 1).padStart(2, '0')} session and pass its quiz to earn your first badge.`
        : `You've earned ${earned} of ${TOTAL_BADGES} badges. Each session and quiz brings you closer to your certificate.`;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header: a real headline for the greeting (not a tag) and the
          network status as a chip pinned top-right. */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-[#151534] sm:text-[30px]">
            Welcome, {firstName(profile.name)} <span aria-hidden="true">👋</span>
          </h1>
          <p className="max-w-[560px] text-[15px] leading-6 text-[#4c4d77]">{subtitle}</p>
        </div>
        {wallet ? (
          <a
            href={`https://basescan.org/address/${wallet}`} target="_blank" rel="noopener noreferrer"
            title={`Wallet ${shortAddress(wallet)} on Base — view on BaseScan`}
            className="mt-1 hidden shrink-0 items-center gap-2 rounded-full md:inline-flex border border-[#e7e7f1] bg-white py-1.5 pl-3 pr-3.5 text-[12.5px] shadow-[0_1px_2px_rgba(23,23,48,0.04)] transition hover:border-[#d6d6e4] hover:shadow-[0_2px_8px_rgba(23,23,48,0.06)]"
          >
            <span className="size-2 rounded-full bg-[#0052ff]" />
            <span className="font-medium text-[#151534]">Base</span>
            <span className="h-3 w-px bg-[#e7e7f1]" />
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#16a34a] opacity-40 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-[#16a34a]" />
            </span>
            <span className="font-medium text-[#15803d]">Active</span>
          </a>
        ) : (
          <Link href="/wallet" className="mt-1 hidden shrink-0 items-center gap-2 rounded-full md:inline-flex border border-[#e7e7f1] bg-white py-1.5 pl-3 pr-3.5 text-[12.5px] transition hover:border-[#d6d6e4]">
            <span className="size-2 rounded-full bg-[#c4c4d4]" />
            <span className="font-medium text-[#151534]">Base</span>
            <span className="h-3 w-px bg-[#e7e7f1]" />
            <span className="font-medium text-[#7b2fbe]">Connect wallet</span>
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProfileCard profile={profile} />
        <section className="flex flex-col justify-between rounded-2xl border border-[#ececf2] bg-white p-6 shadow-[0_2px_12px_rgba(23,23,48,0.03)]">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[15px] font-medium text-[#151534]">Badges earned</h3>
              <span className="text-[13px] font-medium text-[#151534] tabular-nums">{earned}<span className="font-medium text-[#9a9cbd]"> / {TOTAL_BADGES}</span></span>
            </div>
            <BadgeSlots modules={modules} badges={badges} />
            {earned > 0 ? (
              <ul className="mt-4 grid grid-cols-12 gap-1.5" aria-label="Your badges">
                {badges!.badges.map((b) => (
                  <li key={b.id} title={`Week ${b.week} · ${b.moduleTitle ?? b.name}`} className="max-w-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetPath(b.image)} alt={b.name} className="aspect-[8/9] w-full object-contain drop-shadow-[0_2px_4px_rgba(94,50,149,0.25)]" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[12.5px] leading-5 text-[#7e7e96]">Pass each week’s quiz to earn that partner’s badge for your certificate.</p>
            )}
          </div>
          {earned >= TOTAL_BADGES ? (
            <p className="mt-4 flex items-center gap-2 border-t border-[#f0f0f6] pt-4 text-[12.5px] text-[#7e7e96]">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]"><svg viewBox="0 0 12 12" aria-hidden="true" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 6 5 8.5 9.5 3.5" /></svg></span>
              <span className="min-w-0 truncate"><span className="font-medium text-[#151534]">All {TOTAL_BADGES} badges earned.</span> They’re all on your certificate.</span>
            </p>
          ) : nextBadge && (
            <p className="mt-4 flex items-center gap-2 border-t border-[#f0f0f6] pt-4 text-[12.5px] text-[#7e7e96]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-[#9b4dff]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M8 1.5l5.6 3.25v6.5L8 14.5l-5.6-3.25v-6.5z" /></svg>
              <span className="min-w-0 truncate">Next badge: <span className="font-medium text-[#151534]">Week {String(nextBadge.week).padStart(2, '0')} · {nextBadge.title}</span></span>
            </p>
          )}
        </section>
      </div>

      {/* before Part 1 it leads the page; once done it moves down next to the certificate */}
      {!status.part1Done && (
        <section className="space-y-3">
          <h2 className={sectionTitle}>Begin your journey</h2>
          <StartHere status={status} />
        </section>
      )}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          {unlocked ? (
            <><h2 className={sectionTitle}>Your learning path</h2><span className="text-[12.5px] font-medium text-[#16a34a]">● Certificate unlocked</span></>
          ) : (
            <><h2 className={sectionTitle}>Your learning path</h2><span className="text-[12.5px] text-[#8e8ea6]">{status.part1Done ? 'Finish every session to unlock your certificate' : 'Opens once Part 1 is done'}</span></>
          )}
        </div>
        <div className="space-y-4">
          {featured && <FeaturedModule m={featured} part1Done={status.part1Done} onSchedule={setScheduling} />}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11.5px] font-medium text-[#9a9cbd]">Upcoming sessions ({rest.length})</h2>
              <span className="text-[11.5px] text-[#9a9cbd]">Add them to your calendar now</span>
            </div>
            <div className="relative space-y-3">
              {rest.slice(0, shown).map((m) => <SessionCard key={m.slug} m={m} onSchedule={setScheduling} />)}
              {/* while more are hidden, the last card fades into the page so it's clear the list continues */}
              {shown < rest.length && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-[#f8f8fc]/0 via-[#f8f8fc]/80 to-[#f8f8fc] sm:h-24" />}
            </div>
            {rest.length > SESSIONS_STEP && (
              <div className={`relative flex justify-center ${shown < rest.length ? '-mt-8' : 'pt-1'}`}>
                {shown < rest.length ? (
                  <button type="button" onClick={() => setShown((n) => n + SESSIONS_STEP)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e2e2ec] bg-white px-4 py-2 text-[12.5px] font-medium text-[#45465f] transition hover:border-[#d4c2f5] hover:text-[#7c2ae8]">
                    Show more sessions <span className="text-[#9a9cbd]">({rest.length - shown})</span>
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
                  </button>
                ) : (
                  <button type="button" onClick={() => setShown(SESSIONS_STEP)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-[#7e7e96] transition hover:text-[#151534]">
                    Show fewer
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4-4 4 4" /></svg>
                  </button>
                )}
              </div>
            )}
          </div>
          {status.part1Done && (
            <div className="space-y-3 pt-3">
              <h2 className="text-[11.5px] font-medium text-[#9a9cbd]">Your onboarding</h2>
              <StartHere status={status} />
            </div>
          )}
          <CertificateRow unlocked={unlocked} passed={modules.filter((m) => m.quiz.isPassed).length} total={modules.length} />
          {unlocked && cert?.status !== 'minted' && <ReadyToMint />}
        </div>
      </section>

      {partners.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>From our partners</h2>
            <span className="text-[11px] text-[#9ca3af]">Verified ecosystem partners · opens in new tab</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{partners.map((p) => <PartnerCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <footer className="py-6 text-center text-[11px] text-[#9ca3af]">© 2026 · Si Her DeFi</footer>

      {scheduling && <ScheduleModal module={scheduling} onClose={() => setScheduling(null)} onScheduled={() => { load(); refresh(); }} />}
    </div>
  );
}
