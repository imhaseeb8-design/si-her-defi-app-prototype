# 03 · Settings

Screenshot: `after-profile-edit.jpg` (loaded, edited, saved, mobile).

## Edit your profile in place
- Every "Edit profile" link (dashboard profile card, the bio prompt, the sidebar account menu, the mobile drawer) now goes to **`/settings#profile`**, not the onboarding profile step.
- The Profile information card is the form: photo (Upload / Replace / Remove), then Your name, Professional role, Organization, Social link (two columns on desktop, one on mobile) and Bio, all with the standard floating-label field.
- **Save changes** (Primary md, no arrow) stays Disabled until something changes. **Cancel** appears once you've edited and puts the saved values back. After a save, "Profile saved" shows on the left and the sidebar, dashboard and certificate pick up the new details straight away.
- Name is required: an empty name shows the same message as onboarding under the field.
- The cohort ("Cohort 01 · Si Her DeFi") is read-only, shown as a small tag next to the heading.
- The onboarding step `/profile` is unchanged and still used during sign-up.

## Preferences
- **Email notifications** and **On-chain verification privacy** are both **on by default** for new accounts.

## Profile photo is not on the certificate
- Checked: the certificate (live app and prototype, all states) shows the member's **name**, badges and on-chain details, never the profile photo. The photo is only for the profile.
- Copy fixed to match:
  - Settings → Profile information subtitle: "Your name appears on your certificate. Members see your photo, role and bio on your profile." (was "This is how your credentials appear on your on-chain certificate.")
  - Photo upload hint (Settings and onboarding profile): "JPG, PNG or WebP · up to 5 MB" (dropped "· shown on your certificate").
