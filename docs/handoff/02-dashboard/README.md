# 02 · Dashboard — header

`src/app/(app)/dashboard/page.tsx` (header), `src/components/app/AppShell.tsx` (mobile top bar). Screenshot: `after-header.jpg`.

- **Greeting is the page headline.** It was a purple pill tag above a small grey subtitle. Now it's "Welcome, Ada 👋": Geist SemiBold 30/1.15 (26 on phones), tracking −0.02em, `#151534`.
- **Subtitle:** 15/24 `#4c4d77`, max width 560px. Same stage-based copy as before.
- **Network status chip, pinned top-right** (aligned to the top of the headline): "● Base | ● Active". The blue dot is Base; the green dot gently pulses (no pulse with reduced motion). The wallet address moved into the tooltip; the chip still links to BaseScan.
  - White, `#e7e7f1` border, fully rounded, 12.5px.
  - No wallet: "● Base | Connect wallet", linking to `/wallet`.
- **Phones:** the page-level chip is hidden, and the top bar chip shows the same "Base | Active" in place of the address.

## Badges earned card
Screenshot: `after-badges.jpg` (0 badges, 1 badge, mobile).
- The 12 dashed hexagons are replaced by a compact **segmented progress bar**: one segment per weekly badge. Earned segments fill in brand purple, the next one to earn is light purple, the rest are grey. Hovering a segment shows the week and module title.
- Header: "Badges earned" (15px semibold) with the count on the right as "0 / 12".
- One line of help text under the bar, then a **"Next badge: Week 01 · {module title}"** row at the bottom. That row also fills the height the card gets from sitting next to the profile card on desktop.
- Handles 13 badges: the segment count follows the number of modules.

