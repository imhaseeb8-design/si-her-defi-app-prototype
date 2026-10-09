# AGENTS.md

Working notes for anyone (human or AI) continuing this repo. Read `README.md` first.

## What this repo is
A faithful React replica of the live Si Her DeFi app (`certifications.si3.space/siherdefi`). It's used to design UX/UI fixes and hand them to the developer of the real codebase. We don't have access to the real codebase; this repo mirrors its routes, API shapes and Tailwind classes instead.

## Rules
- **Phase 1 baseline must stay comparable.** When changing a screen, keep the same route, data shapes and API calls. Log the change in `docs/IMPROVEMENTS.md`, with the issue # and a before/after screenshot.
- **Keep the live app's class names** unless the change is the point. The developer copies diffs from here.
- **No real personal data in the repo.** Captures of a real account go in `capture/_private/` (git-ignored). Unsanitized API responses go in `tools/capture/fixtures-raw/` (git-ignored).
- **Never write to the live API.** The capture tools block every non-GET request and answer it locally.

## Design rules (from Haseeb, Phase 2)
- **Geist only, no Geist Mono.** Small tags and labels use sentence case with normal letter spacing; no ALL-CAPS tracked tags. Brand wordmarks such as "BASE" keep their own casing. Applied platform-wide (see docs/handoff/00-foundations); keep it that way on every new screen.
- Every text field uses `LabelInput` from `src/components/ui/LabelInput.tsx` (floating label; `multiline` for textareas; optional fields say "(optional)" in the label). The 6-digit code boxes are the exception.
- Every main CTA uses `Button` / `ButtonLink` from `src/components/ui/Button.tsx`: `variant="primary"` on light surfaces, `"white"` on dark or image backgrounds; `size="md"` in dialog footers and inline cards.

## Useful commands
```bash
npm run dev                                   # prototype on :3120/siherdefi
npm run lint                                  # type-check
cd tools/capture && node proto.js <out-dir>   # screenshot the prototype in every captured state
node compare.js <out-dir> sheet.jpg A0 B0     # live vs prototype, side by side
node capture.js scenarios/0X-*.js             # re-capture the live app (needs login.js once for signed-in runs)
node ../html2jsx/convert.js <capture> main    # captured page → JSX
```

## Where things are
- **Screens:** `src/app/**/page.tsx`
- **Layouts:** `OnboardingShell` (sign-in/profile/wallet), `AppShell` + `SessionProvider` (signed-in pages)
- **Simulated API + stage presets:** `src/lib/mock/server.ts`
- **Prototype controls:** `src/components/demo/DemoPanel.tsx` (prototype-only, not part of the product)
