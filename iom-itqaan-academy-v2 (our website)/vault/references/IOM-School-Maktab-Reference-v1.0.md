# IOM School Maktab — Master Decision Reference

- **Version:** 1.0
- **Reference prepared:** 2026-10-23 (Asia/Dhaka)
- **Decision status:** Decision 1–201 — Confirmed, সরবরাহকৃত মূল তালিকা অনুযায়ী।
- **Proposal status:** Proposed Enhancements 1–12 — Unapproved; অনুমোদিত সিদ্ধান্ত নয়।
- **Decision approval dates:** মূল উৎসে প্রতিটি সিদ্ধান্তের পৃথক তারিখ নেই; এই ফাইল তৈরির তারিখকে অনুমোদনের তারিখ ধরা যাবে না।
- **Language:** বাংলা ও মূল English terminology।

## Source note ও সংরক্ষণ নীতি

মূল কথোপকথন: “Class managment” — conversation ID `6ad57c72-8718-83ec-b7ad-d8e1ad3ed026`। সরাসরি conversation retrieval-এ মূল assistant text পাওয়া যায়নি; তাই ব্যবহারকারীর সরবরাহ করা `Pasted text.txt` এই reference-এর কার্যকর উৎস।

মূল শিরোনামে “২০০টি” লেখা থাকলেও একই উৎসে অতিরিক্ত Decision 201 এবং মোট ২০১টি নিশ্চিত সিদ্ধান্ত স্পষ্টভাবে আছে। নিচে মূল শিরোনাম, Part বিভাজন, decision numbering ও প্রতিটি সিদ্ধান্তের বক্তব্য অপরিবর্তিত রাখা হয়েছে। উৎসের plain-text বিন্যাস বজায় রাখা হয়েছে। কোনো নতুন operational requirement যোগ করা হয়নি।

১২টি প্রস্তাব ও তাদের MVP/Phase 2 priority উৎসে প্রস্তাব হিসেবেই দেওয়া হয়েছে। এগুলো রাখার অনুরোধকে বাস্তবায়ন বা policy approval হিসেবে গণ্য করা যাবে না।

## পরবর্তী ChatGPT সেশনে ব্যবহারের নির্দেশনা

1. এই সম্পূর্ণ Markdown file নতুন সেশনে আপলোড করে কাজের মূল reference হিসেবে পড়তে বলুন।
2. Decision 1–201-এর নম্বর ও মূল বক্তব্য বজায় রাখুন; আলোচনা বা blueprint-এ সংশ্লিষ্ট decision number উল্লেখ করুন।
3. Decision 1–131-এর বিস্তারিত operational rules এবং Decision 132–201-এর system-level requirements আলাদাভাবে সাজানো যেতে পারে; কোনো সিদ্ধান্ত বাদ দেওয়া যাবে না। এই বিভাজন মূল উৎসের নির্দেশনা থেকে নেওয়া।
4. Proposed Enhancements 1–12 আলাদা Unapproved বিভাগেই থাকবে। ব্যবহারকারীর স্পষ্ট অনুমোদন ছাড়া এগুলোকে confirmed requirement বা approved MVP scope হিসেবে ব্যবহার করবেন না।
5. অনির্ধারিত বিষয়, অস্পষ্টতা বা সম্ভাব্য বিরোধ থাকলে সংশ্লিষ্ট নম্বর উল্লেখ করে clarification চাইতে হবে; অনুমান করে নতুন নিয়ম বানানো যাবে না।
6. পরিবর্তন অনুমোদিত হলে নতুন version ও change log তৈরি করুন; আগের বক্তব্য ও approval evidence সংরক্ষণ করুন।
7. এই reference তৈরির কাজের মধ্যে Excel database analysis, Academy coding বা বিদ্যমান Itqaan Class Manager পরিবর্তন অন্তর্ভুক্ত নয়। এই ফাইল নিজে কোনো development authorization নয়।

## Glossary — পড়ার সহায়িকা

এই সংক্ষিপ্ত ব্যাখ্যাগুলো পাঠসহায়ক; নতুন permission বা policy নির্ধারণ করে না। বিস্তারিত ক্ষমতা সংশ্লিষ্ট decision-এ দেখতে হবে।

| শব্দ | এই reference-এ ব্যবহার |
|---|---|
| Academy Portal | Academic ও administrative কাজের মূল portal |
| Batch Zimmadar | Batch পর্যায়ের তত্ত্বাবধায়ক; decision অনুযায়ী review, approval ও follow-up পরিচালনা করেন |
| Department Supervisor | Department পর্যায়ের তত্ত্বাবধায়ক |
| Central Management | Academy-এর কেন্দ্রীয় ব্যবস্থাপনা ও oversight |
| Guardian / Family Account | অভিভাবক ও তাঁর অধীনে থাকা সন্তানদের account arrangement |
| RBAC | Role-Based Access Control |
| PWA | Progressive Web App |
| MVP | প্রস্তাবিত প্রথম version-এর priority label; proposal approval বোঝায় না |
| Makeup Class | বাতিল হওয়া মূল class-এর সঙ্গে linked পূরণমূলক class |
| Held Classes | অনুষ্ঠিত classes; attendance calculation-এর প্রাসঙ্গিক ভিত্তি |
| Separate Payment Portal | বিদ্যমান পৃথক secure payment collection portal |
| Itqaan Class Manager | পূর্বের One-to-One management project; প্রাসঙ্গিক decision-এ যার কার্যপদ্ধতি অনুসরণের কথা আছে |
| Audit / Revision History | পরিবর্তন, সংশোধন ও অনুমোদনের সংরক্ষিত ইতিহাস |

## A. Confirmed Decisions — 1–201

**এই বিভাগের প্রতিটি numbered decision-এর status: Confirmed (মূল উৎস অনুযায়ী)।**

