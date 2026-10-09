// Simulated certifications API. Answers the same endpoints, with the same response shapes, as
// certifications-server.vercel.app/api/v1 so every flow in the prototype runs without a backend.
// State lives in localStorage (per browser) and can be reset or jumped to any stage from the
// Prototype panel. Seed data = sanitized copies of real responses (./fixtures).
import authMe from './fixtures/_auth_me.json';
import certificateFx from './fixtures/_certificate.json';
import modulesFx from './fixtures/_modules.json';
import speakersFx from './fixtures/_modules_cms_speakers.json';
import part1Fx from './fixtures/_onboard_part1.json';
import statusFx from './fixtures/_onboard_status.json';
import partnersFx from './fixtures/_partners.json';
import settingsFx from './fixtures/_settings.json';
import quiz1Fx from './fixtures/_quiz_si-her-collective-capital.json';
import quiz2Fx from './fixtures/_quiz_test-live-session.json';
import type {
  Badges, Certificate, EarnedBadge, Module, OnboardStatus, Part1, Part1Progress, Profile, Prefill,
  Quiz, QuizAnswer, QuizResult, Settings, User,
} from '../types';

export type WalletMode = 'none' | 'metamask' | 'reject-connect' | 'reject-sign' | 'wrong-network';

export interface QuizState {
  attemptsUsed: number;
  passed: boolean;
  answers: QuizAnswer[];
  lastResult: QuizResult | null;
  retryAvailableAt: string | null;
}

export interface DemoState {
  signedIn: boolean;
  user: User;
  profile: Profile;
  prefill: Prefill;
  progress: Part1Progress;
  quizzes: Record<string, QuizState>;
  scheduled: Record<string, string>;
  minted: boolean;
  settings: Settings;
  flags: {
    emailNotFound: boolean;
    wrongCode: boolean;
    walletMode: WalletMode;
    quizMode: 'pass' | 'fail';
    latency: number;
    /** ISO date the prototype treats as "now", or null for the real clock. */
    now: string | null;
  };
}

const KEY = 'siherdefi_demo_state';
export const DEMO_ADDRESS = '0x8f3a2b7c91d04e6a5b12c3d4e5f6a7b8c9d0e1f2';
export const DEFAULT_NOW = '2026-10-09T15:00:00.000Z';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const emptyProfile: Profile = { name: '', role: '', organization: '', socialLink: '', bio: '', photoUrl: '' };
const filledProfile: Profile = {
  name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective',
  socialLink: 'https://linkedin.com/in/adanwosu', bio: 'Designing savings tools for market traders in Lagos.', photoUrl: '',
};
const emptyQuiz = (): QuizState => ({ attemptsUsed: 0, passed: false, answers: [], lastResult: null, retryAvailableAt: null });

export function initialState(): DemoState {
  const me = (authMe as { data: { user: User } }).data;
  return {
    signedIn: false,
    user: { ...me.user, id: 'u_demo', email: 'ada@example.com', walletAddress: null },
    profile: { ...emptyProfile },
    prefill: { prefilledFields: ['name', 'role', 'organization', 'socialLink'], name: 'Ada Nwosu', role: 'Product designer', organization: 'Lagos Fintech Collective', socialLink: 'https://linkedin.com/in/adanwosu' },
    progress: { status: 'not_started', videoWatched: false, followedSocialIds: [], answers: {}, completedAt: null },
    quizzes: {},
    scheduled: {},
    minted: false,
    settings: clone((settingsFx as { data: Settings }).data),
    flags: { emailNotFound: false, wrongCode: false, walletMode: 'metamask', quizMode: 'pass', latency: 450, now: DEFAULT_NOW },
  };
}

// ---------------------------------------------------------------- persistence

let cache: DemoState | null = null;
const listeners = new Set<() => void>();

export function getState(): DemoState {
  if (cache) return cache;
  if (typeof window === 'undefined') return initialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    const base = initialState();
    const saved = raw ? JSON.parse(raw) : null;
    cache = saved ? { ...base, ...saved, flags: { ...base.flags, ...saved.flags } } : base;
  } catch {
    cache = initialState();
  }
  return cache!;
}

