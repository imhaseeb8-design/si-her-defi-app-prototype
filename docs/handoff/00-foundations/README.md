# 00 · Foundations: type and buttons (platform-wide)

These apply to every screen, not just redesigned ones. Screenshots: `after-screens.jpg` (type + buttons), `after-fields.jpg` (fields, autofill, errors), `after-scroll.jpg` (layout).

## Type
- **Geist only.** Geist Mono is removed. Numbers that should line up (codes, addresses, timestamps, counters) use Geist with `font-variant-numeric: tabular-nums`.
- **No bold anywhere.** The heaviest weight is Medium (500). Everything that was Semibold (600), Bold (700), Extrabold or Black is now Medium, including headings, buttons (Figma components too), tags and the certificate artwork. Use size and colour for hierarchy, not weight.
- **No ALL-CAPS tags.** Small tags, section labels and eyebrow text use sentence case with normal letter spacing. Tags that were 9–10.5px caps move up to 11–11.5px, so they keep their visual weight without capitals.
  - "START HERE" → "Start here"
  - "UPCOMING SESSIONS (6)" → "Upcoming sessions (6)"
  - "WEEK 01 QUIZ · SI" → "Week 01 quiz · SI"
  - "POWERED BY" → "Powered by"
- **Content from the CMS** that arrives in capitals (e.g. "GET STARTED · SI HER DEFI", "YOUR STARTING POINT") is shown in sentence case with brand names kept: "Get started · Si Her DeFi". The prototype uses `tagCase()` in `src/lib/format.ts`. In the real app either apply the same transform or fix the CMS copy.
- **Kept as is:** brand wordmarks ("BASE" in the Powered-by pill, "SI HER DAO", "SI<3>") and the 2–3 letter company monograms ("SI", "FIN").

