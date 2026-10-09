# 02 · Dashboard — header

`src/app/(app)/dashboard/page.tsx` (header), `src/components/app/AppShell.tsx` (mobile top bar). Screenshot: `after-header.jpg`.

- **Greeting is the page headline.** It was a purple pill tag above a small grey subtitle. Now it's "Welcome, Ada 👋": Geist SemiBold 30/1.15 (26 on phones), tracking −0.02em, `#151534`.
- **Subtitle:** 15/24 `#4c4d77`, max width 560px. Same stage-based copy as before.
- **Network status chip, pinned top-right** (aligned to the top of the headline): "● Base | ● Active". The blue dot is Base; the green dot gently pulses (no pulse with reduced motion). The wallet address moved into the tooltip; the chip still links to BaseScan.
  - White, `#e7e7f1` border, fully rounded, 12.5px.
  - No wallet: "● Base | Connect wallet", linking to `/wallet`.
- **Phones:** the page-level chip is hidden, and the top bar chip shows the same "Base | Active" in place of the address.
