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
