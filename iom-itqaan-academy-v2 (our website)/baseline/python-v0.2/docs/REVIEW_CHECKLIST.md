# Independent engineer review checklist

- [ ] Compare every coded rule to corresponding decision and latest valid AM amendment in baseline ZIP.
- [ ] Confirm original 201/source/12 proposed items unchanged, and AM-18/AM-19 accurately scoped.
- [ ] Threat-model Guardian/child data (CSRF, IDOR, mass assignment, leaks, session lifetime, password reset, rate limits).
- [ ] Test branch admin attempting cross-branch read/write and privilege escalation.
- [ ] Test teacher and Zimmadar scoping, dual-role review, early and late correction scenarios.
- [ ] Test date and timezone boundaries: 15min, 23:00, midnight, noon, 7-calendar-day cutoff, DST if later approved.
- [ ] Verify source-of-truth, unique constraints, append-only audit expectations, and simultaneous write behavior.
- [ ] Add managed schema migrations; backup/restore and failed migration rollback tests.
- [ ] Convert prototype authentication to hardened production authentication before any real user access.
- [ ] Validate Hosting environment, app server, HTTPS, secure cookies, database choice and secret management.
- [ ] Confirm accepted UAT results and central launch sign-off under D-180/D-201. **No launch before approval.**
