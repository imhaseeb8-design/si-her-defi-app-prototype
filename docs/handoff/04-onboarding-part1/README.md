# 04 · Onboarding Part 1 (Welcome to Si Her DeFi)

Screenshots: `state-video-not-watched.png`, `state-video-watched.png`, `state-mobile.png`, `questions-modal.png`.

- The "● Get started · Si Her DeFi" tag above the title is removed.
- **Under the video, a description box:** title "A welcome from Kara Howard", a short description and "2 minutes" (prototype copy; add `video.title` / `video.description` to the CMS). On the right, a **Watched %** progress bar with a tick at 80% and "Watch 80% to unlock the next steps"; once reached it becomes a green "✓ Watched" label. There is no button to mark it watched.
- **Note under the description box:** "This is a personal introduction, not a quiz…" (moved out of the task panel, `taskNote` from the CMS).
- **"Connect with SI<3>" moves into the task panel** as part of step 2: one row per account (X, LinkedIn) with a Follow ↗ button that turns into "Followed ✓". The separate section under the video is gone.
- "Continue to questions" stays Disabled until both are followed; the hint now reads "Follow both accounts in step 2 to continue."

## Watching is required (80%)
- `src/components/onboarding/IntroVideo.tsx` plays the video through the YouTube IFrame API and counts the seconds that actually play (skipping ahead doesn't count). At 80% it saves `videoWatched: true`.
- Until then, the step 2 Follow buttons are greyed out (not clickable) and "Continue to questions" is Disabled with "Watch 80% of Kara's intro to unlock the next steps." Then the steps unlock in order: follow both accounts, then the questions.
- Backend: `videoWatched` should only be accepted once the client reports 80%; the real API currently accepts it from any draft save.
- Note: the YouTube video is about 37 seconds long, but the CMS says 2 minutes.

## Questions modal
- **Close (X)** is a round button on the card's top-right corner (no shadow). It saves your answers so far and closes; Escape does the same. The "Save & exit" link between Back and Next is gone.