export function setState(next: DemoState | ((s: DemoState) => void)) {
  const s = getState();
  // A fresh top-level object on every change, so useSyncExternalStore subscribers re-render.
  if (typeof next === 'function') { next(s); cache = { ...s, flags: { ...s.flags } }; } else cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function now(): Date {
  const n = getState().flags.now;
  return n ? new Date(n) : new Date();
}

// ---------------------------------------------------------------- presets (Prototype panel)

export type Preset = 'new' | 'verified' | 'profile' | 'wallet' | 'part1-draft' | 'part1-done' | 'badge' | 'minted';

export function applyPreset(p: Preset) {
  const flags = getState().flags;
  const s = initialState();
  s.flags = flags;
  const order: Preset[] = ['new', 'verified', 'profile', 'wallet', 'part1-draft', 'part1-done', 'badge', 'minted'];
  const at = order.indexOf(p);
  if (at >= 1) s.signedIn = true;
  if (at >= 2) s.profile = { ...filledProfile };
  if (at >= 3) s.user.walletAddress = DEMO_ADDRESS;
  if (at === 4) s.progress = { status: 'draft', videoWatched: true, followedSocialIds: ['onboarding-social-x'], answers: {}, completedAt: null };
  if (at >= 5) s.progress = { status: 'completed', videoWatched: true, followedSocialIds: ['onboarding-social-x', 'onboarding-social-linkedin'], answers: {}, completedAt: '2026-10-08T18:00:00.000Z' };
  if (at >= 6) s.quizzes['si-her-collective-capital'] = { ...emptyQuiz(), attemptsUsed: 1, passed: true };
  if (at >= 7) s.minted = true;
  setState(s);
  if (typeof window !== 'undefined') {
    if (s.signedIn) {
      window.localStorage.setItem('siherdefi_auth_token', 'demo-token');
      window.localStorage.setItem('siherdefi_auth_user', JSON.stringify(s.user));
    } else {
      window.localStorage.removeItem('siherdefi_auth_token');
      window.localStorage.removeItem('siherdefi_auth_user');
    }
  }
}

// ---------------------------------------------------------------- derived data

const fixtureModules = (modulesFx as { data: Module[] }).data;
const QUIZ_KEYS: Record<string, Record<number, string>> = {
  'si-her-collective-capital': { 1: 'B', 2: 'C', 3: 'A' },
  default: { 1: 'B', 2: 'C', 3: 'A' },
};

function sessionState(m: Module): Module['sessionState'] {
  const t = now().getTime();
  if (t < new Date(m.scheduledDate).getTime()) return 'upcoming';
  if (t <= new Date(m.endDate).getTime()) return 'live';
  return 'recorded';
}

function quizState(s: DemoState, slug: string): QuizState {
  return s.quizzes[slug] ?? emptyQuiz();
}

function moduleView(s: DemoState, m: Module): Module {
  const state = sessionState(m);
  const q = quizState(s, m.slug);
  return {
    ...m,
    sessionState: state,
    sessionStatus: state === 'recorded' ? 'completed' : state,
    isCompleted: q.passed,
    isScheduled: !!s.scheduled[m.slug],
    scheduledProvider: s.scheduled[m.slug] ?? null,
    quiz: { ...m.quiz, isOpen: state !== 'upcoming', attemptsUsed: q.attemptsUsed, isPassed: q.passed },
  };
}

function modules(s: DemoState) {
  return fixtureModules.map((m) => moduleView(s, m));
}

function earnedBadges(s: DemoState): EarnedBadge[] {
  return modules(s).filter((m) => quizState(s, m.slug).passed).map((m) => ({
    id: `badge-${m.slug}`, slug: m.slug, moduleSlug: m.slug, week: m.week, name: m.badge.name, image: m.badge.image,
    partnerName: m.partnerName || m.companyTag, earnedAt: '2026-10-09T15:00:00.000Z', moduleTitle: m.title,
  }));
}

function baseQuiz(slug: string): Quiz {
  const src = (slug === 'si-her-collective-capital' ? quiz1Fx : quiz2Fx) as { data: Quiz };
  const m = fixtureModules.find((x) => x.slug === slug);
  const q = clone(src.data);
  if (m && slug !== 'si-her-collective-capital' && slug !== 'test-live-session') {
    q.title = `Week ${m.week} quiz · ${m.title}`;
    q.badge = m.badge;
  }
  return { ...q, moduleSlug: slug };
}

// ---------------------------------------------------------------- request handler

type Json = Record<string, unknown> | unknown[] | null;
export interface MockResponse { status: number; body: { success: boolean; message: string; data?: unknown } }

const ok = (data: unknown, message = 'ok'): MockResponse => ({ status: 200, body: { success: true, message, data } });
const fail = (status: number, message: string): MockResponse => ({ status, body: { success: false, message } });

export async function handle(method: string, path: string, body?: Json): Promise<MockResponse> {
  const s = getState();
  await new Promise((r) => setTimeout(r, s.flags.latency));
  const res = route(s, method, path.split('?')[0], (body ?? {}) as Record<string, unknown>);
  setState(() => {});
  return res;
}

function route(s: DemoState, method: string, p: string, body: Record<string, unknown>): MockResponse {
  const key = `${method} ${p}`;
  switch (key) {
    // auth
    case 'POST /auth/claim-seat':
      if (s.flags.emailNotFound) return fail(404, 'We couldn’t find a Si Her DeFi application for that email.');
      s.user.email = String(body.email || s.user.email);
      return ok({ email: s.user.email, otpSent: true }, 'Verification code sent');
    case 'POST /auth/resend-otp':
      return ok({ email: body.email, otpSent: true }, 'Verification code resent');
    case 'POST /auth/verify-otp':
      if (s.flags.wrongCode || body.code === '000000') return fail(400, 'That code is incorrect. Check your email and try again.');
      s.signedIn = true;
      return ok({ token: 'demo-token', user: s.user, profile: s.profile.name ? s.profile : null }, 'Email verified');
    case 'GET /auth/me':
      return ok({ user: s.user, profile: s.profile.name ? s.profile : null });
    case 'POST /auth/logout':
      s.signedIn = false;
      return ok({});

    // profile
    case 'GET /profile':
      return ok({ ...s.profile, prefilledFields: s.prefill.prefilledFields });
    case 'GET /profile/prefill':
      return ok(s.prefill);
    case 'PUT /profile':
    case 'POST /profile':
      Object.assign(s.profile, body);
      return ok(s.profile, 'Profile saved');

    // wallet
    case 'GET /wallet/status':
      return ok(s.user.walletAddress
        ? { connected: true, address: s.user.walletAddress, chainId: '0x2105', network: 'Base Mainnet', isOnBase: true }
        : { connected: false, address: null, chainId: null, network: null, isOnBase: false });
    case 'POST /wallet/nonce':
      return ok({ nonce: '482913', message: 'Sign this message to link your wallet to Si Her DeFi.\n\nNonce: 482913' });
    case 'POST /wallet/connect':
      s.user.walletAddress = String(body.address || DEMO_ADDRESS).toLowerCase();
      return ok({ connected: true, address: s.user.walletAddress });
    case 'DELETE /wallet/disconnect':
      s.user.walletAddress = null;
      return ok({ connected: false }, 'Wallet disconnected successfully');

    // onboarding part 1
    case 'GET /onboard/status': {
      const st = (statusFx as { data: OnboardStatus }).data;
      return ok({ ...st, part1Done: s.progress.status === 'completed', part1Status: s.progress.status, part1CompletedAt: s.progress.completedAt });
    }
    case 'GET /onboard/part1':
      return ok({ ...(part1Fx as { data: Part1 }).data, progress: s.progress });
    case 'PUT /onboard/part1/draft':
      Object.assign(s.progress, body, { status: 'draft' });
      return ok({ progress: s.progress });
    case 'POST /onboard/part1':
      Object.assign(s.progress, body, { status: 'completed', completedAt: now().toISOString() });
      return ok({ progress: s.progress });

    // modules
    case 'GET /modules':
      return ok(modules(s));
    case 'GET /modules/cms/speakers':
      return ok((speakersFx as { data: unknown }).data);

    // partners, badges, certificate, settings
    case 'GET /partners':
      return ok((partnersFx as { data: unknown }).data);
    case 'GET /partners/more-ways':
      return ok(null, 'More ways content');
    case 'GET /badges':
      return ok({ totalCohortBadges: 12, earnedCount: earnedBadges(s).length, badges: earnedBadges(s) } satisfies Badges);
    case 'GET /certificate':
      return ok(certificate(s));
    case 'GET /settings':
      return ok(s.settings);
    case 'PATCH /settings':
      Object.assign(s.settings, body);
      return ok(s.settings, 'Settings updated');
  }

  const parts = p.split('/').filter(Boolean);
  if (parts[0] === 'modules' && parts[1]) {
    const m = modules(s).find((x) => x.slug === parts[1] || x.id === parts[1]);
    if (!m) return fail(404, 'Module not found');
    if (parts[2] === 'schedule') {
      if (method === 'POST') { s.scheduled[m.slug] = String(body.calendarType || 'google'); return ok(moduleView(s, m), 'Added to calendar'); }
      if (method === 'DELETE') { delete s.scheduled[m.slug]; return ok(moduleView(s, m), 'Removed from calendar'); }
    }
    if (method === 'GET') return ok(m);
  }
  if (parts[0] === 'quiz' && parts[1]) return quiz(s, method, parts[1], parts[2], body);
  if (parts[0] === 'certificate' && parts[1] === 'verify') {
    const c = certificate(s);
    return c.verificationCode === parts[2] ? ok(c) : fail(404, 'Certificate not found');
  }
  return method === 'GET' ? fail(404, `No route for ${key}`) : ok({}, 'ok');
}

function quiz(s: DemoState, method: string, slug: string, action: string | undefined, body: Record<string, unknown>): MockResponse {
  const base = baseQuiz(slug);
  const m = modules(s).find((x) => x.slug === slug);
  if (!m) return fail(404, 'Quiz not found');
  const q = (s.quizzes[slug] ??= emptyQuiz());
  const isOpen = m.sessionState !== 'upcoming';
  if (method === 'GET') {
    return ok({
      ...base, isOpen, sessionState: m.sessionState, attemptsUsed: q.attemptsUsed,
      attemptsRemaining: base.maxAttempts - q.attemptsUsed, isPassed: q.passed, retryAvailableAt: q.retryAvailableAt,
      currentAttempt: q.answers.length ? { attemptNumber: q.attemptsUsed + 1, answers: q.answers } : null,
      lastResult: q.lastResult,
    } satisfies Quiz);
  }
  if (method === 'POST' && action === 'answer') {
    if (!isOpen) return fail(409, 'This quiz opens after the live session.');
    if (q.passed || q.attemptsUsed >= base.maxAttempts) return fail(409, 'No attempts left for this quiz.');
    const n = Number(body.questionNumber);
    const keys = QUIZ_KEYS[slug] ?? QUIZ_KEYS.default;
    const forcedWrong = s.flags.quizMode === 'fail' && n === 2;
    const isCorrect = !forcedWrong && body.selectedOption === keys[n];
    const chapter = m.chapters[Math.min(n, m.chapters.length - 1)];
    const a: QuizAnswer = {
      attemptNumber: q.attemptsUsed + 1, questionNumber: n, selectedOption: String(body.selectedOption), isCorrect,
      explanation: isCorrect ? 'That’s right — this is the idea the session builds on.' : '',
      hint: isCorrect ? null : chapter ? { timestamp: chapter.time, title: chapter.title } : null,
    };
    q.answers.push(a);
    if (n === base.totalQuestions) {
      const score = q.answers.filter((x) => x.isCorrect).length;
      const passed = score >= base.passingScore;
      q.attemptsUsed += 1;
      q.passed = passed;
      q.retryAvailableAt = !passed && q.attemptsUsed >= base.maxAttempts ? new Date(now().getTime() + base.retryAfterHours * 3600e3).toISOString() : null;
      a.result = q.lastResult = {
        passed, score, totalQuestions: base.totalQuestions, passingScore: base.passingScore,
        attemptsUsed: q.attemptsUsed, attemptsRemaining: base.maxAttempts - q.attemptsUsed, retryAvailableAt: q.retryAvailableAt,
        badgeEarned: passed ? base.badge : null, certificateUnlocked: passed && m.isPrerequisiteForCertificate,
        review: q.answers.filter((x) => !x.isCorrect).map((x) => ({ questionNumber: x.questionNumber, questionText: base.questions[x.questionNumber - 1].questionText, hint: x.hint })),
      };
      q.answers = [];
    }
    return ok(a);
  }
  return fail(404, 'Not found');
}

function certificate(s: DemoState): Certificate {
  const c = clone((certificateFx as { data: Certificate }).data);
  const badges = earnedBadges(s);
  const unlocked = quizState(s, 'si-her-collective-capital').passed;
  c.recipientName = s.profile.name;
  c.walletAddress = s.user.walletAddress;
  c.badges = badges;
  c.stillOpen = modules(s).filter((m) => m.sessionState !== 'upcoming' && !quizState(s, m.slug).passed).map((m) => ({ week: m.week, title: m.title, slug: m.slug }));
  if (!unlocked) return c;
  c.status = s.minted ? 'minted' : 'earned';
  c.issuedAt = '2026-12-03T17:00:00.000Z';
  c.verificationCode = 'SHD-01-7Q4K';
  c.verifyUrl = 'https://certifications.si3.space/siherdefi/verify/SHD-01-7Q4K';
  if (s.minted) {
    const tx = `0x9f${'e1'.repeat(31)}`;
    c.onChain = { ...c.onChain, enabled: true, contractAddress: '0x5b2e00000000000000000000000000000000c3a1', tokenId: '42', txHash: tx, mintedAt: '2026-12-04T10:00:00.000Z', explorerUrl: `https://basescan.org/tx/${tx}` };
  }
  return c;
}