## Profile card (trial)
Screenshot: `after-profile-card.jpg`. Built to sit beside the badges card at the same height, with matching footers.
- Avatar on the left with a brand-gradient ring; name (17px semibold) and "Role · Organization" beside it.
- Bio below, clamped to 2 lines. With no bio, a muted "Add a short bio" link takes its place.
- Footer row (divider, like the badges card's "Next badge" row): social link on the left, opening in a new tab; "Edit profile" on the right as a purple text link instead of the outlined pill.

## Start here card
- Lighter overlay (black 65% → 35% → 20%, left to right) and the image at full opacity, so the artwork shows through.
- No bold or semibold: tag and title are medium, the rest regular.
- Tag shows only the step ("Get started"); the program name is dropped from the CMS label.
- "Required before Si Her DeFi modules unlock*" sits bottom-right, aligned to the bottom of the button row.
- The CMS image has black letterbox bars baked in; the prototype zooms it 1.22× to crop them. Better fix: re-export the image without bars.

## This week (featured module) card
- "Live session · SI" line removed.
- The date/time pill becomes "Week 01 · Session recording" (or "Recording after the live session" until the video is uploaded). Sessions are watched as recordings here, so no date, day or time.
- New cover image (`public/v2/module-cover.webp`), with a lighter overlay: dark on the left behind the text, nearly clear on the right. On mobile a soft fade at the bottom keeps the small text readable.
- Locked (Part 1 not done): "Start session" shows in the Disabled state and isn't clickable; the meta line starts "Finish Part 1 to unlock". The "Quiz open" status is hidden while locked.
- Title, pill and monogram use medium weight, not bold.

## Badge art and earned states
Screenshot: `after-badges-earned.jpg` (1, 4 and 12 earned).
- Badge art from the design team lives in `public/v2/badges/` (192px PNG, one per week: 01 Module #1, 02 Module #2, 03 FinDaS, 04 Cashi, 06 Sodax, 07 Ixian, 09 CryptoMommi). In the real app this is each module's `badge.image` from the CMS.
- Once you've earned one, the help line is replaced by your badges in a 12-column row under the progress bar (max 40px each; hover shows week and module).
- With all 12 earned, the footer becomes "✓ All 12 badges earned. They're all on your certificate."
- Demo panel presets to test it: "Week 1 badge earned", "4 badges earned", "All 12 badges earned" (the 5 weeks without a module in the fixtures reuse existing art).

## Section headings
Screenshot: `after-sections.jpg`.
- Bigger and easier to read: 17px Medium, dark grey `#45465f` (was 11.5px light grey).
- New copy: "Start here" → **Begin your journey** (then **Your onboarding** once Part 1 is done); "This week" / "Modules & credentials" → **Your learning path**; "From our partners (2)" → **From our partners**.
- The small notes on the right of those headings go from 11px to 12.5px.

## Upcoming sessions: 3 at a time
Screenshot: `after-sessions-more.jpg`.
- The list shows the first **3** sessions. Below it, **Show more sessions (N)** reveals 3 more each click, with N the number still hidden. Once everything is showing it becomes **Show fewer**, which goes back to 3.
- The heading still counts them all ("Upcoming sessions (6)"), so any number of sessions can come from the CMS without stretching the page.
- With 3 or fewer sessions, no button shows.

## Upcoming session card
Screenshots: `after-session-cards.jpg` (all rows, desktop + mobile), `after-session-card-trial.jpg`. Approved and used on every row.
- **Why:** the old rows printed the CMS's free-text `dateLabel`, so formats differed ("Thursday, October 15, 2026 · 12:00–1:00 PM ET" vs "Oct 22 · 12–1 PM ET"), and the "Opens Oct 15" pill repeated the date.
- **New card:** date tile on the left, styled as a small calendar page: purple strip with the month, the day large (`after-session-date-tile.png`), then title (15px), "Thursday, Oct 15 · 12:00–1:00 PM ET", then speaker · company (no monogram box). "Add to calendar" on the right (full width under the content on mobile); once added it turns green, "In your calendar". Sessions that have already opened show "Quiz open" or "Badge earned" with an **Open →** button instead. Solid border, white card; the "Opens" pill is gone.
- **Formatting:** built from `scheduledDate`/`endDate` in US Eastern time with `sessionWhen()` (`src/lib/format.ts`), so every card reads the same whatever is typed in the CMS.
- **Data issue found:** "From TradFi to DeFi" has `scheduledDate` 12:00 UTC (= 8:00 AM ET) but its label says 12:00–1:00 PM ET. Fix the start/end time in the CMS (should be 16:00–17:00 UTC).
- **CMS fix:** Kara Howard's sessions should list her company as **SI<3>** (Week 1 had none, Week 2 said "Si Her DeFi"). The prototype's demo data now uses SI<3>.
- **Update:** no drop shadow on the cards or the date tile (border only). "Add to calendar" is now **Button · Primary md** with the calendar icon in place of the arrow (full width on mobile); once added it's a green "In your calendar" button. "Open" on started sessions is Primary md too.
- **Fade:** while more sessions are hidden, the bottom of the 3rd card fades into the page background (`#f8f8fc`) and "Show more sessions (N)" sits on the fade (`after-sessions-fade.jpg`). No 4th card shows. The fade doesn't block clicks; once everything is showing it's gone.
- **Featured module card:** the "SI" monogram box next to the presenter is removed; the line reads "Presented by Kara Howard · SI<3>".

## Sidebar: "Powered by Base" moves into the wallet chip (trial)
Screenshot: `after-sidebar-base.jpg` (wallet connected / not connected).
- The "Powered by BASE" pill under the logo is gone (desktop sidebar and mobile menu).
- The wallet chip at the bottom now has two lines: **Powered by ● BASE** on top, then a thin divider and your address (links to BaseScan) with a green **● Connected**, or "No wallet connected" with **Connect**.
- Still hides with the rest of the chip when the sidebar is collapsed.

## Certificate card: locked until everything is done
Screenshot: `after-certificate-card.jpg` (locked, unlocked, mobile).
- **Rule change:** the certificate unlocks once **every session's quiz is passed**, not after Week 1. The sidebar's Certificate item stays Locked until then. (Prototype: `allPassed()` in `src/lib/mock/server.ts`; the "Week 1 badge earned" and "4 badges earned" presets are now locked, "All 12 badges earned" and "Certificate minted" are unlocked.)
- **Locked:** white-violet card, lock tile, "Your certificate" with a **Locked** tag, "Finish every session and pass each quiz to unlock it. Then mint it on Base with all your badges.", progress "4 of 7 quizzes passed", and a Disabled "View certificate" button with a lock.
- **Unlocked:** award tile, "Minted on Base, with every badge you earned.", Primary "View certificate →".
- The note next to "Your learning path" now says "Finish every session to unlock your certificate".
