# 06 · Onboarding Part 2 + minting the certificate

Try it: Prototype panel → **"All sessions done — Part 2 open, ready to mint"**. Screens, in order: `f1-dashboard` → `f2-part2` → `f3-part2-done` → `f4-mint-review` → `f5-sign` → `f6-minting` → `f7-minted` → `f9-dashboard-done`.

## Part 2 (opens when every session and its quiz are done)
- Dashboard → "Your onboarding": the Part 2 row goes **Locked** ("Opens once you've finished every session and its quiz.") → **Open now** with **Start Part 2** (Primary) → **Done** with Review. The header bar shows 2 of 2.
- Page `/onboard/part-2`: "Part 2 of 2 · Close out your cohort", three reflection questions (two required, one optional) in the floating-label field, **Finish Part 2**. Missing answers show "Add a short answer to continue." under the field.
- Done screen: "Onboarding complete" → **Mint your certificate** (goes to the certificate with the mint flow open).
- **Content is a placeholder:** the CMS has no Part 2 yet. API in the prototype: `GET /onboard/part2` (title, subtitle, questions, unlocked, progress), `POST /onboard/part2 { answers }`; status adds `part2Unlocked` (Part 1 done + every quiz done) and `part2Done`.

## Minting
- Certificate page → "On Base" card: **Mint on Base** (was "Mint on Base — coming soon", disabled). Disabled while the certificate is locked or no wallet is connected. Dashboard "Your certificate is ready → Mint on Base" and the Part 2 done screen open it directly (`/certificate?mint=1`).
- Pop-up steps: **Review** (certificate, badges N of 12, mints to 0x…, network Base, gas covered by Si Her DAO; Mint on Base / Not now) → **Confirm in your wallet** → **Minting on Base…** (3-step progress) → **Minted on Base** (token #, transaction, View your certificate / View on BaseScan ↗). Error state: "Couldn't mint your certificate" with Try again.
- After minting, the certificate page shows the on-chain details and the dashboard "ready to mint" card disappears.
- **Prototype only:** the wallet signature and transaction are simulated (`POST /certificate/mint`). Production: request a signature from the connected wallet, send the sponsored mint on Base, wait for the receipt, then show the token id and tx hash.

## Round 2 (Oct 12)
- **Dashboard order once every session is done:** "Your learning path" now leads with **Your onboarding** (Part 2 open) and the **certificate card**, then **Your sessions (N)** ("All done. Rewatch any time.") below. Before that, the order is unchanged (this week → sessions → onboarding → certificate).
- **One certificate card:** the plain "Your certificate" row only shows while it's locked. Once unlocked it's the image card: "Ready to mint · Mint on Base", and after minting "Minted on Base · Your certificate is on Base · View certificate". The "96 learners have minted theirs" stack uses photos (prototype stand-ins from randomuser.me; production: real minters' avatars).
- **Part 2 page:** a white welcome card ("Part 2 of 2 · Close out your cohort", "You made it, {first name}", your earned badges), then one card per question with no numbers, then "N of M answered · only the SI<3> team reads these" with **Finish Part 2**.
- **Questions come from the CMS** (any number, written by Kara); each has `question`, optional `hint` / `placeholder`, and `required`. **No character limit.**

## Round 3 (Oct 12): certificate design, Part 2 done screen, confetti
- **Certificate artwork = Haseeb's design "1a — Certificate · Light"** (2000×2000). `public/v2/certificate-base.svg` is that file with the name, the 12 placeholder badges and the on-chain values removed; `CertificateArt` draws them on top, positioned in the design's 2000-unit grid and sized with container units, so it scales and downloads correctly:
  - **Name:** the member's name (shrinks for long names so it stays on one line).
  - **Badges:** the badge art for each module passed, in the design's 7 + 5 slots; a dashed empty hexagon until earned.
  - **Box:** Contract (short address once minted, "At mint" before), Token ID (#0042 once minted, "—" before), Network ● BASE, Verify si3.space/verify.
  - The description line ("has completed the 10-week …") and the issuer/presenter logos come straight from the design file.
- **Part 2 done screen** (`g1-done-confetti.png`): "You did it, Ada." with the green check, the live certificate on the left, and a "Mint your certificate" card on the right (Onboarding · 2 of 2 complete, badges 12 of 12, network Base, **Mint your certificate**, Back to dashboard). A confetti shower plays when you finish.
- **Confetti** (`components/ui/Confetti.tsx`): ~90 small pieces in the brand colours fall for about 4 seconds, then remove themselves; plays when Part 2 is finished and when the mint succeeds (`g3-minted-confetti.png`). Hidden for people who turn on reduced motion.
