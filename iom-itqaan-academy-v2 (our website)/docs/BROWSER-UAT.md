# Staging browser UAT and targeted fixes

Target: `https://onlineacademymanagement.savarshops.com/` only.

## Reproduced on deployed commit de54749

- At a 390 x 844 viewport the document measured 1286px wide. The mobile
  navigation and grid intrinsic minimum expanded the entire page; controls and
  cards were off-screen.
- After switching authenticated accounts, the new role label appeared while the
  previous account's view remained until its request finished. Rapid navigation
  could also let an older response replace a newer view. Server-side scope checks
  remain authoritative, but stale browser content must be cleared immediately.
- Copy incorrectly described the hosted staging site as local v0.1.
- Report Return used native `prompt()`, which the in-app browser rejected as
  unsupported. It now opens a labelled, required reason form through the normal
  dialog component and retains the same CSRF-protected review API.

## Change and preservation

`frontend/` is the maintained staging UI, initially copied from `public/`.
The original `public/`, Python baseline, Vault and provenance hashes are unchanged;
all 87 imported files still pass the original verifier without exceptions.
Express now serves `frontend/`. Roll back the application commit to restore the
previous UI; no database migration or environment change is needed.

The existing palette, system font, objects and workflows are retained. This is a
functional repair, not a new design direction. The overview answers how many
learners/enrollments are in the account's scope; class and report views expose
the next permitted action. Changes constrain grid sizing, fold mobile navigation
behind a labelled Menu button, keep wide academic tables in their own scroll
frame, preserve a sticky identifier column, and size mobile controls for touch.

Account/view clearing invalidates pending renders; only the latest render may
replace content. Regression tests exercise out-of-order responses and clearing
an account while a response remains pending.

Source lint: no FAILs. Existing product-context eyebrow labels are retained for
orientation; em dashes denote missing data and table separators rather than prose
decoration. These four warnings are accepted for this scoped repair. The resting
login shadow and decorative gradient are removed. No new style was dealt.

## Browser execution evidence

SAMPLE Guardian login and enrollment view showed both group and one_to_one
enrollments in its linked family. A newly added learner record was observed;
no edits, exports, cleanup or migration were performed on that record.
The site must no longer be assumed to contain only the original SAMPLE fixtures.

SAMPLE Zimmadar scheduled a synthetic Individual class, then SAMPLE Teacher
started and ended that class through the browser. Attendance before held
verification was correctly rejected. Teacher submitted a report explicitly
labelled SAMPLE browser UAT, with no real learner assessment.

Remaining execution evidence (held verification, attendance after verification,
review and responsive checks after deployment) is recorded in the local UAT
handoff after it actually runs. This document does not pre-claim those results.

## Limits

Agent browser acceptance checks are not independent departmental UAT or production
approval. No SSO, legacy/payment changes, external notifications or production
data migration are included. Existing cosmetic conventions are retained to keep
this repair scoped; a full design-skill aesthetic audit is not claimed. Browser
inspection uses the existing authenticated IAB session rather than a separate
Chrome inspector which would not share this session.
