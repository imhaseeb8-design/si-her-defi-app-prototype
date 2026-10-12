// API client with the same surface as the live app (authApi, profileApi, walletApi, …).
// By default every call is answered by the simulated server in ./mock/server.ts.
// Set NEXT_PUBLIC_API_BASE (e.g. https://certifications-server.vercel.app/api/v1) to use a real backend.
import { handle } from './mock/server';
import type {
  Badges, Certificate, CohortEvent, Me, Module, OnboardStatus, Part1, Part1Progress, Part2, Partner, Prefill, Profile, Quiz, QuizAnswer,
  Settings, Speaker, WalletStatus,
} from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || '';
export const BASE_PATH = '/siherdefi';
const TOKEN = 'siherdefi_auth_token';
const USER = 'siherdefi_auth_user';

export class ApiErrorResponse extends Error {
  statusCode: number;
  data: unknown;
  constructor(message: string, statusCode: number, data: unknown) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export function assetPath(p?: string | null) {
  if (!p) return '';
  if (/^(https?:|data:|blob:)/.test(p)) return p;
  const r = p.startsWith('/') ? p : `/${p}`;
  return r === BASE_PATH || r.startsWith(`${BASE_PATH}/`) ? r : `${BASE_PATH}${r}`;
}

export const getToken = () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN));
export const isAuthenticated = () => !!getToken();
export function setAuthToken(t: string) { window.localStorage.setItem(TOKEN, t); }
export function setAuthUser(u: unknown) { window.localStorage.setItem(USER, JSON.stringify(u)); }
export function getAuthUser<T = { email: string }>(): T | null {
  try { return JSON.parse(window.localStorage.getItem(USER) || 'null'); } catch { return null; }
}
export function clearLocalSession() {
  window.localStorage.removeItem(TOKEN);
  window.localStorage.removeItem(USER);
  window.sessionStorage.removeItem('siherdefi_dev_code');
}

async function request<T>(path: string, init: { method: string; body?: unknown } = { method: 'GET' }): Promise<T> {
  let status: number;
  let json: { success?: boolean; message?: string; error?: string; data?: unknown } | null;
  if (API_BASE_URL) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(`${API_BASE_URL}${path}`, { method: init.method, headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    status = res.status;
    json = await res.json().catch(() => null);
  } else {
    const res = await handle(init.method, path, (init.body ?? null) as Record<string, unknown>);
    status = res.status;
    json = res.body;
  }
  if (status >= 400) {
    if (status === 401 && getToken() && !path.startsWith('/auth/verify-otp')) {
      clearLocalSession();
      window.location.assign(`${BASE_PATH}/login`);
    }
    throw new ApiErrorResponse(json?.message || json?.error || `Request failed with status ${status}`, status, json);
  }
  return (json?.data !== undefined ? json.data : json) as T;
}

export function nextOnboardingRoute(p: { name?: string | null; walletAddress?: string | null }) {
  return p.name?.trim() ? (p.walletAddress ? '/dashboard' : '/wallet') : '/profile';
}

export const authApi = {
  claimSeat: (email: string) => request<{ email: string }>('/auth/claim-seat', { method: 'POST', body: { email: email.trim().toLowerCase() } }),
  verifyOtp: (email: string, code: string) => request<{ token: string; user: Me['user']; profile: Profile | null }>('/auth/verify-otp', { method: 'POST', body: { email: email.trim().toLowerCase(), code: code.trim() } }),
  resendOtp: (email: string) => request('/auth/resend-otp', { method: 'POST', body: { email: email.trim().toLowerCase() } }),
  getMe: () => request<Me>('/auth/me'),
  async logout() {
    try { await request('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } finally { clearLocalSession(); }
  },
};

export async function fetchNextOnboardingRoute() {
  const { user, profile } = await authApi.getMe();
  return nextOnboardingRoute({ name: profile?.name, walletAddress: user?.walletAddress });
}

export const profileApi = {
  getProfile: () => request<Profile>('/profile'),
  updateProfile: (p: Partial<Profile>) => request<Profile>('/profile', { method: 'PUT', body: p }),
  getPrefill: () => request<Prefill>('/profile/prefill'),
};

export const walletApi = {
  getStatus: () => request<WalletStatus>('/wallet/status'),
  connect: (address: string, chainId = '0x2105', signature?: string) => request('/wallet/connect', { method: 'POST', body: { address, chainId, signature } }),
  disconnect: () => request('/wallet/disconnect', { method: 'DELETE' }),
  getNonce: () => request<{ nonce: string; message: string }>('/wallet/nonce', { method: 'POST' }),
};

export const onboardApi = {
  getStatus: () => request<OnboardStatus>('/onboard/status'),
  getPart1: () => request<Part1>('/onboard/part1'),
  saveDraft: (p: Partial<Part1Progress>) => request('/onboard/part1/draft', { method: 'PUT', body: p }),
  submitPart1: (p: Partial<Part1Progress>) => request('/onboard/part1', { method: 'POST', body: p }),
  getPart2: () => request<Part2>('/onboard/part2'),
  submitPart2: (answers: Record<string, string>) => request('/onboard/part2', { method: 'POST', body: { answers } }),
};

export const modulesApi = {
  getAll: () => request<Module[]>('/modules'),
  getCmsSpeakers: () => request<Speaker[]>('/modules/cms/speakers'),
  getOne: (slug: string) => request<Module>(`/modules/${slug}`),
  schedule: (slug: string, calendarType = 'google') => request<Module>(`/modules/${slug}/schedule`, { method: 'POST', body: { calendarType } }),
  unschedule: (slug: string) => request<Module>(`/modules/${slug}/schedule`, { method: 'DELETE' }),
};

export const quizApi = {
  getQuiz: (slug: string) => request<Quiz>(`/quiz/${slug}`),
  answer: (slug: string, questionNumber: number, selectedOption: string) => request<QuizAnswer>(`/quiz/${slug}/answer`, { method: 'POST', body: { questionNumber, selectedOption } }),
  /** after every attempt is used: start a fresh set of attempts */
  restart: (slug: string) => request<Quiz>(`/quiz/${slug}/restart`, { method: 'POST' }),
  /** after every attempt is used: move on without the badge */
  skip: (slug: string) => request<Quiz>(`/quiz/${slug}/skip`, { method: 'POST' }),
};

export const badgeApi = { getBadges: () => request<Badges>('/badges') };
export const certificateApi = {
  getCertificate: () => request<Certificate>('/certificate'),
  verifyPublic: (code: string) => request<Certificate>(`/certificate/verify/${encodeURIComponent(code)}`),
  /** soulbound mint on Base to the connected wallet (gas covered by Si Her DAO) */
  mint: () => request<Certificate>('/certificate/mint', { method: 'POST' }),
};
export const settingsApi = {
  getSettings: () => request<Settings>('/settings'),
  updateSettings: (s: Partial<Settings>) => request<Settings>('/settings', { method: 'PATCH', body: s }),
};
export const eventsApi = { getAll: () => request<CohortEvent[]>('/events') };

export const partnerApi = {
  getPartners: () => request<Partner[]>('/partners'),
  getMoreWays: () => request<unknown>('/partners/more-ways'),
};

export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.') {
  return e instanceof Error && e.message ? e.message : fallback;
}
