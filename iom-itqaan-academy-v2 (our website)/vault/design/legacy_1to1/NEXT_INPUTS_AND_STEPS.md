# পরবর্তী input ও কাজ — নির্দিষ্ট checklist

## প্রথমে প্রয়োজন:বর্তমানে ব্যবহৃত version-এর safe source/schema copy

একটি offline package-এ দিন/চিহ্নিত করুন:

1. Current1:1 relevant source files,version/release identifier এবং schema-only export (CREATE definitions,indexes,foreign keys;records প্রয়োজন নেই)। Current package এই5-file MVP-ই কি না তা confirm করার evidence।
2. Guardian login/session,child-access authorization,dashboard এবং navigation/link configuration-এর source/schema। নিজস্ব child check-এর dependency files থাকলে সেগুলোও।
3. Teacher assignment,package/contract history,routine/reschedule/cancel/makeup,timer/report approval/revision-এর current source/schema,যদি থাকে। না থাকলে “এই version-এ নেই” হিসেবে চিহ্নিত করুন।
4. Existing export/API documentation/configurable export format,যদি থাকে। Database password,production config,session token,private key,API secret বা password_hash records দেবেন না।
5. Separate payment portal থেকে শুধু verified-status read contract/schema এবং anonymized field example,যখন সেই interface review করবেন;live payment records/password নয়।

Source copy থেকে secret configuration বাদ দিয়ে placeholder template রাখুন;archive যেন public website folder-এ publish না হয়। এটি input minimization,নতুন account/access approval চাওয়া নয়। Full student/guardian dump প্রথম ধাপের জন্য প্রয়োজন নেই। পরে isolated reconciliation-এর প্রয়োজন হলে identity relationships বজায় রাখা সীমিত anonymized sample ও counts যথেষ্ট হতে পারে।

## Inputs পাওয়ার পর proposed sequence

1. Current release বনাম supplied MVP diff এবং schema inventory;gap register evidence/status update।
2. Student/enrollment/Guardian/Teacher/branch keys ও permitted fields-এর explicit mapping;ambiguous identity manual review।
3. Existing read interface-এর offline sample contract;no-write boundary,privacy এবং row/count/hour reconciliation scenarios।
4. Safe Guardian link point ও child authorization contract;staff auth boundary আলাদা;no SSO assumption।
5. তারপর approved design ধরে isolated adapter implementation/test-এর সুনির্দিষ্ট scope তৈরি;production deployment নয়। Cadence,stale threshold ও unresolved policies আগে settle করতে হবে।

## Readiness evidence needed later,not executed now

- Legacy credential/interface cannot INSERT/UPDATE/DELETE;actual permission evidence needed,no assumption from adapter naming।
- Own-child/branch/Teacher scope and private-note exclusions enforced।
- Duplicate replay,edit/delete detection,sync failure,source-availability outage এবং stale read view behavior।
- Source vs projection counts/manual minutes/packages/verified payment refs reconciliation;manual amounts never promoted to confirmed payments।
- Existing legacy classes/payments keep running if Academy integration fails;parallel checks and final D-201 launch gate preserved।

Q6 AM-11 remains permission to inspect safe copy. Five-file static review is done;current deployed match,data-content/runtime/security/full integration audit remains NOT DONE. No live connection or source changes are required just to provide this gap list.
