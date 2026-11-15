# OTHER AI — START HERE

This is an independent IOM Academy development track, prepared 2026-11-04.
Open ONLY this folder. Do not inspect or mutate sibling Codex/private hosting folders.

Read AGENTS.md, DEVELOPMENT-PLAN-BN.md, docs/ATTENDANCE-LOCAL-POLICY.md,
docs/V1-ACADEMIC-SCOPE.md, vault/ACADEMY_MASTER.md, its authority references and
approved amendments. Preserve imported evidence. Existing documentation can be
historical; verify current code and report VERIFIED/PARTIAL/PLANNED/UNKNOWN.

Goal: a simple academy for batch, single and native 1:1 courses. Continue this
same Express/TypeScript/SQL/plain frontend architecture. No rewrite, enterprise
framework or guessed business rules. Implement V1 acceptance before V2 automation.

First task: read-only baseline review, npm ci/build/test/baseline checks and a gap
report. Then work on ONE bounded milestone. Report changed files, tests actually
run, failures, limitations and pending policy. Never turn a review into deployment.

Local app: http://127.0.0.1:3020, isolated MariaDB port 33139,
database academy_test_antigravity_demo_v1. START-LOCAL.cmd creates synthetic
data and local private credentials on first run. STOP-LOCAL.cmd stops only this
instance. Requires installed Node/Python/MariaDB; set ACADEMY_MARIADB_BIN if needed.
Dependencies/runtime/database are deliberately absent from this clean source.
Do not use port 3010/33129 or Codex's database. Do not copy private local/ folders.

No remote is configured. Create feature branches off this independent baseline.
Do not attach the existing production/staging deployment remote without the user's
explicit decision. No push, merge, hosting/database migration or external messaging
is authorized by this handoff. Auth/RBAC/migration/API changes require careful
integrator review. Never use real student/Guardian records for tests.

Important: Part 4 source exists but is partial. Management/leave-edge and commercial
package rules are gated. Do not claim full tests or full Blueprint completion.
