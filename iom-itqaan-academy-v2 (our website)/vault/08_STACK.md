# STACK — Technology Selection Record (UNSELECTED)

**Do not invent a final framework/version.** Check deployed hosting capabilities and developer team's actual skills first.

## Starting architecture recommendation (not approval)
- **Modular monolith** with explicit module/service boundaries; avoid premature microservices.
- Responsive accessible web/PWA with Bangla/English locale support D-144..145.
- Relational DB and documented migrations, transaction integrity and audit.
- Reliable event/outbox+worker for notifications/escalation.
- Adapter boundary for read-only legacy 1:1 / payment integrations.

## Decision table [PENDING]
| Concern | Selected technology | Exact pinned version | Evidence | Approved by |
|---|---|---|---|---|
| Frontend | TBD | TBD | TBD | TBD |
| Backend | TBD | TBD | TBD | TBD |
| DB engine | TBD | TBD | TBD | TBD |
| Hosting | Existing platform if suitable D-178 | TBD | Audit | TBD |
| Authentication | TBD | TBD | Security review | TBD |
| CI / Testing | TBD | TBD | Reviewer sign-off | TBD |
| Queue/notifications | TBD | TBD | Reliability test | TBD |

## Anti-drift
Pin dependencies, record upgrade decisions, separate secrets from code, use environment files/templates without credentials, test backup+rollback and migrations in staging.

## AM-18 native1:1 direction overlay (v1.7)
Historical as-is/read-only-only future target is superseded for1:1 redesign. See `design/integrated_1to1/PLAN.md`. Reference/legacy access remains controlled;payment portal stays external;stack is still UNSELECTED and gate statuses are not advanced. No live migration/deployment authorized by this planning deliverable.
