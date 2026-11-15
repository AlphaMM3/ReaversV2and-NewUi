# Guardian dashboard and separately published progress

## Explicit decision, 2026-11-01 Asia/Dhaka

User approved: “Zimmadar আলাদা learner-specific progress/homework summary লিখে Publish করবেন; internal report ও follow-up note গোপন থাকবে।” This resolves the publication contract only. Original Vault, all 201 decisions, prior amendments and import provenance remain unchanged.

Related authority: D-007, D-010, D-059, D-064/066, D-083, D-090 (note privacy), D-148, D-170/172 and AM-19. Primary/Secondary keep distinct existing sessions and the same own-linked-child academic read boundary. Guardian management, account linking and legacy credential migration are not introduced.

## Behavior and privacy

Guardian overview groups linked children, group/1:1 enrollments, monthly attendance and published progress in one view. Verified held-class history distinguishes Unrecorded from Absent. No fabricated exam scores, homework completion or approved-leave records are shown; those sources do not exist yet. Month and learner filters narrow already scoped data. Tables/history/publication lists state their bounds.

Only the currently assigned batch Zimmadar can publish a new learner/enrollment-specific title, progress summary and optional homework summary. Publishing is an explicit form submit, not a side effect of internal report approval. A publication is an append-only snapshot; there is no edit/delete/automatic publication route. Corrections can be issued as a clearly titled new publication. No publication SLA or notification delivery is inferred.

GET /api/progress returns an explicit public-field projection only. Linked guardians see their family's learners, assigned Teacher/Zimmadar see their batches, branch admins see their branch and central admins see all. Internal report bodies/review reasons/follow-up notes are never selected or copied. GET /api/reports retains its existing guardian-empty behavior. Query filters do not expand scope. POST /api/progress requires Zimmadar role, current assignment, CSRF, input bounds, a transaction and an audit event. A publisher/request UUID prevents duplicate publish retries; changing a used request's payload returns 409.

## Schema, migration and rollback

Additive 003 creates published_progress with enforced enrollment/publisher foreign keys and a unique publisher/request key; 001 and 002 are immutable. No existing academic row is rewritten. CLI migrate applies it explicitly with a schema lock and checksum ledger; startup never runs DDL. Partial/unrecorded table state requires review. Existing records and a protected encrypted backup must be verified before a staging migration. Roll back application code independently and retain the new table and audit evidence; never drop publications as a rollback shortcut.

Tests must cover both Guardian roles, multiple linked children, same-batch unrelated learners, unlinked guardian, group/1:1, cross-branch and wrong-role writes, missing CSRF, concurrent/repeated requests, input escaping, internal-body privacy, attendance eligibility and repeat migration with existing rows retained. Real department UAT and production/D-201 approval remain separate.

Existing UI palette/type/shell are retained. Main Guardian question: “How are my children doing across their enrollments?” Identity comes from linked learner names, course/mode and enrollment-specific published updates, not decorative charts. Existing app-screen conventions are used; source lint and authenticated browser inspection at desktop/tablet/phone are required.
