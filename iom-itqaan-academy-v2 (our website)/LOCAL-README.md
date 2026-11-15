# Academy local preview

Double-click **START-LOCAL.cmd**. Open http://127.0.0.1:3020.

Login details are in **local/LOCAL-LOGIN.txt** (private, ignored by Git).
Double-click **STOP-LOCAL.cmd** to stop only this preview. Data is preserved.

## Files

- `src/`: maintained TypeScript backend.
- `frontend/`: maintained browser UI.
- `migrations/`: explicit database migrations, including unfinished Part 4 schema 006.
- `tools/local-preview.py`, `tools/local-runtime.mjs`: local start, setup and stop.
- `local/mysql/`: isolated synthetic demo database (port 33139).
- `local/config.json`: private local credentials; do not share.
- `local/server.log`, `local/database.log`: troubleshooting logs.
- `dist/`, `node_modules/`: generated build and installed dependencies.

Requires Node.js 24, Python 3 and MariaDB. The launcher uses the existing MariaDB
11.4.5 installation on this computer. On another computer set
`ACADEMY_MARIADB_BIN` to the MariaDB `bin` folder. This is source plus a local
launcher, not a self-contained portable installer.

The app and database bind to 127.0.0.1 only. Hosting, staging, legacy 1:1 and
Payment Portal databases are not connected. All demo records are synthetic.

## Current limits

Part 4 is a partial local implementation, not a completed release. Management
actions, overlap/retrospective leave policy and Guardian urgent Telegram policy
remain gated. No Telegram credentials, provider sending or background worker
service is enabled. Follow-up recalculation runs on local start and the existing
authorized manual workflow action. Full Part 4 SQL/browser/UAT coverage remains
pending. Existing unit tests and a local preview smoke check do not prove full
business correctness or production readiness.

First setup explicitly runs migrations on the new dedicated demo database.
Normal server startup does not run DDL. Do not replace this local database with
a staging or production dump. Keep `local/`, `.env`, dumps and credentials out of
source archives and Git.
