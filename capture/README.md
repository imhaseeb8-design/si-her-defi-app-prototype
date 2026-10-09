# Live app capture — Si Her DeFi (as of 2026-10-09)

Every screen and state of https://certifications.si3.space/siherdefi as it exists today. This is the **baseline** the prototype rebuilds before any UX/UI changes.

- `shots/` — full-page screenshots (desktop 1440 wide, mobile 390 wide @2x)
- `html/` — the rendered page HTML for each shot (opens with live styles via `<base>`)
- `text/` — the visible copy of each shot, for copy review and diffing

## How these were captured

The onboarding only shows once per account, so the journeys were run in a clean browser as a placeholder applicant (**Ada Nwosu, ada@example.com**). The real app code ran unchanged. Only the server replies were simulated, using sanitized copies of real responses (`tools/capture/fixtures/`). Nothing was sent to the real server: no emails, no saves, no wallet links. The wallet step used a fake MetaMask with no keys or funds.

Two things come from the simulation, not the live server:
- **Error messages** in A07 and A09 are placeholder copy, because the server writes its own error text. The layouts are real.
- **Badge and certificate data** in D07 and G02–G03 follows the shapes the app expects. These states had no real data yet.

To re-run: see `tools/capture/README.md`.

## Screens

### A · Sign in (`/login` → `/verify` → `/verified`)
| | |
|---|---|
| A01 | Email: empty |
| A02 | Email: filled |
| A03 | 6-digit code: empty, resend countdown |
| A04 | Code: partly typed |
| A05 | Code: complete |
| A06 | "Email verified": seat held, next step "Create your profile" |
| A07 | Email not on the applicant list (error) |
| A08 | Invalid email format |
| A09 | Wrong code (error) |
| A10 | Resend available (countdown finished) |
| A11 | Code resent |
| A12 | "Need help?" link → **404** |

### B · Profile (`/profile`)
| | |
|---|---|
| B01 | Pre-filled from the application |
| B02 | Name cleared, then Save (browser's own "Please fill out this field") |
| B03 | Photo added |
| B04 | All fields complete |
| B05 | No application data (all empty) |
| B06 | Editing from the dashboard (`?from=dashboard`, "Save changes") |

### C · Wallet (`/wallet`)
| | |
|---|---|
| C01 | No wallet extension detected |
| C02 | MetaMask detected ("Ready to connect") |
| C03 | Connecting (waiting for the wallet) |
| C04 | Connected, waiting for the signature ("Sign the message in your wallet to link it") |
| C05 | Connected and linked |
| C06–C07 | Wrong network: the wallet provider's (Reown's) "Switch Network" pop-up |
| C08 | Connection rejected in the wallet |
| C09 | Signature rejected in the wallet |
| C10 | WalletConnect: the wallet provider's (Reown's) wallet list pop-up |

### D · Dashboard (`/dashboard`)
| | |
|---|---|
| D01 | New user: "Start here", Week 1 locked until Part 1 is done |
| D02 | Part 1 done: Week 1 live session open |
| D03 | Part 1 in progress |
| D04 | Add to calendar pop-up (Google / Apple / Outlook / Proton / .ics) |
| D05 | User menu (Edit profile, Settings, Log out) |
| D07 | After passing the Week 1 quiz: badge earned (1 of 12) |

### E · Onboarding Part 1 (`/onboard`)
| | |
|---|---|
| E01 | Start: video, follow SI<3>, task list |
| E02 | Video marked as watched |
| E03–E04 | Followed X, then LinkedIn |
| E05 | Questions pop-up: Q1 empty |
| E06–E07 | Q1 typing, then answered |
| E08–E14 | Q2 → Q4 (Q4 optional), Submit → "You're ready to begin" |
| E15 | Save & exit partway through |

### F · Module + quiz (`/module/[slug]`)
| | |
|---|---|
| F01 | Week 1 module: recording, chapters, "Earn your week 1 badge" |
| F02 | Quiz: Q1 |
| F03 | Quiz passed: each answer, then "Badge earned" |
| F04 | Module after passing |
| F05 | Quiz failed (2 of 3): wrong answer, then rewatch hints and "Try again" |
| F06 | Module after a failed attempt ("Worth a rewatch") |
| F07 | Upcoming module (Token Fundamentals, speaker card) |
| F08 | Last attempt failed: locked for 24 hours |
| F09 | Module while locked |

### G · Certificate (`/certificate`)
| | |
|---|---|
| G01 | Locked: preview watermark, "Go to Week 1" |
| G02 | Earned: share, LinkedIn, download, verification link |
| G03 | Minted on Base |

### H · Settings (`/settings`)
| | |
|---|---|
| H01 | Settings |
| H02 | After clicking Disconnect: the wallet is removed at once, with no confirmation |

### M · Mobile (390 wide)
M01 sign-in · M02 code · M03 verified · M04 profile · M05 wallet · M06 wallet connected · M07 dashboard (new user) · M08 mobile menu · M09 onboarding · M10 onboarding question · M11 dashboard (active) · M12 module · M13 quiz · M14 certificate · M15 settings

## Issues spotted while capturing (to triage, not yet the redesign)
1. **"Need help?" is a dead link.** It goes to `/help` outside the `/siherdefi` base path and shows a 404 (A12).
2. **Disconnecting the wallet happens instantly, with no confirmation** (H02). Yet the wallet is where the certificate is minted.
3. **The required name field uses the browser's own validation tooltip**, not the app's error style (B02).
4. **On phones, the sign-in header text overlaps the logo** ("Already registered? Use the same email…", M01).
5. **The intro video is a placeholder.** The YouTube link set in the CMS shows unrelated content (E01).
6. **The live app's own text has a gap:** the sign-in panel says "an on-certificate demonstrating your DeFi credentials".
7. **The sidebar wallet chip can say "Not connected / Connect" on module and certificate pages** while the dashboard shows the wallet as linked. This needs checking against a real session (it may only happen in the simulation).
