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
