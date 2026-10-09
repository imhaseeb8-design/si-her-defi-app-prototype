# Si Her DeFi — Web App Prototype

A working React replica of the Si Her DeFi certification app ([certifications.si3.space/siherdefi](https://certifications.si3.space/siherdefi)). We use it to design and test UX/UI improvements, then hand them to the developer to apply in the real codebase.

**Live link:** https://si-her-defi-app-prototype.vercel.app/siherdefi. Every push to `main` redeploys it (Vercel project `si-her-defi-app-prototype`).

**Status:** Phase 1 is done. Every screen, flow and state of the live app is rebuilt and checked side by side against captures of the live app. Phase 2 (the improvements) starts from here.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3120/siherdefi.

- **No backend needed.** A simulated version of the certifications API runs in the browser and keeps its state in `localStorage`.
- **Signing in:** use any email. Any 6-digit code works; `000000` is treated as a wrong code.
- **The "Prototype" button** (bottom-left) opens the prototype controls. From there you can:
  - jump to any stage: new applicant → verified → profile → wallet → onboarding → Week 1 badge → minted certificate;
  - choose how the wallet behaves (none / MetaMask / reject connect / reject signature / wrong network);
  - force errors (email not on the applicant list, wrong code, failed quiz);
  - change "today's" date, which moves sessions from upcoming → live → recorded.
- **Hiding the panel:** `?demo=0` hides it (for clean screenshots); `?demo=1` brings it back.

## Screens

| Live route | What it is | File |
|---|---|---|
| `/` · `/login` | Claim your seat (email) | `src/app/login/page.tsx` |
| `/verify?email=` | 6-digit code | `src/app/verify/page.tsx` |
| `/verified` | Email verified → next step | `src/app/verified/page.tsx` |
| `/profile` | Set up your profile (and `?from=dashboard` edit mode) | `src/app/profile/page.tsx` |
| `/wallet` | Connect your wallet | `src/app/wallet/page.tsx` |
| `/dashboard` | Dashboard | `src/app/(app)/dashboard/page.tsx` |
| `/onboard` | Onboarding Part 1: video, socials, 4 questions | `src/app/(app)/onboard/page.tsx` |
| `/module/[slug]` | Weekly module + quiz | `src/app/(app)/module/[slug]/page.tsx` |
| `/certificate` | Certificate: locked / earned / minted | `src/app/(app)/certificate/page.tsx` |
| `/settings` | Settings | `src/app/(app)/settings/page.tsx` |
| `/verify/[code]` | Public certificate page (approximated) | `src/app/verify/[code]/page.tsx` |

Shared pieces:
- `src/components/onboarding/OnboardingShell.tsx` — header, steps and artwork panel for sign-in, profile and wallet
- `src/components/app/AppShell.tsx` — sidebar, mobile drawer and account menu
- `src/components/dashboard/ScheduleModal.tsx` — Add to calendar
- `src/components/module/*` — video player and quiz
- `src/components/certificate/CertificateArt.tsx` — the certificate card

## How it maps to the real app

- **Same stack:** Next.js (App Router) + Tailwind v4 + Geist, with the same `basePath` (`/siherdefi`) and the same colour tokens (`src/app/globals.css`).
- **Same API layer:** `src/lib/api.ts` exposes the same functions as the live client (`authApi`, `profileApi`, `walletApi`, `onboardApi`, `modulesApi`, `quizApi`, `certificateApi`, `badgeApi`, `settingsApi`, `partnerApi`). The response shapes in `src/lib/types.ts` were taken from real responses. Setting `NEXT_PUBLIC_API_BASE` sends every call to a real backend instead of the simulation.
- **Same markup:** screens were rebuilt from the live app's rendered HTML, so class names match. A change here shows the developer exactly which classes to change there.
- **Simulated pieces:** the wallet (the live app uses wagmi + Reown AppKit) and Reown's own pop-ups only approximate the look.

## Repo map

| Path | What |
|---|---|
| `capture/` | Baseline of the live app: 87 screenshots + HTML + copy, indexed in `capture/README.md` |
| `tools/capture/` | Scripts that re-capture the live app (`capture.js`) and screenshot the prototype in the same states (`proto.js`, `compare.js`) |
| `tools/html2jsx/` | Converts a captured page into JSX (how screens were rebuilt) |
| `docs/IMPROVEMENTS.md` | UX/UI issues found so far — the Phase 2 backlog |
| `docs/REPLICA-NOTES.md` | Where the replica deliberately differs from the live app, or had to guess |
| `AGENTS.md` | Working notes for AI agents and developers picking this up |