IOM School Maktab — ২০০টি সিদ্ধান্তের পূর্ণ তালিকা
Part 1: Academy Structure & Basic Operations (1–23)
1. Academy Model: IOM School Maktab একটি সম্পূর্ণ Online International Islamic Academy হবে।
2. Class Types: Group/Batch Class এবং One-to-One Class—উভয় ব্যবস্থা থাকবে।
3. Course Duration: নির্দিষ্ট মেয়াদের Course এবং Continuous Course—উভয় ধরনের Course থাকবে।
4. Management Structure: Central Management-এর পাশাপাশি Country/Branch Administration থাকবে।
5. Admission: Direct Admission এবং Assessment-Based Admission—উভয় পদ্ধতি থাকবে।
6. Current Teacher Reporting: বর্তমানে Teacher-রা Telegram/Messaging-এর মাধ্যমে Class Report দেন।
7. Guardian Updates: Guardian-দের নিয়মিত Update এবং Weekly/Monthly Progress জানানো হবে।
8. Teacher Monitoring: Teacher Performance ও Assigned Task Completion পর্যবেক্ষণ করা হবে।
9. Assessment: Examination এবং Continuous Assessment—উভয় ব্যবস্থা থাকবে।
10. Family Account: একটি Guardian Account-এর অধীনে একাধিক সন্তানের তথ্য থাকবে।
11. Fee Types: Fixed Course Fee এবং Monthly Tuition—উভয় ব্যবস্থা থাকবে।
12. International Payments: আন্তর্জাতিক শিক্ষার্থীদের জন্য একাধিক Payment Collection Method থাকবে।
13. Differentiated Fees: বাংলাদেশ, প্রবাসী ও বিদেশভিত্তিক শিক্ষার্থীদের Fee আলাদা হতে পারবে; Schedule Adjustment-এর কারণে Fee পরিবর্তনও হতে পারে।
14. Payment Verification: একাধিক Payment Collection ও Verification Method সমর্থিত হবে।
15. Existing Payment Portal: Payment Collection ও Confirmation বিদ্যমান Separate Secure Payment Portal-এ থাকবে; নতুন System-এ একই Payment Gateway পুনরায় তৈরি করা হবে না।
16. Current Routine: বর্তমানে Batch Routine নির্দিষ্ট থাকে।
17. Current Attendance: বর্তমানে বিভিন্ন পদ্ধতিতে Attendance Report সংগ্রহ করা হয়।
18. Attendance Responsibility: Teacher Attendance Record করবেন এবং Telegram/Sheets-এ জানাবেন; দীর্ঘ অনুপস্থিতিতে Zimmadar-এর তত্ত্বাবধানে নির্ধারিত Teacher পরিবারকে যোগাযোগ করবেন।
19. Absence Follow-up: শিক্ষার্থী এক সপ্তাহ অনুপস্থিত থাকলে Follow-up শুরু হবে।
20. Batch Teachers: একটি Batch-এ একজন অথবা একাধিক Teacher থাকতে পারবেন।
21. Supervision: Batch, Department ও Management—তিন স্তরে Supervision থাকবে।
22. Role-Based Access: Hierarchical Role-Based Access Control (RBAC) থাকবে।
23. Departments: Academy-তে একাধিক Academic Department থাকবে।
Part 2: Courses, Batch & Academic Management (24–44)
24. Course Portfolio: School Maktab (প্রায় ১–১.৫ বছর, ছেলে/মেয়ে, বাংলা/ইংরেজি), Nazera (১.৫ বছর + ঐচ্ছিক ৬ মাস), Hifz (৩ বছরের লক্ষ্য, প্রয়োজনে বাড়ানো যাবে), Tajweed (৪ মাস), গল্পে গল্পে তাফসীর (৫ মাস), জুয আম্মা হিফজ (৫ মাস), আমলী সূরা (৫ মাস), Ramadan ও Free Courses থাকবে।
25. Department Structure: School Maktab, Nazera ও Hifz আলাদা Department হবে; Short Course-এর Department Structure পরে নির্ধারিত হবে।
26. Batch Placement: শিক্ষার্থীর Age ও Academic Level অনুযায়ী Batch নির্ধারণ করা হবে।
27. Promotion: Examination ও Continuous Assessment-এর ভিত্তিতে Promotion হবে।
28. Current Homework: বর্তমানে Telegram/Messaging-এর মাধ্যমে Homework দেওয়া হয়।
29. Future Homework: Academy Portal-এ Homework Management থাকবে; Telegram Communication-ও চলবে।
30. Online Platforms: Zoom এবং Google Meet—উভয় Platform ব্যবহার করা হবে।
31. Learning Materials: Class Recording ও Materials Course/Batch অনুযায়ী ভিন্ন হতে পারবে।
32. Class Report Template: Course অনুযায়ী Teacher Class Report Form আলাদা হবে।
33. Report Approval: Batch Zimmadar Class Report অনুমোদন করবেন।
34. Report Deadline: Class Report একই দিনে Submit করতে হবে।
35. Late Report Escalation: Late Report হলে Teacher Reminder → Batch Zimmadar → Department Supervisor/Management Escalation হবে; নির্দিষ্ট সময়সীমা পরে নির্ধারিত হবে।
36. Substitute Teacher: Regular Teacher অনুপস্থিত হলে Substitute Teacher Class নেবেন।
37. Substitute Assignment: প্রথমে Regular Teacher Substitute খুঁজবেন; না পেলে Batch Zimmadar ব্যবস্থা করবেন।
38. Substitute Report: Substitute Teacher নিজেই Class Report Submit করবেন; Batch Zimmadar অনুমোদন করবেন।
39. Teacher Workload: Class Count, Teaching Hours, Regular/Substitute Classes, Reports ও অন্যান্য Duties Track হবে।
40. Teaching Hours: Actual Start/End Time অনুযায়ী Teaching Hours হিসাব হবে; Scheduled Class Count-ও সংরক্ষিত থাকবে।
41. Class Timer: Start Class/End Class Button থাকবে; Manual Correction করতে Batch Zimmadar Approval লাগবে এবং Audit History থাকবে।
42. Automatic Meeting Launch: Start Class চাপলে Timer শুরু হবে এবং নির্ধারিত Zoom/Google Meet Link খুলবে।
43. End Class Workflow: End Class চাপলে Timer বন্ধ হবে এবং Course-Specific Class Report Form খুলবে। Teacher সঙ্গে সঙ্গে Submit করতে অথবা Draft Save করে একই দিনে Submit করতে পারবেন।
44. Report Revision: ভুল/অসম্পূর্ণ Report Batch Zimmadar কারণসহ Return করবেন; Teacher সংশোধন করে পুনরায় Submit করবেন। Revision History সংরক্ষিত থাকবে।
Part 3: Teacher Absence, Rescheduling & Attendance (45–60)
45. Advance Teacher Absence Notice: Teacher সাধারণত কমপক্ষে ১২ ঘণ্টা আগে অনুপস্থিতির কথা জানাবেন।
46. Emergency Absence: জরুরি অনুপস্থিতিতে Teacher যত দ্রুত সম্ভব Batch Zimmadar-কে জানাবেন; Zimmadar Substitute নির্ধারণ করবেন।
47. Substitute Notification: Class Time ও Meeting Link অপরিবর্তিত থাকলে Guardian/Student-কে Substitute Teacher সম্পর্কে আলাদা Notification পাঠানো হবে না।
48. Reschedule Authority: Class Reschedule বা Cancel করার চূড়ান্ত ক্ষমতা শুধু Batch Zimmadar-এর থাকবে; Teacher Request করতে পারবেন।
49. Schedule Notification: Reschedule/Cancel হলে Academy Portal Routine Update হবে এবং Telegram Notification যাবে।
50. Makeup Class Approval: Cancelled Class-এর Makeup Class প্রয়োজন কি না, Department Supervisor অনুমোদন করবেন।
51. Makeup Scheduling: অনুমোদনের পর Teacher ও Guardian-এর সঙ্গে সমন্বয় করে Batch Zimmadar Makeup Class-এর সময় নির্ধারণ করবেন।
52. Makeup Tracking: Makeup Class আলাদাভাবে চিহ্নিত হবে; Attendance, Teaching Hours, Class Report থাকবে এবং মূল Cancelled Class-এর সঙ্গে Linked থাকবে।
53. Hybrid Attendance: Zoom/Google Meet থেকে সম্ভব হলে Automatic Attendance Data নেওয়া হবে; Teacher যাচাই করবেন। প্রয়োজনে Manual Attendance থাকবে।
54. Attendance Status: Present, Absent ও Late—এই তিনটি Status থাকবে।
55. Late Rule: Class শুরুর ১৫ মিনিটের বেশি পরে Join করলে Late হবে; ঠিক ১৫ মিনিটে Join করলে Present।
56. One-Week Absence Alert: এক সপ্তাহ অনুপস্থিত থাকলে Batch Zimmadar Automatic Alert পাবেন; নির্ধারিত Teacher Guardian-কে Contact করে Follow-up Record করবেন।
57. Further Absence Escalation: প্রথম Follow-up-এর পর আরও ৭ দিন অনুপস্থিত থাকলে Batch Zimmadar Reminder ও Department Supervisor Escalation হবে।
58. Attendance Correction: Teacher নিজের Class-এর Final Attendance সরাসরি Edit করতে পারবেন; সম্পূর্ণ Audit History থাকবে।
59. Attendance Visibility: অনুমোদিত Staff/Management Attendance Reports দেখতে পারবেন; Guardian শুধু নিজের সন্তানের Attendance দেখতে পারবেন।
60. Attendance Notification Frequency: Guardian Instant, Daily অথবা Weekly Attendance Notification নির্বাচন করতে পারবেন।
Part 4: Guardian Accounts & Student Leave (61–77)
61. Attendance Notification Channels: Academy Portal এবং Guardian-এর Personal Telegram-এ Attendance Notification যাবে।
62. Per-Child Notification Settings: Family Account-এর প্রতিটি সন্তানের জন্য আলাদা Attendance Notification Frequency নির্ধারণ করা যাবে।
63. Optional Telegram Linking: Telegram Linking ঐচ্ছিক; Secure Bot Linking থাকবে। Telegram যুক্ত না থাকলেও Portal Notification চলবে।
64. Two Guardian Roles: Primary Guardian ও Secondary Guardian-এর আলাদা Login থাকবে।
65. Secondary Guardian Management: Primary Guardian নিজেই Secondary Guardian Add, Edit ও Remove করতে পারবেন; Admin Approval লাগবে না।
66. Secondary Guardian Permissions: Secondary Guardian Academic Information, Teacher Communication, Absence Notice ও Homework-related কাজ করতে পারবেন; কিন্তু Guardian Management ও Main Family Account Administration করতে পারবেন না।
67. Official Student Absence Notice: Student Absence Notice শুধু Academy Portal দিয়ে Submit করতে হবে; Telegram Message Official Notice হিসেবে গণ্য হবে না।
68. Absence Approval: Student Absence Notice Approve/Reject করার ক্ষমতা শুধু Batch Zimmadar-এর থাকবে।
69. Absence Rejection: Reject করলে Written Reason দিতে হবে; Guardian একই Notice সংশোধন করে Resubmit করতে পারবেন। History থাকবে।
70. Absence Notice Deadline: Class-এর আগে Notice দেওয়া যাবে; Emergency হলে Class শেষের ২৪ ঘণ্টার মধ্যে Submit করতে হবে।
71. Date-Range Absence Notice: একটি Notice দিয়ে নির্ধারিত Date Range-এর সব Scheduled Classes Cover করা যাবে, তবে অতীতের Class-এর Deadline প্রযোজ্য থাকবে।
72. Approved Leave Follow-up Pause: Approved Leave চলাকালে Automatic Absence Follow-up/Escalation বন্ধ থাকবে; Attendance Record-এ Absent থাকবে।
73. Absence Counter Reset: Approved Leave শেষ হলে Absence Follow-up Counter শূন্য থেকে শুরু হবে; পুরোনো History থাকবে।
74. Maximum Leave Notice: একটি Student Absence Notice সর্বোচ্চ ১৪ Calendar Days-এর জন্য হবে।
75. Leave Extension: ১৪ দিনের বেশি হলে Portal-এ Leave Extension Request করতে হবে; Batch Zimmadar Review করবেন, Department Supervisor Final Approval দেবেন।
76. Return to Regular Class: দীর্ঘ Approved Leave শেষে Student Regular Class-এ ফিরবেন; বাধ্যতামূলক Special Academic Recovery Plan থাকবে না।
77. Automatic Returned Status: Leave শেষে প্রথম Present Attendance পাওয়া গেলে Student Automatically Returned হিসেবে চিহ্নিত হবে; আলাদা Confirmation Form লাগবে না।
Part 5: Attendance Correction & Low Attendance (78–94)
78. Return Notification: Student Returned হলে Portal Status Update হবে; আলাদা Return Confirmation Notification যাবে না।
79. Guardian Correction Process: Guardian ভুল Attendance দেখলে সরাসরি Class Teacher-এর সঙ্গে যোগাযোগ করবেন; আলাদা Correction Request Form থাকবে না।
80. Correction Deadline: Class-এর ৭ দিনের মধ্যে Teacher Attendance সরাসরি সংশোধন করতে পারবেন; এরপর Batch Zimmadar Approval লাগবে।
81. Correction Notification: Attendance Correction Guardian Dashboard-এ দেখা যাবে; আলাদা Correction Notification পাঠানো হবে না।
82. Automatic Counter Recalculation: Attendance Correction হলে Absence Counter পুনরায় হিসাব হবে; অপ্রয়োজনীয় Pending Follow-up Alert বন্ধ হবে।
83. Detailed Attendance Dashboard: Guardian Attendance Summary, Percentage, Monthly Calendar, Class-wise History ও Approved Leave দেখতে পারবেন।
84. Attendance Percentage: (Present + Late) ÷ Total Held Classes × 100। Approved Leave-এর Absent Classes-ও Denominator-এ থাকবে।
85. Low Attendance Threshold: Attendance Percentage ৭৫%-এর নিচে গেলে Warning হবে।
86. Warning Recipients: Guardian, Class Teacher ও Batch Zimmadar Low Attendance Warning পাবেন।
87. Guardian Follow-up Deadline: Warning-এর ৩ দিনের মধ্যে Class Teacher Guardian-এর সঙ্গে যোগাযোগ করে Follow-up Result Record করবেন।
88. Follow-up Escalation: ৩ দিনেও Follow-up না হলে Teacher Reminder + Batch Zimmadar Alert; আরও ৩ দিনেও না হলে Department Supervisor Escalation।
89. Follow-up Notes: Teacher Free-Text Notes লিখবেন; Contact Date, Guardian-এর বক্তব্য ও Next Steps অন্তর্ভুক্ত থাকবে।
90. Follow-up Notes Privacy: Notes শুধু সংশ্লিষ্ট Teacher, Batch Zimmadar, Department Supervisor ও Authorized Management দেখতে পারবেন।
91. Notes Editing: Submit-এর ২৪ ঘণ্টার মধ্যে Teacher Notes Edit করতে পারবেন; এরপর Batch Zimmadar Approval লাগবে।
92. Notes Version History: Follow-up Notes-এর পুরোনো/নতুন Content, Editor, Time ও Approval History থাকবে।
93. Weekly Repeat Warning: Attendance ৭৫%-এর নিচে থাকলে প্রতি ৭ দিনে নতুন Low Attendance Warning ও Follow-up তৈরি হবে।
94. Automatic Follow-up Closure: Attendance ৭৫% বা বেশি হলে Pending Low Attendance Follow-ups Automatically Close হবে; History সংরক্ষিত থাকবে।
Part 6: Monthly Attendance & Follow-up Workflow (95–111)
95. Monthly Attendance Calculation: Attendance Percentage ও ৭৫% Warning Current Calendar Month-এর Held Classes অনুযায়ী হিসাব হবে।
96. Minimum Class Requirement: মাসে অন্তত ৩টি Held Class না হওয়া পর্যন্ত Low Attendance Warning চালু হবে না।
97. Month-End Pending Follow-up: নতুন মাস শুরু হলেও আগের মাসের Pending Low Attendance Follow-ups চালু থাকবে।
98. Zimmadar Dashboard: Low Attendance Follow-up Dashboard-এ Pending, Overdue, Completed, Escalated Status ও Filters থাকবে।
99. Limited Bulk Actions: Batch Zimmadar একাধিক Follow-up-এর Teacher Reminder একসঙ্গে পাঠাতে পারবেন; Complete/Close আলাদাভাবে করতে হবে।
100. Bulk Reminder Channels: Portal Notification এবং Telegram Linked থাকলে Personal Telegram-এ Reminder যাবে।
101. Optional Acknowledge: Teacher Reminder Acknowledge করতে পারবেন, তবে বাধ্যতামূলক নয়।
102. Automatic Follow-up Completion: Teacher Guardian Follow-up Notes Submit করলে Follow-up Automatically Completed হবে।
103. Completed Follow-up Reopen: Completion-এর ২৪ ঘণ্টার মধ্যে Teacher নিজে Reopen করতে পারবেন; এরপর Batch Zimmadar Permission লাগবে।
104. Reopened Follow-up Deadline: Reopen করার ২৪ ঘণ্টার মধ্যে Follow-up Complete করতে হবে।
105. Reopened Follow-up Overdue: ২৪ ঘণ্টায় Complete না হলে Teacher Reminder ও Batch Zimmadar Alert হবে।
106. Reopen Limit: একটি Completed Follow-up সর্বোচ্চ ২ বার Reopen করা যাবে।
107. New Follow-up After Limit: ২ বার Reopen-এর পর নতুন Follow-up দরকার হলে Teacher Request করবেন; Batch Zimmadar Review করে তৈরি/Approve করবেন।
108. New Follow-up Deadline: নতুন Approved Follow-up ৩ দিনের মধ্যে Complete করতে হবে।
109. New Follow-up Escalation: ৩ দিনে না হলে Teacher Reminder + Batch Zimmadar Alert; ৬ দিনে না হলে Department Supervisor Escalation।
110. Supervisor Intervention: Escalated Follow-up-এ Department Supervisor Reminder দিতে বা অন্য Teacher-কে Reassign করতে পারবেন।
111. Reassigned Follow-up Deadline: নতুন Teacher-কে Reassigned Follow-up ৪৮ ঘণ্টার মধ্যে Complete করতে হবে।
Part 7: Escalation & Management Action Plan (112–131)
112. Reassignment Escalation: ৪৮ ঘণ্টায় Reassigned Follow-up Complete না হলে Teacher Reminder + Supervisor Alert; আরও ২৪ ঘণ্টায় না হলে Management Escalation।
113. Management Action: Management প্রথমে Department Supervisor-এর Action Plan চাইবে; প্রয়োজনে Teacher Reassign বা Deadline পরিবর্তন করতে পারবে।
114. Action Plan Deadline: Management Request-এর ২৪ ঘণ্টার মধ্যে Department Supervisor Action Plan Submit করবেন।
115. Missing Action Plan: ২৪ ঘণ্টায় Plan না দিলে Management Alert হবে; অন্য Supervisor/Staff Assign করা যাবে।
116. Reassigned Action Plan: নতুন Assigned Supervisor/Staff ১২ ঘণ্টার মধ্যে Plan Submit করবেন।
117. Further Action Plan Failure: ১২ ঘণ্টায় Plan না এলে Management নিজে Plan তৈরি, Reassign বা Emergency Action নিতে পারবে।
118. Action Plan Approval: Supervisor/Staff-এর Action Plan Management Approval লাগবে; Management নিজে তৈরি করলে আলাদা Approval লাগবে না।
119. Action Plan Revision: Management Plan Return করলে ১২ ঘণ্টার মধ্যে সংশোধিত Plan Resubmit করতে হবে।
120. Revision Overdue: ১২ ঘণ্টায় Revision না হলে Management Alert; Management নিজে সংশোধন, Reassign বা Emergency Action নিতে পারবে।
121. Implementation Responsibility: Approved Action Plan বাস্তবায়নের দায়িত্ব Department Supervisor-এর।
122. Progress Update Frequency: Action Plan শেষ না হওয়া পর্যন্ত অন্তত প্রতি ২৪ ঘণ্টায় Progress Update দিতে হবে।
123. Missing Progress Update: ২৪ ঘণ্টায় Update না দিলে Supervisor Reminder ও Management Alert হবে।
124. Progress Update Contents: Overall Status, Completed Tasks, Pending Tasks, Problems/Blockers ও Next Steps থাকবে।
125. Blocker Management: Reported Blocker হলে Management Alert যাবে; Blocker Status, Resolver ও Resolution History Track হবে।
126. Blocker Resolver: Department Supervisor Resolver Assign করবেন; Management Override করতে পারবে।
127. Blocker Deadline: Critical ৬ ঘণ্টা, High ১২ ঘণ্টা, Normal ২৪ ঘণ্টা; Management Deadline পরিবর্তন করতে পারবে।
128. Blocker Priority: Department Supervisor Priority নির্ধারণ করবেন; Management Override করতে পারবে।
129. Blocker Escalation: Critical Overdue হলে সঙ্গে সঙ্গে Resolver, Supervisor ও Management Alert; High/Normal Overdue হলে Resolver Reminder + Supervisor Alert, আরও ৬ ঘণ্টায় Management Alert।
130. Management Intervention: Escalated Blocker-এ Management নির্দেশনা, Resolver Reassignment, New Deadline অথবা Direct Intervention করতে পারবে।
131. Reassigned Blocker Deadline: Escalated Blocker Reassign করলে Management গুরুত্ব, জটিলতা ও পরিস্থিতি অনুযায়ী নতুন Deadline নির্ধারণ করবে।
Part 8: First Version Scope & Academic Features (132–146)
132. Complete Academic System: প্রথম Version-এ Admission, Student, Teacher, Batch, Routine, Attendance, Class Report, Exam, Homework, Student Progress, Teacher Performance ও Reports থাকবে।
133. Guardian Portal Only: প্রথম Version-এ আলাদা Student Login/Dashboard থাকবে না; Guardian Portal থাকবে।
134. Combined Exam System: Live Oral/Practical Exam, Online Written/MCQ Exam, Teacher-Entered Marks ও Results থাকবে।
135. Basic Homework Tracking: Teacher Assignment, Guardian View ও Teacher Completion Status থাকবে; বাধ্যতামূলক Online Homework Submission/Marking থাকবে না।
136. Combined Student Progress: Exam Results, Teacher Evaluation, Attendance ও Homework Completion একসঙ্গে Track হবে।
137. Teacher Performance Indicators: Class Attendance, Teaching Hours, Class Reports ও Assigned Tasks-এর ভিত্তিতে Teacher Performance হবে; প্রথম Version-এ Student Results বাধ্যতামূলক Performance Score হবে না।
138. Comprehensive Reporting: Student, Teacher, Batch, Department, Overall Academy Reports ও Management Dashboard থাকবে।
139. Hybrid Admission: Guardian Online Application এবং Admin Manual Enrollment—উভয় ব্যবস্থা থাকবে।
140. Portal + Telegram Communication: Official Academic Records ও Requests Portal-এ থাকবে; Telegram Notification ও Regular Communication-এর জন্য ব্যবহার হবে।
141. Complete Finance Management: Student Fees, Teacher Payments, Expenses ও Financial Reports থাকবে; Payment Collection বিদ্যমান Separate Portal-এ হবে।
142. Central + Branch Autonomy: Shared System থাকবে; Branch নিজের Academic Operations পরিচালনা করবে, Central Management Oversight রাখবে।
143. Public Website + Academy Portal: একই Platform-এ Public Course Information, Admission এবং Admin/Teacher/Guardian Login থাকবে।
144. Responsive Web App + PWA: Mobile ও Desktop-Friendly Web App হবে; প্রথম Version-এ Native Mobile App বাধ্যতামূলক নয়।
145. Bilingual Interface: বাংলা ও ইংরেজি Interface থাকবে; User নিজের Preferred Language বেছে নিতে পারবেন।
146. Flexible Academic Calendar: Course/Batch অনুযায়ী Start Date, End Date, Exam Period ও Academic Schedule আলাদা হতে পারবে।
Part 9: Enrollment, Finance & Administration (147–166)
147. Teacher Payment Basis: Teacher Payment Class Count অথবা Actual Teaching Hours অনুযায়ী হতে পারবে।
148. Multiple Course Enrollment: একজন Student একই সঙ্গে একাধিক Course-এ ভর্তি হতে পারবেন; Progress আলাদাভাবে Track হবে।
149. Digital Certificates: Course Completion-এর পর Portal থেকে Certificate Generate, Store ও Download করা যাবে।
150. Learning Materials Library: Department/Course অনুযায়ী PDF, Notes, Video, Audio ও অন্যান্য Resources থাকবে।
151. Session Archive: Academic Year/Session অনুযায়ী Records Archive হবে; Authorized Users পুরোনো Records দেখতে পারবেন।
152. Basic Staff Management: Teacher, Admin, Supervisor ও অন্যান্য Staff Profile, Role, Department, Tasks ও Status থাকবে।
153. Bulk Data Import: Student, Guardian, Teacher ও Batch Data Excel/CSV দিয়ে Bulk Import করা যাবে।
154. Central Task Management: Teacher, Admin, Zimmadar ও Supervisor-এর Tasks, Progress, Approvals ও Follow-ups একটি Central Workflow System-এ থাকবে।
155. Hybrid Admission Assessment: Live Oral, Online Written/MCQ এবং Teacher Evaluation—Course অনুযায়ী ব্যবহার করা যাবে।
156. Criteria-Based Promotion: Exam ও Continuous Assessment থেকে System Eligibility হিসাব করবে; Authorized Academic Staff Final Approval দেবেন।
157. Student Transfer: Batch ও Branch Transfer করা যাবে; Student Profile ও Academic History অক্ষত থাকবে।
158. Student Lifecycle: Course অনুযায়ী Active, On Hold, Withdrawn, Completed ও Inactive Status থাকবে।
159. Guardian–Teacher Messaging: Portal-এ Academic Messaging থাকবে; Telegram Notification ও General Communication চলবে।
160. Complete Student Fee Management: Course Fee, Invoice, Due, Payment History, Scholarship, Discount, Waiver, Partial Payment ও Installment থাকবে।
161. Department/Branch Finance: Income, Expenses, Teacher Payments ও Financial Reports Branch/Department অনুযায়ী দেখা যাবে।
162. Security & Backup: Secure Login, RBAC, Sensitive Data Protection, Audit Logs, Automated Backups ও Recovery থাকবে।
163. Central Standards + Local Flexibility: Central Policies বজায় রেখে অনুমোদিত সীমায় Branch/Department Settings পরিবর্তন করা যাবে।
164. Feedback & Complaint System: Guardian Portal Ticket Submit করতে পারবেন; Admin/Supervisor Assign, Track ও Resolve করবেন।
165. Integrated Course Enrollment: Public Website-এ Course Details, Available Batches, Admission Application ও Status থাকবে।
166. Waiting List: Batch Full হলে Applicant Waiting List-এ যেতে পারবেন; Seat খালি হলে Admin Review করবেন।
Part 10: One-to-One Management (167–175)
167. Existing Class Manager Model: One-to-One Management আগের Itqaan Class Manager-এর পূর্ণ কার্যপদ্ধতি অনুসরণ করবে; বিদ্যমান Project পরিবর্তন করা হবে না।
168. Separate Module: One-to-One-এর আলাদা Module ও Dashboard থাকবে; মূল Academy System-এর সঙ্গে Data সংযুক্ত থাকবে।
169. Login Arrangement: Admin ও Teacher মূল Academy Login ব্যবহার করবেন; One-to-One Guardian-এর আলাদা Login থাকবে।
170. Guardian Dashboard: One-to-One Guardian Dashboard-এর Features আগের Itqaan Class Manager-এর মতো থাকবে।
171. Integrated Finance: One-to-One Module-এ Fee ও Teaching Hours হিসাব থাকবে; Financial Data মূল Academy Finance Dashboard-এও দেখা যাবে। Payment Collection Separate Portal-এ থাকবে।
172. Integrated Academic Progress: Class Reports ও Teacher Notes-এর সঙ্গে Academy Exam Results, Homework ও Progress Reports যুক্ত থাকবে।
173. Teacher Assignment: One-to-One Teacher Assignment আগের Itqaan Class Manager-এর নিয়ম অনুসরণ করবে।
174. Scheduling: One-to-One Scheduling, Rescheduling ও Class Tracking আগের Itqaan Class Manager-এর নিয়ম অনুসরণ করবে।
175. Management Authority: সংশ্লিষ্ট Branch/Department Management One-to-One কার্যক্রম পরিচালনা করবে; Central Management Oversight পাবে।
Part 11: Development, Hosting & Launch (176–186)
176. Parallel Launch: পুরোনো পদ্ধতি ও নতুন System কিছুদিন পাশাপাশি চলবে; যাচাই শেষে নতুন System পুরোপুরি চালু হবে।
177. Data Migration: Basic Data-এর পাশাপাশি উপলব্ধ Attendance, Exam Results, Progress ও প্রয়োজনীয় পুরোনো Academic Records Migration করা হবে।
178. Hosting: বিদ্যমান Hosting Technical Requirements পূরণ করলে সেটিই ব্যবহার করা হবে।
179. Development Priority: প্রথমে Academic Operations; এরপর Exam, Finance, One-to-One ও অন্যান্য Modules। First Version-এর অনুমোদিত Scope বজায় থাকবে।
180. Module Testing: সংশ্লিষ্ট Department/Branch বাস্তবে Module পরীক্ষা করবে; Central Management Final Approval দেবে।
181. Central Technical Team: Maintenance, Bug Fix ও Updates Central Technical Team পরিচালনা করবে।
182. Change Management: Branch/Department Feature/Change Request করতে পারবে; Central Management অনুমোদন করবে; Technical Team বাস্তবায়ন করবে।
183. User Training: Live Training-এর পাশাপাশি Tutorial Video ও Written User Guide থাকবে।
184. User Support: Academy Portal-এর Support Ticket System দিয়ে User Support পরিচালিত হবে।
185. Data Ownership: সব Student, Guardian, Teacher, Academic ও Financial Data Academy-এর মালিকানায় থাকবে; Central Management প্রশাসনিক নিয়ন্ত্রণ রাখবে।
186. Data Portability: Authorized Admin Excel/CSV/PDF Reports Export করতে পারবেন; সম্পূর্ণ Data ও Files নিরাপদ Backup/Migration-এর উপযোগী থাকবে।
Part 12: Staff Management & Performance (187–200)
187. Staff Account Creation: Central Admin সব Staff Account পরিচালনা করতে পারবে; Branch/Department Admin অনুমোদিত সীমায় নিজস্ব Staff Account তৈরি ও পরিচালনা করতে পারবে।
188. Role Assignment: Central Admin Role ও Permission Rules নির্ধারণ করবে; Branch/Department Admin অনুমোদিত Role Assign করতে পারবে।
189. Multiple Staff Roles: একজন Staff একই Login দিয়ে একাধিক অনুমোদিত Role পালন করতে পারবেন।
190. Role Switcher: একাধিক Role থাকলে Staff Role Switcher দিয়ে আলাদা Role Dashboard ব্যবহার করবেন।
191. Branch Access: General Staff একটি Branch/Department-এ সীমাবদ্ধ থাকবেন; শুধু Central Staff একাধিক Branch/Department-এ কাজ করতে পারবেন।
192. Staff Transfer: Branch/Department Transfer Request করবে; Central Admin অনুমোদন ও Transfer সম্পন্ন করবে। পূর্ববর্তী History থাকবে।
193. Staff Exit: Account Inactive ও Login Disable হবে; চলমান Duties Reassign হবে; পুরোনো Records সংরক্ষিত থাকবে।
194. Staff Temporary Leave: Portal Leave Request, Approval, Leave Calendar ও Substitute/Reassignment Management থাকবে; পূর্বের Teacher Absence Policies বজায় থাকবে।
195. Leave Approval: সংশ্লিষ্ট Department/Branch Supervisor Teacher ও Staff Leave Request অনুমোদন করবেন; Central Management Records দেখতে পারবে।
196. Role-Based Staff Performance: Admin, Supervisor ও অন্যান্য Staff-এর Performance Attendance, Task Completion, Reporting ও Duties অনুযায়ী মূল্যায়ন হবে।
197. Performance Reviewer: সংশ্লিষ্ট Supervisor Staff Performance মূল্যায়ন করবেন; Central Management Reports দেখতে পারবে।
198. Quarterly Review: Staff Performance প্রতি ৩ মাসে মূল্যায়ন করা হবে।
199. Performance Privacy: Staff Performance Evaluation শুধু সংশ্লিষ্ট Supervisor ও Authorized Management দেখতে পারবেন।
200. Central Management Dashboard: Academic, Finance, Staff Performance, One-to-One, Pending Approvals ও গুরুত্বপূর্ণ Alerts-এর Combined Summary থাকবে।

