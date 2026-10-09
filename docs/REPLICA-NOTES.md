# Replica notes

The prototype was checked side by side against the live captures in `capture/shots` (`tools/capture/proto.js` + `compare.js`). Layout, spacing, copy and states match. Where the replica had to guess or differs on purpose, it's listed here.

## Simulated, not real
- **Backend:** `src/lib/mock/server.ts` answers every API call. Its seed data is a sanitized copy of real responses (`src/lib/mock/fixtures`).
- **Wallet:** the live app uses wagmi + Reown AppKit with real wallets. Here, connect / sign / reject / wrong-network are simulated from the Prototype panel.
- **Reown pop-ups** ("Switch Network", "Connect Wallet", QR): look-alikes of a third-party component, not pixel-exact.
- **Email codes:** no email is sent. Any 6-digit code works; `000000` = wrong.

## Not captured from the live app (best guess)
- **`/verify/[code]` public certificate page:** the live page needs a real issued certificate.
- **Collapsed sidebar:** the collapse button exists live, but the collapsed state wasn't captured.
- **Mobile header "Connect" pill** when no wallet is linked.
- **The quiz "not open yet" message** when starting an upcoming module's quiz.
- **"Live now" / "Join live session"** while a session is in progress.
- **"In your calendar ✓"** after adding a session to a calendar.
- **Email-not-found and wrong-code error copy:** the server writes this text; the wording here is a placeholder.

## Deliberate differences
- **Profile pre-fill:** for a new applicant, the form arrives filled in from the application, with the banner and "FROM YOUR APPLICATION" tags. This matches a real applicant's account. (The simulated new user in `capture/B01` had no application data.)
- **"Today" is pinned to 2026-10-09** by default, so states match the captures. Change it in the Prototype panel.
- **The sidebar wallet chip** reads the wallet from the backend status, so it's consistent across pages (see IMPROVEMENTS #14).
