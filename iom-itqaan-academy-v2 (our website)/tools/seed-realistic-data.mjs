// Realistic Islamic Academy Seeding Script for IOM Academy Local Preview
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { hashPassword } from '../dist/src/security.js';

const local = path.resolve('local');
const configPath = path.join(local, 'config.json');
const database = 'academy_test_antigravity_demo_v1';

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

const c = await mysql.createConnection({
  host: '127.0.0.1',
  port: 33139,
  user: 'academy_ag_demo',
  password: config.password,
  database: database,
  multipleStatements: true,
});

console.log('Connected to ' + database);

try {
  // 1. Disable FK checks and truncate/clean tables
  console.log('Cleaning placeholder records...');
  await c.query('SET FOREIGN_KEY_CHECKS = 0');
  const tablesToTruncate = [
    'teacher_payables',
    'tuition_invoices',
    'package_minute_ledger',
    'one_to_one_contracts',
    'one_to_one_packages',
    'attendance',
    'attendance_corrections',
    'attendance_revisions',
    'reports',
    'report_revisions',
    'class_sessions',
    'student_homework',
    'homework',
    'assessment_marks',
    'assessments',
    'published_progress',
    'announcements',
    'course_resources',
    'payment_references',
    'student_leaves',
    'student_leave_history',
    'followup_cases',
    'followup_notes',
    'followup_events',
    'workflow_notifications',
    'enrollments',
    'enrollment_status_history',
    'students',
    'family_guardians',
    'families',
    'batches',
    'courses',
    'departments',
    'user_role_assignments',
    'users',
    'branches',
    'auth_sessions'
  ];

  for (const t of tablesToTruncate) {
    await c.query(`TRUNCATE TABLE ${t}`);
  }
  await c.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Tables cleaned.');

  const now = new Date().toISOString();
  const h = await hashPassword(config.login);

  // 2. Branches
  console.log('Seeding branches...');
  await c.query("INSERT INTO branches (id, name) VALUES (1, 'আইওএম একাডেমি - মূল ক্যাম্পাস (ঢাকা)'), (2, 'আইওএম একাডেমি - চট্টগ্রাম শাখা')");

  // 3. Departments
  console.log('Seeding departments...');
  await c.query(`INSERT INTO departments (id, branch_id, name, category) VALUES
    (1, 1, 'নূরানী ও নাজেরা কুরআন বিভাগ', 'regular'),
    (2, 1, 'হিফজুল কুরআন বিভাগ', 'regular'),
    (3, 1, 'ইসলামিক স্টাডিজ ও আরবি ভাষা', 'regular'),
    (4, 2, 'নূরানী ও নাজেরা বিভাগ (চট্টগ্রাম)', 'regular')
  `);

  // 4. Users (Central Admin, Branch Admin, Teachers, Zimmadar, Guardians)
  // Maintaining standard demo account logins with realistic names:
  console.log('Seeding realistic users...');
  const users = [
    [1, 'admin@academy.test', 'মুফতি জাহিদুল ইসলাম', 'central_admin', 1, null],
    [2, 'teacher@academy.test', 'মাওলানা ক্বারী আব্দুর রহমান', 'teacher', 1, 1],
    [3, 'zimmadar@academy.test', 'মাওলানা আবু বকর সিদ্দিক', 'zimmadar', 1, 1],
    [4, 'guardian@academy.test', 'ইঞ্জিনিয়ার রফিকুল ইসলাম', 'guardian_primary', 1, null],
    [5, 'teacher2@academy.test', 'হাফেজ মাওলানা মাহমুদ হাসান', 'teacher', 1, 2],
    [6, 'guardian2@academy.test', 'মো. কামরুল হাসান', 'guardian_primary', 1, null],
    [7, 'branch_admin@academy.test', 'মাওলানা তানভীর আহমেদ', 'branch_admin', 1, null],
  ];

  for (const [id, email, name, role, branch_id, dep_id] of users) {
    await c.query(
      'INSERT INTO users (id, email, name, role, branch_id, department_id, password_salt, password_hash, active, created_at) VALUES (?,?,?,?,?,?,?,?,1,?)',
      [id, email, name, role, branch_id, dep_id, h.salt, h.hash, now]
    );
  }

  // 5. Courses
  console.log('Seeding courses...');
  await c.query(`INSERT INTO courses (id, department_id, title, duration_type, start_date, end_date) VALUES
    (1, 1, 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত', 'continuous', NULL, NULL),
    (2, 2, 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম', 'continuous', NULL, NULL),
    (3, 3, 'দৈনন্দিন দ্বীনিয়াত ও মাসনুন আমল', 'fixed', '2026-10-01', '2026-12-31')
  `);

  // 6. Batches & 1:1 Slots
  console.log('Seeding batches and 1:1 slots...');
  await c.query(`INSERT INTO batches (id, course_id, label, delivery_mode, zimmadar_id, teacher_id, start_date, end_date) VALUES
    (1, 1, 'তাজবীদ ব্যাচ ১ (সকাল ৭:০০ - ৮:০০)', 'group', 3, 2, '2026-10-01', NULL),
    (2, 1, 'নাজেরা সান্ধ্যকালীন ব্যাচ (বিকাল ৫:০০ - ৬:০০)', 'group', 3, 2, '2026-10-05', NULL),
    (3, 2, '১:১ হিফজ সান্ধ্যকালীন বিশেষ স্লট (রাত ৮:০০ - ৯:০০)', 'one_to_one', 3, 5, '2026-10-01', NULL),
    (4, 1, '১:১ তাজবীদ সকালের প্রাইভেট স্লট (সকাল ৬:০০ - ৭:০০)', 'one_to_one', 3, 5, '2026-10-01', NULL)
  `);

  // 7. Families & Family Guardians
  console.log('Seeding families...');
  await c.query(`INSERT INTO families (id, name, branch_id) VALUES
    (1, 'রফিকুল ইসলাম পরিবার', 1),
    (2, 'কামরুল হাসান পরিবার', 1)
  `);
  await c.query(`INSERT INTO family_guardians (family_id, user_id) VALUES (1, 4), (2, 6)`);

  // 8. Students
  console.log('Seeding students...');
  await c.query(`INSERT INTO students (id, full_name, branch_id, family_id, created_at) VALUES
    (1, 'মুহাম্মদ আনাস ইসলাম', 1, 1, ?),
    (2, 'মারিয়াম বিনতে রফিক', 1, 1, ?),
    (3, 'আব্দুল্লাহ আল মাহদী', 1, 2, ?)
  `, [now, now, now]);

  // 9. Enrollments
  console.log('Seeding enrollments...');
  await c.query(`INSERT INTO enrollments (id, student_id, batch_id, start_date, end_date, status) VALUES
    (1, 1, 1, '2026-10-01', NULL, 'active'),
    (2, 1, 3, '2026-10-01', NULL, 'active'),
    (3, 2, 2, '2026-10-05', NULL, 'active'),
    (4, 3, 1, '2026-10-01', NULL, 'active')
  `);

  // 10. Class Sessions & Realistic Attendance History
  console.log('Seeding past class sessions & attendance...');
  // 10 past classes for Batch 1 (Tajweed)
  const classDates = [
    '2026-10-15', '2026-10-17', '2026-10-20', '2026-10-22', '2026-10-24',
    '2026-10-27', '2026-10-29', '2026-10-31', '2026-11-02', '2026-11-04'
  ];

  let classId = 1;
  for (let i = 0; i < classDates.length; i++) {
    const d = classDates[i];
    const cid = classId++;
    await c.query(`INSERT INTO class_sessions
      (id, batch_id, scheduled_start, scheduled_end, actual_start, actual_end, status, held_verified, actual_teacher_id, schedule_revision)
      VALUES (?, 1, ?, ?, ?, ?, 'ended', 1, 2, 1)
    `, [cid, d + 'T07:00:00+06:00', d + 'T08:00:00+06:00', d + 'T07:00:15+06:00', d + 'T08:00:20+06:00']);

    // Attendance for Anas (Enrollment 1): 8 Present, 1 Late (idx 4), 1 Absent (idx 8)
    const anasStatus = i === 4 ? 'Late' : (i === 8 ? 'Absent' : 'Present');
    const anasJoin = anasStatus === 'Late' ? d + 'T07:16:30+06:00' : (anasStatus === 'Present' ? d + 'T07:02:10+06:00' : null);
    await c.query(`INSERT INTO attendance (class_id, enrollment_id, status, join_time, verified_by, verified_at) VALUES (?, 1, ?, ?, 2, ?)`,
      [cid, anasStatus, anasJoin, d + 'T08:05:00+06:00']);

    // Attendance for Mahdi (Enrollment 4): 9 Present, 1 Late (idx 2)
    const mahdiStatus = i === 2 ? 'Late' : 'Present';
    const mahdiJoin = mahdiStatus === 'Late' ? d + 'T07:17:45+06:00' : d + 'T07:01:20+06:00';
    await c.query(`INSERT INTO attendance (class_id, enrollment_id, status, join_time, verified_by, verified_at) VALUES (?, 4, ?, ?, 2, ?)`,
      [cid, mahdiStatus, mahdiJoin, d + 'T08:05:00+06:00']);

    // Add Approved Class Report for each past class
    await c.query(`INSERT INTO reports
      (id, class_id, author_id, body, status, first_submitted_at, current_submitted_at, reviewer_id, reviewed_at, revision, updated_at)
      VALUES (?, ?, 2, ?, 'approved', ?, ?, 3, ?, 1, ?)
    `, [
      cid,
      cid,
      `সূরা আল-ফাতিহা ও সূরা আল-ফালাক তাজবীদসহ মাশক সম্পন্ন হয়েছে। মাদ্দ ও গুন্নাহর নিয়ম অনুশীলন করা হয়েছে। আলহামদুলিল্লাহ শিক্ষার্থীরা অত্যন্ত মনোযোগী ছিল। (তারিখ: ${d})`,
      d + 'T08:15:00+06:00',
      d + 'T08:15:00+06:00',
      d + 'T09:30:00+06:00',
      d + 'T09:30:00+06:00'
    ]);
  }

  // 1:1 Hifz Batch 3 past classes (8 sessions, 100% Present!)
  for (let i = 0; i < 8; i++) {
    const d = classDates[i];
    const cid = classId++;
    await c.query(`INSERT INTO class_sessions
      (id, batch_id, scheduled_start, scheduled_end, actual_start, actual_end, status, held_verified, actual_teacher_id, schedule_revision)
      VALUES (?, 3, ?, ?, ?, ?, 'ended', 1, 5, 1)
    `, [cid, d + 'T20:00:00+06:00', d + 'T21:00:00+06:00', d + 'T20:00:10+06:00', d + 'T21:00:40+06:00']);

    await c.query(`INSERT INTO attendance (class_id, enrollment_id, status, join_time, verified_by, verified_at) VALUES (?, 2, 'Present', ?, 5, ?)`,
      [cid, d + 'T20:01:15+06:00', d + 'T21:05:00+06:00']);

    await c.query(`INSERT INTO reports
      (id, class_id, author_id, body, status, first_submitted_at, current_submitted_at, reviewer_id, reviewed_at, revision, updated_at)
      VALUES (?, ?, 5, ?, 'approved', ?, ?, 3, ?, 1, ?)
    `, [
      cid,
      cid,
      `হিফজ পাঠ: পারা ১ এর পৃষ্ঠা ৩ তিলাওয়াত ও মুখস্থ শোনা হয়েছে। মাশাআল্লাহ তাজবীদ ও হরফের উচ্চারণ খুবই নির্ভুল হয়েছে।`,
      d + 'T21:10:00+06:00',
      d + 'T21:10:00+06:00',
      d + 'T22:00:00+06:00',
      d + 'T22:00:00+06:00'
    ]);
  }

  // Upcoming scheduled classes for tomorrow
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await c.query(`INSERT INTO class_sessions
    (id, batch_id, scheduled_start, scheduled_end, actual_start, actual_end, status, held_verified, actual_teacher_id, schedule_revision)
    VALUES
    (?, 1, ?, ?, NULL, NULL, 'scheduled', 0, 2, 1),
    (?, 3, ?, ?, NULL, NULL, 'scheduled', 0, 5, 1)
  `, [
    classId++,
    tomorrow + 'T07:00:00+06:00',
    tomorrow + 'T08:00:00+06:00',
    classId++,
    tomorrow + 'T20:00:00+06:00',
    tomorrow + 'T21:00:00+06:00'
  ]);

  // One class with report in 'submitted' status awaiting Zimmadar review
  const submittedClassId = classId++;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await c.query(`INSERT INTO class_sessions
    (id, batch_id, scheduled_start, scheduled_end, actual_start, actual_end, status, held_verified, actual_teacher_id, schedule_revision)
    VALUES (?, 2, ?, ?, ?, ?, 'ended', 1, 2, 1)
  `, [submittedClassId, yesterday + 'T17:00:00+06:00', yesterday + 'T18:00:00+06:00', yesterday + 'T17:00:00+06:00', yesterday + 'T18:00:00+06:00']);

  await c.query(`INSERT INTO attendance (class_id, enrollment_id, status, join_time, verified_by, verified_at) VALUES (?, 3, 'Present', ?, 2, ?)`,
    [submittedClassId, yesterday + 'T17:02:00+06:00', yesterday + 'T18:05:00+06:00']);

  await c.query(`INSERT INTO reports
    (id, class_id, author_id, body, status, first_submitted_at, current_submitted_at, revision, updated_at)
    VALUES (?, ?, 2, ?, 'submitted', ?, ?, 1, ?)
  `, [
    submittedClassId,
    submittedClassId,
    'নূরানী কায়দা পৃষ্ঠা ১৫ এর হরকত ও তানভীনের উচ্চারণ অনুশীলন সম্পন্ন হয়েছে। মারিয়াম মাশাআল্লাহ খুবই সুন্দর তিলাওয়াত করেছে। জিম্মাদার মহোদয়ের অনুমোদনের জন্য পেশ করা হলো।',
    yesterday + 'T18:15:00+06:00',
    yesterday + 'T18:15:00+06:00',
    yesterday + 'T18:15:00+06:00'
  ]);

  // 11. Homework & Submissions
  console.log('Seeding homework & submissions...');
  await c.query(`INSERT INTO homework
    (id, batch_id, title, instructions, due_date, created_by, created_at, request_id)
    VALUES
    (1, 1, 'সূরা আন-নাস তাজবীদসহ ৫ বার তিলাওয়াত অনুশীলন ও মাশক মুখস্থ', 'প্রতিটি আয়াতের শেষ ওয়াকফ ও নুনের তাশদীদের গুন্নাহ স্পষ্ট করে ৫ বার তিলাওয়াত অনুশীলন করবে এবং শুদ্ধ করে মুখস্থ শোনাবে।', '2026-11-08', 2, ?, 'req-hw-001'),
    (2, 1, 'ওযুর ৪টি ফরজ ও নামাজের ওয়াজিবসমূহ খাতায় সুন্দর করে লিখে মুখস্থ করা', 'সহজ দ্বীনিয়াত বইয়ের পৃষ্ঠা ১২ থেকে ওযুর ৪টি ফরজ ও নামাজের ওয়াজিবগুলো নিজ হাতে খাতায় লিখবে এবং মুখস্থ করবে।', '2026-11-10', 2, ?, 'req-hw-002')
  `, [now, now]);

  await c.query(`INSERT INTO student_homework
    (id, homework_id, enrollment_id, status, teacher_feedback, feedback_at, completed_at, updated_by, updated_at, revision)
    VALUES
    (1, 1, 1, 'completed', 'মাশাআল্লাহ, অত্যন্ত সুন্দর ও স্পষ্ট তিলাওয়াত হয়েছে। আগামী ক্লাসে সূরা আল-ফালাক শোনা হবে।', ?, ?, 2, ?, 1),
    (2, 1, 4, 'pending', NULL, NULL, NULL, NULL, ?, 1),
    (3, 2, 1, 'needs_revision', 'মাশাআল্লাহ সুন্দর হয়েছে, তবে ৪ নম্বর পয়েন্টটি আরেকবার শুদ্ধ করে খাতায় লিখে দেখাও।', ?, NULL, 2, ?, 1),
    (4, 2, 4, 'completed', 'খুবই সুন্দর ও পরিচ্ছন্ন হাতের লেখা হয়েছে। জাযাকাল্লাহু খাইরান।', ?, ?, 2, ?, 1)
  `, [now, now, now, now, now, now, now, now, now]);

  // 12. Assessments & Marks
  console.log('Seeding assessments and marks...');
  await c.query(`INSERT INTO assessments
    (id, batch_id, title, assessment_type, max_marks, pass_marks, assessment_date, created_by, created_at, request_id)
    VALUES
    (1, 1, 'প্রথম সাময়িক মৌখিক তিলাওয়াত ও তাজবীদ মূল্যায়ন', 'oral_practical', 50.00, 20.00, '2026-10-30', 2, ?, 'req-as-001'),
    (2, 1, 'মাসিক দ্বীনিয়াত ও জরুরি মাসআলা মৌখিক পরীক্ষা', 'oral_practical', 30.00, 15.00, '2026-11-03', 2, ?, 'req-as-002')
  `, [now, now]);

  await c.query(`INSERT INTO assessment_marks
    (id, assessment_id, enrollment_id, obtained_marks, teacher_remarks, guardian_feedback, status, published_at, published_by, recorded_by, recorded_at, revision)
    VALUES
    (1, 1, 1, 48.00, 'মাখরাজ ও সিফাত অত্যন্ত নির্ভুল।', 'আলহামদুলিল্লাহ, তিলাওয়াত চমৎকার হয়েছে। নিয়মিত অনুশীলনের প্রশংসা রইল।', 'published', ?, 3, 2, ?, 1),
    (2, 1, 4, 45.00, 'মাদ্দ ও গুন্নাহ ভালো হয়েছে।', 'খুবই ভালো ফলাফল। মাখরাজ আরও কিছুটা শাণিত করতে হবে।', 'published', ?, 3, 2, ?, 1),
    (3, 2, 1, 28.00, 'মাসআলা সুন্দরভাবে বলতে পেরেছে।', NULL, 'draft', NULL, NULL, 2, ?, 1),
    (4, 2, 4, 27.00, 'ওযুর নিয়মাবলী নির্ভুল বলেছে।', NULL, 'draft', NULL, NULL, 2, ?, 1)
  `, [now, now, now, now, now, now]);

  // 13. Published Learner Progress Updates
  console.log('Seeding published progress updates...');
  await c.query(`INSERT INTO published_progress
    (id, enrollment_id, publisher_id, request_id, title, progress_summary, homework_summary, published_at)
    VALUES
    (1, 1, 3, 'req-pr-001', 'অক্টোবর মাসের সার্বিক পাঠ অগ্রগতি', 'আলহামদুলিল্লাহ, আনাস গত মাসে নূরানী কায়েদা সফলভাবে সম্পন্ন করে আমপারা শুরু করেছে। মাদ্দ ও গুন্নাহর উচ্চারণ অত্যন্ত সুন্দর হচ্ছে।', 'দৈনিক বাড়ির কাজ নিয়মিত সম্পন্ন করেছে। ক্লাসে শিক্ষকের পাঠ মনোযোগ দিয়ে গ্রহণ করছে।', ?),
    (2, 2, 3, 'req-pr-002', '১:১ হিফজ সান্ধ্যকালীন অগ্রগতি', '১ম পারার ৩য় পৃষ্ঠা পর্যন্ত সবক সম্পন্ন হয়েছে। মুখস্থ ও দোহর খুবই মজবুত।', 'নিয়মিত তিলাওয়াত অনুশীলন বজায় রাখছে।', ?)
  `, [now, now]);

  // 14. Notice Board & Announcements
  console.log('Seeding announcements...');
  await c.query(`INSERT INTO announcements
    (id, branch_id, department_id, batch_id, title, body, priority, created_by, created_at, expires_at, request_id)
    VALUES
    (1, 1, NULL, NULL, 'পবিত্র মাহে রমজান উপলক্ষে ক্লাস সময়সূচি সমন্বয় নোটিশ', 'আসসালামু আলাইকুম। সকল সম্মানিত অভিভাবক ও শিক্ষকবৃন্দের সদয় অবগতির জন্য জানানো যাচ্ছে যে, আসন্ন মাহে রমজান উপলক্ষে আগামী সপ্তাহ থেকে ক্লাসের সময়সূচিতে বিশেষ সমন্বয় আনা হবে। বিস্তারিত রুটিন শীঘ্রই ওয়েবসাইট ও নোটিশ বোর্ডে প্রকাশ করা হবে।', 'normal', 1, ?, '2026-12-31T23:59:59Z', 'req-an-001'),
    (2, 1, 1, 1, 'প্রথম সাময়িক মৌখিক মূল্যায়ন পরীক্ষার ফলাফল প্রকাশ প্রসঙ্গে', 'সম্মানিত অভিভাবকবৃন্দ, শিক্ষার্থীদের প্রথম সাময়িক মৌখিক মূল্যায়ন পরীক্ষার ফলাফল গার্ডিয়ান পোর্টালে প্রকাশ করা হয়েছে। অনুগ্রহ করে আপনার সন্তানের প্রগ্রেস কার্ড থেকে বিস্তারিত ফলাফল ও শিক্ষকের মন্তব্য দেখে নিন।', 'urgent', 3, ?, '2026-11-20T23:59:59Z', 'req-an-002')
  `, [now, now]);

  // 15. Course Resources
  console.log('Seeding course resources...');
  await c.query(`INSERT INTO course_resources
    (id, course_id, batch_id, title, url, category, description, created_by, created_at, request_id)
    VALUES
    (1, 1, 1, 'সহজ নূরানী তাজবীদ সহায়িকা গাইড (PDF)', 'https://iom.edu.bd/resources/tajweed-guide.pdf', 'document', 'নূরানী ও নাজেরা শিক্ষার্থীদের জন্য জরুরি মাখরাজ ও তাজবীদের সচিত্র নিয়ামাবলী গাইড।', 2, ?, 'req-rs-001'),
    (2, 1, 1, 'সূরা আল-ফাতিহা বিশুদ্ধ তিলাওয়াত অডিও মাশক', 'https://iom.edu.bd/resources/surah-fatiha-recitation.mp3', 'audio', 'ক্বারী মাওলানা আব্দুর রহমান কর্তৃক ধারণকৃত বিশুদ্ধ তিলাওয়াত অনুশীলন অডিও।', 2, ?, 'req-rs-002'),
    (3, 3, NULL, 'দৈনন্দিন জরুরি মাসনুন দোয়াসমূহ ও রেফারেন্স', 'https://iom.edu.bd/resources/daily-masnoon-duas', 'link', 'সকাল-সন্ধ্যার মাসনুন দোয়া, খাবারের আদব ও ওযুর নিয়মাবলী রেফারেন্স লিংক।', 1, ?, 'req-rs-003')
  `, [now, now, now]);

  // 16. External Payment References
  console.log('Seeding payment references...');
  await c.query(`INSERT INTO payment_references
    (id, enrollment_id, billing_month, reference_code, payment_status, portal_url, verified_at, notes, updated_by, updated_at)
    VALUES
    (1, 1, '2026-11', 'bKash-TXN984210983', 'paid', 'https://payment.iom.edu.bd/verify/bKash-TXN984210983', ?, 'নভেম্বর মাসের মাসিক টিউশন ফি পোর্টাল মারফত ভেরিফাইড।', 1, ?),
    (2, 3, '2026-11', 'Nagad-TXN761298412', 'paid', 'https://payment.iom.edu.bd/verify/Nagad-TXN761298412', ?, 'নভেম্বর মাসের মাসিক টিউশন ফি পোর্টাল মারফত ভেরিফাইড।', 1, ?),
    (3, 4, '2026-11', 'bKash-TXN551982736', 'pending_verification', NULL, NULL, 'অভিভাবক কর্তৃক সাবমিটকৃত ট্রানজ্যাকশন আইডি, পোর্টাল যাচাইয়ের অপেক্ষায় রয়েছে।', 1, ?)
  `, [now, now, now, now, now]);

  // 17. Student Leaves
  console.log('Seeding student leaves...');
  await c.query(`INSERT INTO student_leaves
    (id, enrollment_id, start_date, end_date, reason, status, revision, requested_by, submitted_at, request_id)
    VALUES
    (1, 1, '2026-11-12', '2026-11-14', 'পারিবারিক কারণে জরুরি সফর থাকায় ৩ দিন ক্লাসে উপস্থিত থাকা সম্ভব হবে না।', 'pending', 1, 4, ?, 'req-lv-001')
  `, [now]);

  // 18. Attendance Follow-up Case
  console.log('Seeding follow-up cases...');
  await c.query(`INSERT INTO followup_cases
    (id, enrollment_id, kind, source_key, assignee_id, status, cycle_kind, cycle, revision, created_at, origin_at, due_at, paused, remaining_ms, completed_at, closed_at, close_reason)
    VALUES
    (1, 4, 'streak', 'streak:4:1', 2, 'closed', 'first_seven', 1, 1, ?, ?, ?, 0, 0, ?, ?, 'স্বাভাবিক উপস্থিতিতে ফিরে এসেছে')
  `, [now, now, now, now, now]);

  await c.query(`INSERT INTO followup_notes
    (id, case_id, cycle, contact_date, guardian_statement, next_steps, note, author_id, request_id, at)
    VALUES
    (1, 1, 1, '2026-11-04', 'শিক্ষার্থী সাময়িক জ্বরে ভুগছিল, এখন সুস্থ রয়েছে।', 'আগামী ক্লাস থেকে নিয়মিত উপস্থিত থাকবে এবং ছুটির পড়া মেকআপ করবে।', 'অভিভাবকের সাথে কথা বলে আশ্বস্ত হওয়া গেছে।', 2, 'req-note-001', ?)
  `, [now]);

  // 19. Commercial 1:1 Packages, Contracts & Minute Ledger (AM-18, 5.2.1, 5.4.1)
  console.log('Seeding commercial 1:1 packages & contracts...');
  await c.query(`INSERT INTO one_to_one_packages
    (id, name, code, total_classes, total_minutes, fee_amount, currency, validity_days, active, created_at)
    VALUES
    (1, 'মাসিক ৮-ক্লাস সোলো (১:১ একক হিফজ ও নাজেরা)', 'SOLO-8', 8, 360, 5000.00, 'BDT', 30, 1, ?),
    (2, 'মাসিক ১২-ক্লাস ইনটেনসিভ (১:১ নিবিড় নাজেরা)', 'INTENSIVE-12', 12, 540, 7200.00, 'BDT', 30, 1, ?),
    (3, 'সাপ্তাহিক ২-ঘণ্টা ফ্লেক্সিবল (১:১ নমনীয় তাজবীদ)', 'FLEX-WEEKLY', 8, 480, 6500.00, 'BDT', 30, 1, ?)
  `, [now, now, now]);

  await c.query(`INSERT INTO one_to_one_contracts
    (id, enrollment_id, package_id, billing_period, status, allocated_minutes, used_minutes, remaining_minutes, fee_amount, currency, start_date, end_date, created_by, created_at)
    VALUES
    (1, 4, 1, '2026-11', 'active', 360, 90, 270, 5000.00, 'BDT', '2026-11-01', '2026-11-30', 1, ?)
  `, [now]);

  await c.query(`INSERT INTO package_minute_ledger
    (id, contract_id, class_session_id, entry_type, minutes, balance_after, recorded_by, recorded_at, notes)
    VALUES
    (1, 1, NULL, 'credit_allocation', 360, 360, 1, ?, 'Initial package allocation: মাসিক ৮-ক্লাস সোলো'),
    (2, 1, 2, 'class_deduction', -45, 315, 5, ?, 'Deduction for verified class #2'),
    (3, 1, 3, 'class_deduction', -45, 270, 5, ?, 'Deduction for verified class #3')
  `, [now, now, now]);

  // 20. Tuition Invoices (D-011, D-015, D-141)
  console.log('Seeding tuition invoices...');
  await c.query(`INSERT INTO tuition_invoices
    (id, enrollment_id, contract_id, invoice_number, billing_month, amount_due, amount_paid, due_date, status, payment_reference_code, notes, created_by, created_at)
    VALUES
    (1, 4, 1, 'INV-202611-4-1001', '2026-11', 5000.00, 5000.00, '2026-11-05', 'paid', 'TRX-BKASH-89214710', '১:১ প্যাকেজ ফি (নভেম্বর ২০২৬) - বিকাশ ভেরিফাইড', 1, ?),
    (2, 1, NULL, 'INV-202611-1-1002', '2026-11', 2500.00, 2500.00, '2026-11-05', 'paid', 'TRX-NAGAD-3829104', 'নূরানী কুরআন ব্যাচ মাসিক ফি - নগদ ভেরিফাইড', 1, ?),
    (3, 2, NULL, 'INV-202611-2-1003', '2026-11', 2500.00, 0.00, '2026-11-15', 'unpaid', NULL, 'নূরানী কুরআন ব্যাচ মাসিক ফি - বকেয়া', 1, ?)
  `, [now, now, now]);

  // 21. Teacher Payables (D-025, 7.2.1)
  console.log('Seeding teacher payables...');
  await c.query(`INSERT INTO teacher_payables
    (id, teacher_id, class_session_id, billing_month, conducted_minutes, hourly_rate, payable_amount, status, calculated_at)
    VALUES
    (1, 5, 2, '2026-11', 45, 400.00, 300.00, 'verified', ?),
    (2, 2, 1, '2026-11', 60, 350.00, 350.00, 'pending', ?)
  `, [now, now]);

  // 22. Update LOCAL-LOGIN.txt
  console.log('Updating LOCAL-LOGIN.txt...');
  const loginText = `IOM ACADEMY — LOCAL PREVIEW ACCOUNTS
URL: http://127.0.0.1:3020

Password for all accounts below: ${config.login}

1. Central Admin:
   Email: admin@academy.test
   Name: মুফতি জাহিদুল ইসলাম

2. Quran Teacher:
   Email: teacher@academy.test
   Name: মাওলানা ক্বারী আব্দুর রহমান

3. Hifz 1:1 Teacher:
   Email: teacher2@academy.test
   Name: হাফেজ মাওলানা মাহমুদ হাসান

4. Zimmadar (Academic In-charge & Student Care):
   Email: zimmadar@academy.test
   Name: মাওলানা আবু বকর সিদ্দিক

5. Primary Guardian (2 Students: মুহাম্মদ আনাস ইসলাম & মারিয়াম বিনতে রফিক):
   Email: guardian@academy.test
   Name: ইঞ্জিনিয়ার রফিকুল ইসলাম

6. Guardian 2 (1 Student: আব্দুল্লাহ আল মাহদী):
   Email: guardian2@academy.test
   Name: মো. কামরুল হাসান

7. Branch Admin:
   Email: branch_admin@academy.test
   Name: মাওলানা তানভীর আহমেদ
`;
  await fs.writeFile(path.join(local, 'LOCAL-LOGIN.txt'), loginText);

  console.log('==============================================');
  console.log('REALISTIC ACADEMY DATA SEEDING COMPLETE!');
  console.log('==============================================');
} finally {
  await c.end();
}
