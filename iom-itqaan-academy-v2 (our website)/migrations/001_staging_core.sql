-- Additive schema for a NEW dedicated staging database only. Never import legacy data.


CREATE TABLE IF NOT EXISTS branches (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS users (
 id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) NOT NULL UNIQUE,
 name VARCHAR(255) NOT NULL, role VARCHAR(255) NOT NULL CHECK(role IN ('central_admin','branch_admin','zimmadar','teacher','guardian_primary','guardian_secondary')),
 branch_id INT, password_salt VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL,
 active INT NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at VARCHAR(255) NOT NULL
,
 FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash VARCHAR(64) PRIMARY KEY, user_id INT NOT NULL,
 csrf VARCHAR(255) NOT NULL, expires_at VARCHAR(255) NOT NULL
,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS families (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, branch_id INT NOT NULL,
 FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS family_guardians (
 family_id INT NOT NULL, user_id INT NOT NULL,
 PRIMARY KEY(family_id,user_id)
,
 FOREIGN KEY (family_id) REFERENCES families(id),
 FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS students (
 id INT PRIMARY KEY AUTO_INCREMENT, full_name VARCHAR(255) NOT NULL, branch_id INT NOT NULL,
 family_id INT NOT NULL, created_at VARCHAR(255) NOT NULL
,
 FOREIGN KEY (branch_id) REFERENCES branches(id),
 FOREIGN KEY (family_id) REFERENCES families(id),
 INDEX idx_students_family (family_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS departments (
 id INT PRIMARY KEY AUTO_INCREMENT, branch_id INT NOT NULL, name VARCHAR(255) NOT NULL,
 category VARCHAR(255) NOT NULL CHECK(category IN ('regular','single_course','other')),
 UNIQUE(branch_id,name)
,
 FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS courses (
 id INT PRIMARY KEY AUTO_INCREMENT, department_id INT NOT NULL,
 title VARCHAR(255) NOT NULL, duration_type VARCHAR(255) NOT NULL CHECK(duration_type IN ('fixed','continuous')),
 UNIQUE(department_id,title)
,
 FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS batches (
 id INT PRIMARY KEY AUTO_INCREMENT, course_id INT NOT NULL, label VARCHAR(255) NOT NULL,
 delivery_mode VARCHAR(255) NOT NULL CHECK(delivery_mode IN ('group','one_to_one')),
 zimmadar_id INT, teacher_id INT,
 UNIQUE(course_id,label)
,
 FOREIGN KEY (course_id) REFERENCES courses(id),
 FOREIGN KEY (zimmadar_id) REFERENCES users(id),
 FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS enrollments (
 id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL,
 batch_id INT NOT NULL, start_date VARCHAR(255) NOT NULL, end_date VARCHAR(255),
 status VARCHAR(255) NOT NULL DEFAULT 'active' CHECK(status IN ('active','on_hold','withdrawn','completed','inactive')),
 UNIQUE(student_id,batch_id,start_date)
,
 FOREIGN KEY (student_id) REFERENCES students(id),
 FOREIGN KEY (batch_id) REFERENCES batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS class_sessions (
 id INT PRIMARY KEY AUTO_INCREMENT, batch_id INT NOT NULL,
 scheduled_start VARCHAR(255) NOT NULL, scheduled_end VARCHAR(255) NOT NULL,
 actual_start VARCHAR(255), actual_end VARCHAR(255),
 status VARCHAR(255) NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','ended','cancelled')),
 held_verified INT NOT NULL DEFAULT 0 CHECK(held_verified IN (0,1)),
 actual_teacher_id INT, meeting_url TEXT
,
 FOREIGN KEY (batch_id) REFERENCES batches(id),
 FOREIGN KEY (actual_teacher_id) REFERENCES users(id),
 INDEX idx_classes_batch (batch_id, scheduled_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS attendance (
 id INT PRIMARY KEY AUTO_INCREMENT, class_id INT NOT NULL,
 enrollment_id INT NOT NULL,
 status VARCHAR(255) NOT NULL CHECK(status IN ('Present','Absent','Late')),
 join_time VARCHAR(255), verified_by INT NOT NULL, verified_at VARCHAR(255) NOT NULL,
 UNIQUE(class_id,enrollment_id)
,
 FOREIGN KEY (class_id) REFERENCES class_sessions(id),
 FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
 FOREIGN KEY (verified_by) REFERENCES users(id),
 INDEX idx_attendance_enrollment (enrollment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS reports (
 id INT PRIMARY KEY AUTO_INCREMENT, class_id INT NOT NULL UNIQUE REFERENCES class_sessions(id),
 author_id INT NOT NULL,
 body TEXT NOT NULL, status VARCHAR(255) NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','submitted','returned','approved')),
 first_submitted_at VARCHAR(255), current_submitted_at VARCHAR(255),
 review_reason TEXT, reviewer_id INT, reviewed_at VARCHAR(255),
 revision INT NOT NULL DEFAULT 1, updated_at VARCHAR(255) NOT NULL
,
 FOREIGN KEY (author_id) REFERENCES users(id),
 FOREIGN KEY (reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS report_revisions (
 id INT PRIMARY KEY AUTO_INCREMENT, report_id INT NOT NULL,
 revision INT NOT NULL, body TEXT NOT NULL, event VARCHAR(255) NOT NULL,
 actor_id INT NOT NULL, at VARCHAR(255) NOT NULL
,
 FOREIGN KEY (report_id) REFERENCES reports(id),
 FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS audit_events (
 id INT PRIMARY KEY AUTO_INCREMENT, at VARCHAR(255) NOT NULL, actor_id INT,
 action VARCHAR(255) NOT NULL, entity VARCHAR(255) NOT NULL, entity_id INT NOT NULL,
 details LONGTEXT NOT NULL
,
 FOREIGN KEY (actor_id) REFERENCES users(id),
 INDEX idx_audit_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- v0.2 additive-only, no existing table or row modification.
CREATE TABLE IF NOT EXISTS report_alert_events (
 id INT PRIMARY KEY AUTO_INCREMENT,
 class_id INT NOT NULL,
 due_at VARCHAR(255) NOT NULL,
 stage VARCHAR(255) NOT NULL CHECK(stage IN ('teacher','zimmadar','supervisor','management')),
 scheduled_at VARCHAR(255) NOT NULL,
 created_at VARCHAR(255) NOT NULL,
 target_user_id INT,
 delivery_status VARCHAR(255) NOT NULL CHECK(delivery_status IN ('in_app_queue','unassigned')),
 UNIQUE(class_id,stage,due_at)
,
 FOREIGN KEY (class_id) REFERENCES class_sessions(id),
 FOREIGN KEY (target_user_id) REFERENCES users(id),
 INDEX idx_report_alerts_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





