# Observed source fields and candidate read projection

All targets below are logical Academy proposals,not existing tables/endpoints. Source instance/database namespace must be established before treating legacy integer keys as globally stable identities. Full source field list is schema.sql:1–5 in the supplied archive;line refs are one CREATE statement each.

| Observed source | Possible Academy read projection | Evidence limit / forbidden inference |
|---|---|---|
| students.id | Explicit legacy student identity map | Not enrollment ID;shared name/contact never automatic person merge |
| students.name | Scoped display label | Not identity key;do not include in shared evidence report |
| guardian_name/guardian_contact | Restricted relationship-review input only if needed | Not verified Guardian login/membership;not general dashboard export |
| teacher_name | Unverified display text | Not stable Teacher ID,assignment history or account ownership |
| monthly_minutes/monthly_fee | Current supplied package attributes | No effective history,carry-over,pro-rata or verified finance confirmation |
| students.active | Source active flag | Not equivalent to full Academy per-course lifecycle Active/OnHold/Withdrawn/Completed/Inactive |
| schedules.id/student_id/weekday/start_time/duration_minutes | Current recurring schedule projection | No historical dates,cancel/reschedule revision or guaranteed held session |
| schedules.meeting_url/platform | Authorized link-out view if permitted | Sensitive meeting links;not attendance/provider integration evidence |
| sessions.id/student_id/session_date/minutes | Manual class-log projection with provenance | Minutes are entered manually,not proven by API/timer;missing row not absence |
| sessions.started_at/ended_at | Optional time-of-day evidence | No separate end-date;cross-midnight/duration cannot be invented |
| sessions.source/created_by/created_at | Source provenance metadata | source enum api is not an implemented API;creator not necessarily actual teaching assignee |
| sessions.notes | Restricted source note | Not structured approved report;not automatically Guardian-visible or a private-follow-up record |
| payments.id/student_id/billing_month/amount/paid_on/method/reference | Local manual-ledger observation only | No verified confirmation status or gateway source;separate payment portal authority D-015 |
| users.id/name/email/role | Identity verification input if authorized | Admin/teacher enum not Academy RBAC;no Guardian role in this copy |
| users.password_hash | NONE | Do not export/import as Academy authentication;no credential sharing/SSO inferred |

## Suggested source-of-truth boundary

Legacy owns original1:1 schedule/session/package records. Separate payment portal owns collection/verification. Academy owns its approved academic exam/homework/progress and explicit integration identity mappings/projections. No bidirectional change path proposed here. A corrected read projection never rewrites legacy facts.

## Incremental sync limitation

IntegerID and created_at alone cannot detect edited students or deleted schedules. Full snapshot reconciliation or an existing change feed is required to evaluate reliable sync;neither approach is approved as final contract. Tombstone/deletion meaning and historical retention need evidence. Do not add legacy triggers,columns,webhooks or API code under inspection permission.

## Q5 safe-link constraint

Link from legacy Guardian Portal to Academy Progress is approved direction AM-10. This copy has no Guardian Portal. Inspect existing configurable navigation and Academy child authorization before choosing any URL/token/redirect/session design. Do not assume iframe support (index.php sets X-Frame-Options:DENY),shared cookies,SSO or permission to edit legacy code. If no existing configurable link point exists,record exact minimal change proposal for separate authorized implementation;Q5 does not imply a broad legacy rewrite.