অতিরিক্ত: Decision 201
201. Final Live Launch Approval: Department/Branch Testing শেষ হলে Central Management পুরো Academy System-এর Live Launch-এর চূড়ান্ত অনুমোদন দেবে। পূর্বনির্ধারিত Parallel Launch Strategy বজায় থাকবে।

## B. Proposed Enhancements — 1–12 — Unapproved

**এই বিভাগের সব প্রস্তাব এবং development priority Unapproved। নিচে প্রস্তাবসংক্রান্ত মূল লেখা সংরক্ষিত। পুনরাবৃত্ত priority numbering নতুন decision নয়।**

হ্যাঁ, আমাদের ২০১টি সিদ্ধান্ত থেকে IOM School Maktab-এর Management Structure, Academic Operations, Teacher Management, Guardian Communication, Finance, One-to-One Program এবং Administrative Workflows সম্পর্কে বেশ পরিষ্কার ধারণা পেয়েছি।
আমার মূল্যায়নে, Academy-এর মূল কাঠামো অনেকটাই নির্ধারিত। তবে একটি International Online Islamic Academy হিসেবে System-টিকে দীর্ঘমেয়াদে কার্যকর, নিরাপদ এবং সহজে পরিচালনাযোগ্য করতে আরও কয়েকটি গুরুত্বপূর্ণ বিষয় যুক্ত বা স্পষ্ট করা উচিত।
এগুলো নতুন ২০১টি সিদ্ধান্তের অংশ নয়—আমার প্রস্তাবিত সংযোজন।
১. সবচেয়ে গুরুত্বপূর্ণ সংযোজন — High Priority

