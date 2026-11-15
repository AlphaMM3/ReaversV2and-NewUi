# Academy Architecture Diagram — Concept Only

```mermaid
flowchart TD
 H[ACADEMY_MASTER.md<br/>Decision router] --> DS[201 Source Decisions + Amendments]
 DS --> TR[201-row Traceability]
 TR --> PRD[Product & Release Requirements]
 TR --> WF[Workflow Rules + State Machines]
 TR --> RB[Role + Scope Permissions]
 PRD --> UI[Role-based Minimal Portal]
 WF --> API[Modular Monolith Application]
 RB --> API
 UI --> API
 API --> DB[(Academy Authoritative Database)]
 API --> EV[Transactional Events / Task & Notification]
 AD[Legacy 1:1 Manager] -->|READ ONLY after approval| SY[Integration Adapter]
 PAY[Legacy Payment Portal] -->|VERIFIED DATA READ ONLY| SY
 SY --> API
 API --> QA[Decision-linked Automated Tests + Human Code Review]
 QA --> UAT[Department UAT + Central Launch Approval]
```

**Security note:** arrows are conceptual, not permission to access live systems. Authentication, field-level masking and data contract approval required before any adapter access.
