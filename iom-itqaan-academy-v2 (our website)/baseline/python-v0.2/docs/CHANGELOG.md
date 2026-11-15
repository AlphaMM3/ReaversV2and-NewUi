# Academy Core development changelog

## 0.1.0 — 2026-10-31

- Initial isolated Academy application scaffold with FastAPI, SQLite local DB, responsive web UI, authenticated sessions, CSRF, role and data scope controls.
- Family/Student, Department/Course/Batch, Enrollment (group and 1:1 academic), Class Start/End, held confirmation, Teacher Attendance, Report Draft/Submit, Zimmadar Review, audit events.
- 10 automated tests passing at initial increment. Reference v1.7.1 ZIP copied without modification.
- No legacy edits, finance changes, live deployment, integration credentials, or migration performed.
- See `docs/KNOWN_GAPS.md` for deliberately unimplemented domains and pending edge cases.

## 0.2.0 — 2026-10-31 (local development)

- Added additive `report_alert_events` table (no change to existing tables or data).
- Background worker checks every 60 seconds and logs **in-app event records only** for approved 12:05/14:00/16:00/18:00 noon-deadline stages. Every event is idempotent per class/stage/due; checks still-outstanding first submission, not approval status.
- No late report alerts for ordinary 23:59 deadline (reminder policy pending), no historical backfill at application restart, no Telegram/email/SMS claims.
- Supervisor role mapping is not yet in prototype; its event has `unassigned` status, NOT delivered.
- Added role/branch-scoped report monitor and per-enrollment read-only monthly attendance summary.
- Verified Held Class denominator, missing attendance explicit, initial 75% informational threshold with >=3 complete class records; **no automated low-attendance follow-up** or guardian alerts.
- Retained original 201 decisions and v1.7.1 workstream archive unchanged.
- New tests exercise report stage idempotency, suppression after submission, privacy and attendance counting. Existing tests retained.