1. Child Safeguarding & Student Protection Policy
যেহেতু Academy-তে শিশুরা পড়বে, তাই Teacher–Student Communication, Online Class Conduct, Guardian Access, Complaint Escalation এবং শিশুদের ব্যক্তিগত তথ্য সুরক্ষার স্পষ্ট Policy দরকার।
বর্তমান Blueprint-এ Security ও Complaint System আছে, কিন্তু Child Safeguarding আলাদাভাবে সংজ্ঞায়িত হয়নি।




2. International Time Zone Management
Bangladesh, Europe, Middle East, America—বিভিন্ন দেশের শিক্ষার্থীদের জন্য Class Schedule স্বয়ংক্রিয়ভাবে তাঁদের Local Time Zone-এ দেখাতে হবে। Daylight Saving Time-ও বিবেচনায় রাখতে হবে।




3. Teacher Recruitment & Onboarding
Teacher Application, Interview, Demo Class, Qualification Verification, Training এবং Final Appointment-এর একটি Workflow দরকার।
বর্তমানে Staff Profile ও Account Management আছে, কিন্তু Recruitment Process নির্ধারিত হয়নি।




4. Central Curriculum & Syllabus Management
প্রতিটি Course-এর Syllabus, Level, Lesson Plan, Learning Outcomes ও Expected Milestones কেন্দ্রীয়ভাবে নির্ধারণ এবং Version Control করার ব্যবস্থা।
এতে সব Branch-এ একই Academic Standard বজায় রাখা সহজ হবে।