## Text fields
Every text field is the floating-label field (Bencho "Label input", MIT): `src/components/ui/LabelInput.tsx`, CSS "Label input" in `globals.css`.
- The label sits in the field and lifts into the top border on focus or once there's a value. The outline turns brand purple on focus and red on error. Height 48, radius 12.
- **Optional fields** say so in the label: "Professional role (optional)".
- **Hints** (the old placeholders, e.g. "Engineer, Writer, etc.") show only once you're in an empty field.
- **Multi-line** (`multiline`): Bio, onboarding answers. The label rests on the first line and lifts the same way; the limit sits under the field as "Max 300 characters" (the field stops at the limit).
- **"From your application"** sits inside the field on the right. It hides while you type and disappears once you change the pre-filled value.
- **Errors** are the app's own message under the field, never the browser's "Please fill out this field" bubble (IMPROVEMENTS #4).
- **Browser autofill:** the outline and label are drawn above the input (`z-index`), and the autofill tint is filled with white, so a saved email can't hide them.
- **Not changed:** the 6-digit code boxes.
- Used on: sign in (email), profile (name, role, organization, social link, bio), onboarding questions (answer).

## Flow
- The separate **"Email verified" screen is removed.** After the 6-digit code, new applicants go straight to Create your profile; returning ones go wherever they left off. `/verified` redirects to `/profile` (`next.config.ts`). The "Email verified ✓" chip stays in the profile header.

## Layout (onboarding steps)
- **Desktop:** the code, profile and wallet steps fit the window exactly. The form column scrolls on its own and the artwork panel stays fixed, so there's never white space below either (`OnboardingShell`). Below 1024px it's one normal scrolling page.
- **Sign in (new layout):** the steps and card sit in the middle of the space under the nav at every size, and the artwork rail stays in place while the page scrolls.

## Arrows
- No thin text arrows (← → ↗). Every inline arrow is the Figma arrow icon (the one in the buttons) via `<Arrow dir="left" | "right" | "up-right" />` (`src/components/ui/Arrow.tsx`, CSS `.inline-arrow`). Back links point left; links that open a new tab point up-right. It takes the text colour.
- Partner link labels from the CMS ("Visit partner site ↗") have the character stripped and the icon added.

## Wallets
- Rainbow is removed from the wallet list. MetaMask, Coinbase Wallet, 1inch and WalletConnect remain.

## Buttons
Two components from Figma (section "Button components", `1027:759`):

| Component | Figma | Use on | Code |
|---|---|---|---|
| Button · Primary | `1025:32` | light surfaces; also the main action on dark cards | `<Button>` / `<ButtonLink>` |
| Button · White | `1027:731` | dark or image backgrounds | `variant="white"` |

- **Sizes:** `lg` is the Figma button (48px, full width). `md` is a compact 40px, content-width version of the same component (radius 12, 14px label), used in dialog footers and inline cards. It isn't in Figma yet; add it there if you want it designed.
- **States:** Default, Hover (pointer devices only), Pressed, Focus (keyboard), Disabled and Loading. All of them are plain CSS in `src/app/globals.css` (`.btn-primary`, `.btn-white`, `.btn-md`).
- **Arrow:** the arrow is the Figma icon, drawn with a CSS mask so it takes the label colour. The "→" characters were removed from labels.

### Where each CTA now uses a component
| Screen | CTA | Component |
|---|---|---|
| Sign in | Send my code | Primary lg |
| Code | Verify email (loading "Verifying…") | Primary lg, no arrow |
| Email verified | Continue | Primary lg |
| Profile | Save & continue / Save changes (loading "Saving profile") | Primary lg |
| Wallet | Go to my dashboard (Disabled while signing) | Primary lg |
| Dashboard · Start here card | Start here / Continue | **White** md |
| Dashboard · this week card | Start session | Primary md |
| Dashboard · certificate row | View certificate | Primary md |
| Dashboard · ready to mint | Mint on Base | **White** md |
| Add to calendar dialog | Add to Google Calendar / … / Download .ics | Primary lg, no arrow |
| Onboarding Part 1 | Continue to questions / Resume questions / Back to dashboard | Primary lg |
| Onboarding questions | Next / Submit | Primary md |
| Onboarding done | Back to dashboard | Primary lg |
| Module | Start quiz / Try again / Finish Part 1 to unlock / View your certificate | Primary lg |
| Module (live) | Join live session | **White** md |
| Quiz | Next question · Try again · Got it | Primary md |
| Quiz passed | View your certificate | Primary lg |
| Certificate | Go to Week 1 · Add to LinkedIn profile ↗ | Primary lg |
| Certificate | Mint on Base — coming soon | Primary lg, **Disabled** |
| Settings | Edit profile · Connect wallet | Primary md |

Secondary and outline actions stay as they were, since no secondary component exists yet: Add to calendar (outline), Open, Visit partner site, Share on LinkedIn, Download image, Copy verification link, View public page, View on BaseScan, Back, Save & exit, Disconnect.

## Sidebar item
Figma: component set **Sidebar item** `1040:37` (Post-UX-Fixes, next to the Button components), icons `Icon / Home` `1042:4`, `Icon / Certificate` `1042:9`, `Icon / Settings` `1042:13`, full example `Sidebar nav · example` `1042:29`. Code: `src/components/ui/NavItem.tsx`, CSS "Sidebar item" in `globals.css`. Screenshot: `after-sidebar-item.jpg`.

| State | Look |
|---|---|
| Default | no fill, `#5F5F7A` icon + label |
| Hover | `#F3E8FC` at 60%, ink `#4A1D82` (pointer devices only) |
| Selected | Primary button fill `#7733B4` with its inner glow, white icon + label |
| Focus | the button's focus ring (2px white + 4px `#B98BE8`) |
| Locked | Disabled-button ink `#A894C8`, lock on the right, not clickable |

- 40px tall, radius 12, 12px side padding, 11px gap, Geist Medium 13.5, 18px icons.
- Properties: **Label** (text), **Icon** (swap: Home / Certificate / Settings), **Show lock** (boolean, on by default in Locked).
- Icons are the Figma ones: Dashboard = `home-09` house, Certificate = document with a ribbon, Settings = gear (18px, `after-sidebar-icons.png`). The gear also shows in the account menu.

## Text CTAs (links styled as actions)
- "Back to dashboard", "Back to profile", Review, Edit profile, Connect, "Take the quiz", Back in the questions modal and similar: **no underline on hover**. A light lilac shape (`#F3EBFF`, radius 8, 3px × 8px padding) appears behind the text instead, a shade darker while pressed, with the button focus ring on keyboard focus (`after-text-cta-hover.png`).
- One class, `.link-cta` in `globals.css`; negative side margins keep the text aligned where it was.
- Links inside a sentence (e.g. "Verify at certifications…" on the certificate) stay plain links.

## Tick icon
- Every check mark uses the Figma tick (`check` `1045:1441`): `<Check />` in `src/components/ui/Check.tsx` (24px viewBox, takes the text colour, size via class). No more "✓" text characters or other tick SVGs: quiz answers and score, onboarding steps and follows, "Added to calendar", "Link copied", "Copied", the verified credential, the email chip, the wallet-connected icon, the completion modal.

## Browser tab
- **Title:** "Si Her DeFi Certification" on every page (was "Si Her DeFi"). Set in `src/app/layout.tsx` metadata.
- **Favicon:** the Si Her DeFi crystal (white line-art octahedron) on the brand gradient `#5E3295 → #B76FDE`, rounded tile (`favicon-preview.png`). Files: `public/icon.svg` (main), `public/icon-32.png` (fallback), `public/apple-icon.png` (180px, home-screen icon). Swap in the official Roamoji artwork here if it differs.

## No week labels on modules
- Modules are named by their title only; "Week 1" / "Week 01" labels are gone everywhere: the "This week" card tag ("Session recording"), "Next badge: Si Her Collective Capital", the welcome line ("Watch “Si Her Collective Capital” and pass its quiz…"), badge tooltips, the quiz tag ("Si Her Collective Capital quiz"), the badge dialog ("the Collective Capital Badge is yours"), the module page ("Earn this module's badge", "No badge for this module"), the certificate page ("Pass the … quiz to unlock it", "Go to …") and the certificate artwork.
- The `week` field is still used for ordering.
