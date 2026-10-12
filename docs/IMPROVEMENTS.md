# UX/UI improvements — backlog

Found while capturing and rebuilding the live app (2026-10-09). In the prototype each item is still reproduced **as it is live**, so the fixes can be designed, tested here and handed off one by one.

Status key: **open** = not designed yet · **designed** = shown in Figma · **built** = done in the prototype, ready for handoff.

| # | Where | Issue | Why it matters | Status |
|---|---|---|---|---|
| 1 | `/verify`, `/verified` | **"Need help?" is a dead link.** It points to `/help`, outside the `/siherdefi` base path, which shows a 404. | Anyone stuck on the code step has nowhere to go. | open |
| 2 | Avatar everywhere | **The default avatar is a real woman's portrait** (`ada-portrait.jpg`). Anyone without a photo shows the same stranger's face in the sidebar, dashboard and settings. | Looks like someone else's account, and is confusing in a cohort of real people. | open |
| 3 | Settings → Connected wallet | **Disconnect happens instantly, with no confirmation.** It removes the wallet the certificate is minted to. | One mis-click breaks a key setup step. | open |
| 4 | `/profile` | **The required-name error uses the browser's grey "Please fill out this field" bubble**, not the app's own error style (as used on sign-in). | Inconsistent, and the native bubble disappears fast. | **built** — red field + "Add your name — it's the one printed on your certificate." ([foundations](handoff/00-foundations/README.md#text-fields)) |
| 5 | `/login` on phones | **The header text overlaps the logo** ("Already registered? Use the same email to sign in."). | First screen of the funnel looks broken on mobile. | **built** — moved into the card ([handoff](handoff/01-sign-in/README.md)) |
| 6 | `/login` artwork panel | **Copy gap:** "…and an on-certificate demonstrating…" (probably "an on-chain certificate"). | Typo on the first screen. | open — still in the new Figma |
| 7 | `/onboard` | **The intro video in the CMS points to an unrelated YouTube video** ("KARA INTRO VIDEO NEW" placeholder). | Content issue, but it's step 1 of onboarding. | open (content) |
| 8 | Dashboard → "Your certificate is ready" banner | **Hard-coded copy and social proof:** "Twelve modules, thirteen badges…" and "96 learners have minted theirs" show after just one badge, while minting isn't open yet ("coming soon"). | Mismatched promises; the made-up number undermines trust. | open |
| 9 | Sidebar → Certificate (locked) | **The tooltip names an old module:** "Unlocks once you complete Collective Capital for Creators" (the module is now "Si Her Collective Capital"). | Points users at something that doesn't exist. | open |
| 10 | Dashboard → badges card | **12 badge slots, but the schedule has 7 modules.** Weeks 5, 8, 10, 11 and 12 show as "Week N Module". | Unclear what's actually earnable. | open |
| 11 | Sign-in stepper | **The first step is labelled "Email verified" before the email is verified**, and stays bold/current on the email and code screens. | The progress indicator says the opposite of what's happening. | **built** on `/login` — "Verify your email" ([handoff](handoff/01-sign-in/README.md)); other steps follow with their screens |
| 12 | Module page (upcoming) | **"Start quiz →" is enabled before the session has happened.** | Invites an action that can't succeed yet. | open |
| 13 | Times | **Module labels say "12:00–1:00 PM ET" while the stored start time is 12:00 UTC** for Week 2, so "Live …" times disagree with the label. | Wrong times for a live session. | open (data) |
| 15 | `/verified` | **An extra "Email verified" screen between the code and the profile** — one more click before anything happens. | Slows the first-run flow. | **built** — removed; the code goes straight to Create your profile |
| 14 | Sidebar wallet chip | Can show **"Not connected / Connect"** on module and certificate pages while the dashboard shows the wallet as linked. | Needs checking with a real session. | to verify |
| 16 | Certificate artwork | **Unearned badge positions show empty hexagons and split earned badges apart.** | Members can earn different badge counts; the certificate should show only their earned badges in module order. | **built** — compact, centered rows ([before](handoff/06-part2-and-mint/before-badge-gaps.png) / [after](handoff/06-part2-and-mint/after-earned-badges.png)) |
| 17 | Dashboard after mint | **The minted certificate sits below the profile and badges as a generic banner.** | The completed credential should be visible near the top with a clear path to view or verify it. | **built** — certificate preview and two actions above the profile ([before](handoff/06-part2-and-mint/f9-dashboard-done.png) / [after](handoff/06-part2-and-mint/after-minted-dashboard-top.png)) |

Phase 2 plan: line each item up with the Figma frames, design the fix, build it behind the same screens here, then mark it **built** with a before/after screenshot.

## Redesign log (Phase 2)

| Screen | Figma | Handoff |
|---|---|---|
| 00 · Foundations — Geist only, sentence-case tags, Button components on every CTA | `1027:759` | [docs/handoff/00-foundations](handoff/00-foundations/README.md) |
| 01 · Sign in — "Claim your seat" | `1023:234` | [docs/handoff/01-sign-in](handoff/01-sign-in/README.md) |

Shared pieces built for the redesign:
- `Button · Primary` (Figma `1025:32`) and `Button · White` (`1027:731`): `src/components/ui/Button.tsx`, CSS `.btn-primary` / `.btn-white` / `.btn-md` in `globals.css`
- Floating-label email field (Bencho, MIT, on trial): `src/components/ui/LabelInput.tsx`, CSS "Label input" in `globals.css`
- New onboarding layout (full-width nav, steps, artwork rail): `src/components/onboarding/v2/OnboardingLayout.tsx`. Screens move onto it one by one as their designs arrive.
