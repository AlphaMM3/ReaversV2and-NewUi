> **Organized Windows local package:** এই folder-টি `IOM_Academy_Local_Project_v0.1.1` এর অন্তর্ভুক্ত হলে, প্রোজেক্টের মূল folder থেকে `START_ACADEMY_WINDOWS.bat` চালাও; Browser URL **http://127.0.0.1:8090**। নিচের `8088` command-গুলো পুরোনো stand-alone source example, এই organized package-এর default নয়।

# IOM School Maktab — Academy Core v0.1

**Status:** Executable local development prototype. **Not production-approved.**

এটি শুধু ডকুমেন্ট নয়—Login, Dashboard, CRUD, Class Session, Attendance ও Report Approval-সহ চলমান অ্যাপ। পূর্বের Live One-to-One Class Manager, existing payment system এবং Hosting অপরিবর্তিত আছে।

## Run locally (Windows / macOS / Linux)

Python 3.11+ প্রয়োজন। কমান্ডগুলো **এই ZIP extract করার পর `academy_core_v0_1` folder-এর ভিতর** চালাবে:

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

python -m pip install -r requirements.txt
```

প্রথম Administrator তৈরি করো (উদাহরণ ইমেইল বদলে নিজেরটি দাও; Password অন্তত ১২ অক্ষর):

```powershell
# Windows PowerShell
$env:ACADEMY_ADMIN_PASSWORD="YourOwnStrongPassword123!"
python scripts/bootstrap_admin.py admin@example.com
python -m uvicorn app.main:app --host 127.0.0.1 --port 8088
```

```bash
# macOS/Linux
export ACADEMY_ADMIN_PASSWORD='YourOwnStrongPassword123!'
python scripts/bootstrap_admin.py admin@example.com
python -m uvicorn app.main:app --host 127.0.0.1 --port 8088
```

ব্রাউজারে **http://127.0.0.1:8088** খুলে Login করো। প্রথমে একটি Branch বানিয়ে User (Teacher, Zimmadar, Guardian), Family, Student, Department, Course, Batch, Enrollment এবং Class তৈরি করো।

- API documentation: http://127.0.0.1:8088/api/docs
- Health check: http://127.0.0.1:8088/health
- Local database: `local/academy.sqlite3` (auto-created, gitignored)

**প্রথম Admin ছাড়া Seed Demo Accounts নেই**; কোনো fixed public password নেই। Login Credentials কারও সঙ্গে শেয়ার করবে না। এখানে বাস্তব শিশু/Guardian-এর ব্যক্তিগত তথ্য ব্যবহার কোরো না—এটি Development Environment।

## What works now

- Password-hashed accounts; server-side session cookie; CSRF protected writes; role+branch scoped data access.
- Family/Student and linked primary Guardian; batch/group and native one-to-one enrollment **academic structure** (AM-18/19; no contract-minute posting).
- Department/Course/Batch/Session CRUD; actual class start/end assigned teacher only.
- Teacher attendance recording after Zimmadar-held verification; unique attendance by class+enrollment; 15-minute `Late` rule when join time supplied (D-55); 7-calendar-day correction guard (AM-16-C1).
- Teacher draft/submit class report; separate Zimmadar approval/return with reason and append-only revision event history; BD report deadline calculation (AM-04/07).
- Immutable-ish audit event append and Guardian family-scoped list access. **Not cryptographically tamper-proof.**
- API tests and responsive dashboard.

## Not implemented / important boundaries

- **D-19/56/57 Absence Follow-up engine, approved-leave pause/reset, monthly 75% alerts and all escalation queues**: not implemented yet; never infer that attendance CRUD means entire attendance policy is done.
- **D-35 / AM-08 12:05, 14:00, 16:00, 18:00 automated reminder delivery**: not implemented. Deadline computation only; no Telegram/email integration.
- **1:1 contracts/packages/minute deductions, payment confirmations, teacher payments, invoice generation**: not implemented; policies unresolved. Existing Payment Portal remains sole payment confirmation authority.
- **One Guardian login for batch and 1:1**: current local native records can be seen with one guardian identity, but legacy credentials/migration are NOT linked.
- Current UI does not cover adding a second Guardian, student leave forms, detailed report templates or published Guardian report content. For safety these are not inferred as implemented.
- Full RBAC approval matrix, account recovery, login throttling, advanced security, full migrations, PostgreSQL/MySQL production adapter, backup/restore, international timezone displays, Arabic course RTL, deployment and independent review not done.
- Backend currently uses Python FastAPI + SQLite as **prototype choices only**; final production stack requires hosting and engineering review.

## Test

```bash
python -m pytest -q tests
node --check app/static/app.js  # Optional: Node.js if installed
```

## Decision provenance / do not hallucinate

- `reference/Academy_Four_Workstreams_v1.7.1.zip` is the unmodified supplied baseline containing original 201 decisions and amendments up to AM-19.
- `docs/DECISION_TRACEABILITY.md` lists only the decisions **actually implemented** in this milestone.
- `docs/KNOWN_GAPS.md` records assumptions, deferrals and conflicts; an engineer must read it before changes.
- No original reference is edited, and **no live legacy code is included or modified**.

## Build workflow

Read `AGENTS.md` → baseline ZIP → traceability → relevant domain code → tests. Make small changes, add tests, review diff, protect Production by default. Never claim the 201 decisions are all implemented because the 201-row mapping exists.


## v0.2 features
- Staff-only report deadline monitor + in-app alert event logging for approved noon deadlines.
- Per-enrollment verified-held monthly attendance summary.
- No Telegram delivery, leave-aware warning automation or historic catch-up. See `docs/V0_2_RELEASE_NOTES_BN.md`.
