# ২০১ সিদ্ধান্তের mapping — Review Draft v1.3

এটি planning deliverable। ২০১টি মূল সিদ্ধান্ত এবং অনুমোদিত amendments অপরিবর্তিত। Mapping মানে workflow,screen,role/scope,logical entity এবং acceptance scenario-এর প্রস্তাবিত যোগসূত্র; approved technical design,implementation বা passed test নয়।

## কোথা থেকে পড়বেন
1. `registries/201_DECISION_TRACEABILITY.csv`: প্রতিটি মূল সিদ্ধান্তের পাশে draft mapping, dependencies এবং gap।
2. `catalogs/WORKFLOW_MAPPING.md`: বিদ্যমান WF-01..18 অক্ষত রেখে প্রস্তাবিত WF-19..37 families এবং ২০১টি leaf specification।
3. `catalogs/SCREEN_ENTITY_INDEX.md`: screen/entity ID কোন সিদ্ধান্ত থেকে এসেছে। Screen IDs UI mockup নয়; entity names actual SQL table নয়।
4. `registries/201_ACCEPTANCE_SCENARIOS.csv`: প্রতিটি সিদ্ধান্তের candidate expected outcome; সবগুলো NOT_RUN।
5. `registries/201_IMPACT_MAPPING.csv`: UI/workflow/state/RBAC/schema/events/reports/tests design impact।
6. `MAPPING_REVIEW_GAPS.md`: পুরোনো skeleton-এর অসামঞ্জস্য, অমীমাংসিত dependency এবং design priority।

## কী সম্পূর্ণ হয়েছে, কী হয়নি
- 201/201 সিদ্ধান্তের প্রাথমিক logical linkage সম্পূর্ণ। 4টি historical/current-practice observation CONTEXT_MAPPED_DRAFT; বাকি 197টি DRAFT_MAPPED_NOT_APPROVED।
- Workflow পরিবারের 37টি allocation প্রস্তাব; first 18 retain previous meanings. 201 leaf IDs are traceability units,not a claim of exactly201 implemented business processes.
- No physical schema,column types,API contract,final authorization matrix,full state transition definition or release scope approval added.
- 201 candidate scenarios cover decision-level expectations,not exhaustive branch/negative/security tests. They are specifications,not executed tests.
- G0 remains incomplete pending independent review and critical conflict resolution;G1/G2/implementation/release status not advanced.
- All source_status,evidence_status,source text and approved_amendment_id cells retained. Prior UNMAPPED mapping_status changed only to explicitly draft mapping;no policy approval changed.
- Existing unanswered questions and all12 proposals retain their prior statuses. New review observations are not user-approved decisions.

## Authority and safe reading
Source -> approved amendment -> open unresolved questions -> draft mapping. Repeated candidate terms never override this order. Actors without explicit action authority are labelled pending;this mapping grants no permission. Source-text acceptance examples are compressed summaries;read the full verbatim source and linked decisions before coding.

## Rollback
v1.2 remains untouched in its own folder/ZIP. Discard v1.3 and return to v1.2 for documentation rollback. No application/database/live change was performed.