5. Academic Quality Assurance
শুধু Class Count ও Teaching Hours নয়—Class Observation, Curriculum Completion, Teaching Quality Review এবং Academic Improvement Plan-এর ব্যবস্থা।
এটি বিদ্যমান Teacher Operational Performance Score থেকে আলাদা রাখা যেতে পারে।




6. Fee Policy & Financial Controls
Refund, Course Withdrawal, Fee Adjustment, Overdue Payment, Financial Approval এবং Reconciliation Policy স্পষ্ট করা দরকার।
বিদ্যমান Payment Portal-ই টাকা সংগ্রহ করবে; নতুন Payment Gateway লাগবে না।



২. গুরুত্বপূর্ণ, তবে পরের Development Phase-এ রাখা যেতে পারে
প্রস্তাবিত সংযোজন	কেন দরকার
7. Student Re-enrollment & Retention	Course শেষ হলে পরবর্তী Course-এ ভর্তি এবং মাঝপথে ছেড়ে যাওয়া শিক্ষার্থীদের Follow-up
8. Guardian Orientation	নতুন Guardian-কে Portal, Class Rules, Homework ও যোগাযোগের পদ্ধতি শেখানো
9. Teacher Availability & Workload Planning	Teacher-এর Available Slots, Maximum Workload ও Scheduling Conflict শনাক্ত করা
10. Academic Calendar Exceptions	Ramadan, Eid, Public Holidays ও Country-specific Holidays পরিচালনা
11. Emergency & Business Continuity	Zoom/Meet বা Hosting বন্ধ হলে বিকল্প ব্যবস্থা এবং Data Recovery
12. Management Decision & Meeting Records	Meeting Minutes, Assigned Decisions ও Implementation Status Track করা
৩. কোনগুলো প্রথম Version-এ রাখা উচিত?
আমার প্রস্তাবিত অগ্রাধিকার:

