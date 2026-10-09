# Capture tool

Re-shoots the live app (`certifications.si3.space/siherdefi`) into `capture/`. Uses your installed Google Chrome via puppeteer-core.

```bash
cd tools/capture && npm install
node capture.js scenarios/02-signin.js      # sign-in → profile
node capture.js scenarios/03-wallet.js      # wallet states (fake MetaMask)
node capture.js scenarios/04-onboard.js     # new-user dashboard + onboarding Part 1
node capture.js scenarios/05-states.js      # errors, menus, settings
node capture.js scenarios/06-module.js      # module, quiz pass/fail, certificate
node capture.js scenarios/07-mobile.js      # 390px versions
node contact.js out.jpg A0 B0               # contact sheet of matching screens
```

- `world.js` is a fake, stateful copy of the API (`certifications-server.vercel.app/api/v1`), seeded from `fixtures/`. Scenarios with `world` run in a clean, signed-out browser where every API call is answered locally, so nothing reaches the real server.
- `fake-wallet.js` injects a fake MetaMask (EIP-1193 + EIP-6963) to drive the wallet step: connect, sign, wrong network, reject.
- `scenarios/01-tour.js` + `login.js` capture with a **real** signed-in account (writes still blocked). That output contains personal data, so move it to `capture/_private/`, which is git-ignored.
- `fixtures/` holds sanitized copies of real responses (placeholder applicant, speaker emails removed). `fixtures-raw/` is the unsanitized source and is git-ignored.
