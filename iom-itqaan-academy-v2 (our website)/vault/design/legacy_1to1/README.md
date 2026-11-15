# 1:1 integration ঘাটতি তালিকা — v1.6

দেওয়া ZIP-এর5টি file আবার staticভাবে পরীক্ষা করা হয়েছে। Schema-তে users,students,schedules,sessions,payments আছে;বাস্তব records/data dump নেই। এই ফল বর্তমান live system-এর সম্পূর্ণ অবস্থা প্রমাণ করে না।

## পাওয়া গেছে
- PHP/PDO MySQL admin MVP;student package minutes/fee,weekly links,manual session minutes এবং local payment ledger।
- Student/session/schedule/payment primary keys;কিছু foreign key। Teacher/Guardian নাম/contact text;course-enrollment identity নেই।
- সাধারণ session login ও CSRF implementation;README নিজেই all-student access এবং ভবিষ্যৎ parent/Teacher permission-এর সীমা জানায়। এটি পূর্ণ security audit নয়।

## প্রধান ঘাটতি
1. বর্তমান release/schema মেলানো হয়নি;এই archive initial MVP।
2. Guardian Portal এবং নিজের child-এ access check-এর code নেই।
3. Course enrollment,Teacher assignment এবং branch/department identity contract নেই।
4. Existing read-only API/export বা sync/change/delete contract পাওয়া যায়নি।
5. Separate payment portal-এর verified status/source নেই;manual ledger তার বিকল্প নয়।
6. Contract history,reschedule history,structured report approval,held attendance/leave evidence অনুপস্থিত।

`GAP_REGISTER.csv`-তে20টি প্রমাণভিত্তিক gap,priority,Decision ID,যে capability আটকে আছে এবং প্রয়োজনীয় evidence লেখা আছে। “Absent in supplied copy” মানে current live system-এও নেই—এমন দাবি নয়। Priority তদন্ত/নকশার ক্রম,অনুমোদিত release scope কমানো নয়।

## ফাইল
- `INPUT_MANIFEST.json`:ZIP/file SHA-256,size,inventory,scope ও verification limit।
- `GAP_REGISTER.csv`:20টি ঘাটতির register।
- `SOURCE_FIELD_MAPPING.md`:আসল field বনাম সম্ভাব্য Academy projection এবং তথ্য ব্যবহারের সীমা।
- `NEXT_INPUTS_AND_STEPS.md`:পরের ধাপে ঠিক কী safe copy দরকার এবং কীভাবে এগোনো যায়।

Original201,amendments,Q6 permission,pending decisions ও12 unapproved proposals অপরিবর্তিত। No legacy write,SQL import,API creation,live access,application test বা full audit completion claimed. This is an integration evidence review,not an exhaustive vulnerability scan.