সবপ্রথম VersionPhase 2

1. Child Safeguarding & Student Protection
MVP

2. International Time Zone Management
MVP

3. Teacher Recruitment & Onboarding
MVP

4. Curriculum & Syllabus Management
MVP

5. Academic Quality Assurance
Phase 2

6. Fee Policy & Financial Controls
MVP

7. Student Re-enrollment & Retention
Phase 2

8. Guardian Orientation
MVP

9. Teacher Availability & Workload Planning
MVP

10. Academic Calendar Exceptions
MVP

11. Emergency & Business Continuity
MVP

12. Management Decision & Meeting Records
Phase 2



এটি আমার প্রস্তাবিত Development Priority; এখনো অনুমোদিত Blueprint Decision নয়।
৪. আমার মতে সবচেয়ে গুরুত্বপূর্ণ বিষয়
আমাদের Academy System শুধু Class Management Software হওয়া উচিত নয়। এটি এমন একটি Academic Management Platform হওয়া উচিত, যেখানে তিনটি বিষয় একসঙ্গে নিশ্চিত হবে:
- Academic Quality: শিক্ষার্থী সত্যিই কতটুকু শিখছে এবং Curriculum অনুযায়ী এগোচ্ছে কি না।
- Operational Accountability: Teacher, Zimmadar, Supervisor ও Management তাঁদের দায়িত্ব ঠিকমতো পালন করছেন কি না।
- Guardian Trust: অভিভাবক সন্তানের পড়াশোনা, অগ্রগতি, নিরাপত্তা ও Academy-এর সঙ্গে যোগাযোগ নিয়ে স্বচ্ছ ধারণা পাচ্ছেন কি না।
এই তিনটি বিষয় ঠিক থাকলে Academy বড় হলেও Management Quality ধরে রাখা অনেক সহজ হবে।
আমার পরামর্শ: ২০১টি সিদ্ধান্তের সঙ্গে উপরের ১২টি বিষয়কে Proposed Enhancements হিসেবে রাখি। প্রথমে গুরুত্বপূর্ণ ৮–৯টি বিষয়ের Core Policy নির্ধারণ করব, তারপর Final Master Blueprint অনুমোদন করব। সবকিছু একসঙ্গে Develop করার দরকার নেই।
এতে এখন পর্যন্ত নেওয়া কোনো সিদ্ধান্ত পরিবর্তন করতে হবে না; শুধু কিছু গুরুত্বপূর্ণ ঘাটতি পূরণ হবে।

## C. Version history ও completeness check

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-23 | ব্যবহারকারীর দেওয়া উৎস থেকে Decision 1–201 এবং ১২টি Unapproved proposal সংরক্ষণ; status, source note, glossary ও future-use instructions সংযোজন |

- Decision numbering যাচাই: 1 থেকে 201, ধারাবাহিক; 201টি entry।
- মূল 12টি Part এবং অতিরিক্ত Decision 201 রাখা হয়েছে।
- ১২টি distinct proposed enhancement এবং উৎসে দেওয়া priority আলোচনা সংরক্ষিত।
- প্রতিটি decision-এর মূল text উৎসের সঙ্গে হুবহু মিলিয়ে যাচাই করা হয়েছে।
- পৃথক decision approval date ও পরবর্তী কোনো approval evidence সরবরাহ করা হয়নি।