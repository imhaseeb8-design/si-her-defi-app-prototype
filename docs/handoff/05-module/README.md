# 05 · Module page

## Quiz rules: out of attempts → start over or skip
Screenshot: `quiz-out-of-attempts.jpg` (out of attempts, skip confirmation, skipped).
- **No more 24-hour wait.** After 3 failed attempts the quiz card says "Out of attempts · Not quite this time", with the last score, and offers:
  - **Start over** (Primary): a fresh set of 3 attempts right away, opening the quiz.
  - **Skip this quiz** (text CTA). It asks first: "If you skip, you won't earn the week N badge. It still counts as done for your certificate, and you can take the quiz again later." → **Skip without the badge** / **Keep trying**.
- **Skipped** card: "No week N badge… Want the badge after all? You can take it again any time." → **Take the quiz again** (fresh attempts).
- The result dialog after the 3rd failed attempt says: "That was your last attempt. Rewatch these parts, then you can start over or skip this quiz (without the week N badge) from the module page."
- **Certificate:** unlocks when every quiz is *done*: passed, or skipped. Badges only come from passed quizzes. The dashboard counts "N of 7 quizzes done"; skipped sessions show a grey "Skipped · no badge" tag, and the featured "This week" card moves on past them.
- **API (new):** `POST /quiz/:slug/restart` and `POST /quiz/:slug/skip`, both only after every attempt is used; `GET /quiz/:slug` returns `isSkipped`, and module `quiz.isSkipped`. `retryAvailableAt` is no longer used.

## Removed
- The "Next up: {session} — date · Add to calendar ↗" line under the video. Upcoming sessions live on the dashboard.

## Badge earned → certificate stays locked
Screenshot: `quiz-ticks-badge.jpg`.
- The "Badge earned" dialog and the module's Completed card only offer **View your certificate** when the certificate is unlocked (every session and quiz done). Otherwise the main button is **Back to dashboard** and the copy says "Your certificate unlocks once every session and its quiz are done." On the last quiz it says the certificate is unlocked and ready to mint.

## Badge earned dialog leads to the next step
Screenshot: `badge-dialog.png`.
- Copy: "All three correct, the week N badge is yours. It's on your dashboard now, and it counts toward your certificate." Pills: "✓ 3 of 3 correct" and "Counts toward your certificate" ("✓ Certificate unlocked" on the last quiz).
- **Primary:** the next action. The last quiz → **View your certificate**; the next session already open → **Start the next session**; otherwise → **Back to dashboard**. Never "View your certificate" while it's locked.
- **Secondary:** **Share on LinkedIn ↗** (full width, lilac).
- Under the buttons: "Next up · {next session} · opens Oct 15" (or "open now"), then a small **Back to module** text CTA.
- Quiz badges now use the design team's badge art (same as the dashboard).

## Completed card
`completed-card.png`: a green "✓ Completed" pill on its own line, then a bigger badge (56px) with "Badge earned" and the badge name, more space before the button.

## Video
- The "SI · Session recording" label over the top of the recording is removed (it's still the video's accessible name for screen readers).
