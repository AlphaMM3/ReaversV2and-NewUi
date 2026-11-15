# v0.1.0 Local Verification — 2026-10-31

The following commands were executed against the isolated local development source:

| Check | Command | Outcome |
|---|---|---|
| Baseline integrity | `python scripts/check_baseline.py` | PASS: original v1.7.1 hash, 201 IDs, AM-18/19 |
| Automated tests | `python -m pytest -q tests` | **10 passed** |
| Frontend JS syntax | `node --check app/static/app.js` | PASS |
| HTTP application smoke | `GET http://127.0.0.1:18777/health` during temporary uvicorn run | HTTP 200, version 0.1.0 |
| HTML response | `GET /` during temporary uvicorn run | HTTP 200 |

**IMPORTANT:** Tests do not validate all 201 decisions. No real database migration, all-role UAT, independent security audit, performance test or production launch was performed. The software is an MVP coding increment, not a production-ready Academy system.
