# Internal class report workspace — 2026-11-03

Implementation overlay; original Vault and its historical design statuses remain unchanged.

## Approved scope and impact

D-033/043/044 require Teacher draft/submission, assigned Batch Zimmadar review,
reasoned return, revision and retained history. AM-17 keeps first submission
compliance separate from review. D-162/191 require scoped access and audit.
The separate Guardian publication decision in `GUARDIAN-PROGRESS.md` still controls
family-visible summaries; approving an internal report does not publish it.

The maintained Reports list opens the full report before review. Teacher draft and
returned-report editors load saved text, current return reason and saved revision
events. Saving a returned draft retains its review context until resubmission.
Submitted/approved reports are read-only to the Teacher. End Class opens the
generic report editor after refreshing the class list. Course-specific templates
(D-032), substitute reassignment and approved-report reopening are not implemented
by this change.

## API and state contract

`GET /api/classes/:class_id/report` requires an authenticated staff session and
existing class/batch scope. A class without a report returns `report: null`, empty
history and `latest_history_id: 0`. Otherwise it returns the current report plus
chronological history of at most 200 latest events and `history_truncated`.
Bodies, event actors/times and current return reason are internal staff data.
Older event bodies remain in SQL; this screen does not page older history.
Return reasons for each historical review are not present in the existing revision
schema; do not infer them from current reason or claim full review history detail.

The report body and last history ID are selected in one SQL statement. The following
history read is bounded by that ID, so an intervening save cannot attach a newer
token to older displayed content. Existing revisions have no update/delete route.

Both existing POST endpoints accept optional `expected_history_id`:

- `/api/classes/:class_id/report`: 0 for creation, or the displayed latest event ID.
- `/api/reports/:report_id/review`: the displayed latest event ID.

The new report workspace always sends this token. State/ownership locks and CSRF
remain server-side. Stale tokens return 409 with instructions to close/reopen.
Save locks the class then the existing report; review locks the report and performs
nonlocking class/batch authorization reads. Latest history checks use locking reads.
This preserves serialization on the current MySQL/MariaDB transaction model.
Old API callers may omit the token for compatibility: their draft saves do not
receive optimistic concurrency protection. Making it mandatory is a separate API
compatibility decision. Existing submitted/approved overwrite guards still apply.

No schema migration, new deadline, publication policy, external message delivery or
legacy integration is introduced. First submission time, state transitions,
revision events and existing audit writes remain transactional.

## RBAC acceptance matrix

| Actor | Read internal report/history | Save/submit | Approve/return |
|---|---|---|---|
| Central admin | Existing global staff scope | Denied | Denied |
| Branch admin | Own branch only | Denied | Denied |
| Teacher | Assigned batch scope and own authored report | Assigned class Teacher; own report; draft/returned only | Denied |
| Zimmadar | Assigned batch only | Denied | Assigned Batch Zimmadar; submitted only; no self-review |
| Guardian primary/secondary | Denied, including direct URL | Denied | Denied |
| Unauthenticated/inactive/expired session | Denied | Denied | Denied |

This is the implemented single-role/single-branch model, not the full proposed
department/supervisor/multi-role model. Actual substitute-versus-regular assignment
read scope inherits `classScope`/`batchScope` limitations; no duty transfer is inferred.

## UI and failure behavior

Plain report/history/reason text is HTML-escaped. Async report responses are
discarded after account/navigation changes or a newer report-opening request.
Submit callbacks recheck account/view identity. Modal duplicate submission is
disabled while pending; Escape, focus return and keyboard containment are included.
The existing shell/brand remains. The report's evidence (body, state, first
submission and revision events) drives the dialog; no invented performance totals.

UI direction: Achromatic ledger, seed 211845476, used for the new report content's
plain evidence-first arrangement; existing brand palette/type/shell retained.
Question: what did the Teacher submit and what changed before this review?
Signature: class-linked chronological revision events beside the saved teaching
summary, first submission and current return reason. Dialog and sidebar text
margins/contrast were tightened. Style lint keeps the existing shell's eyebrow
and a small number of date/placeholder dashes; these are existing navigation and
missing-value conventions. Responsive inspector allowances are limited to a real
floating dialog's shadow, intentional coverage of the background, and its h2
heading while the background screen h1 is covered. This is not an allowance for
missing page headings or floating ordinary cards.

Oversized JSON now returns 413 with a generic 32 KB limit message. Security/cache
headers run before JSON parsing, so rejected request bodies receive them too.

## Verification and release gates

Local evidence on 2026-11-03:

- 22 Node unit/UI tests, including 220 differential policy fixtures: PASS.
- 24 SQL/HTTP integration tests on a new disposable local MariaDB 11.4.5 database:
  PASS, including the final return-reason retention assertion and same-branch
  unassigned Zimmadar denial.
- Unchanged migration 001 upgraded through 003, migrations repeated safely: PASS.
- Original Python baseline: 16 tests PASS (one dependency deprecation warning).
- Preserved baseline/Vault: 87 file hashes PASS.
- Browser: Teacher draft save/reopen, submitted read-only, Zimmadar reasoned return,
  Teacher revised draft/reopen with reason retained, resubmit and approval: PASS.
- Browser screenshots at 1440/768/390: no page/dialog horizontal overflow; no JS
  exceptions. Only local synthetic fixture accounts/data were used.

MySQL 8 CI, final branch CI, PR merge and live staging deployment are separate
evidence gates; local checks do not establish them. Independent architecture,
security/department UAT and D-201 production approval remain pending.

## Rollback

Code-only release: deploy the prior known-good staging commit via the existing
Git/Hostinger path. No database rollback is required or authorized by this change.
Keep all new report revisions/audit events; never restore an old dump over new
records just to roll back UI code. Reconfirm the target, current build and encrypted
backup before deployment. Legacy Itqaan 1:1 and Payment Portal stay untouched.
