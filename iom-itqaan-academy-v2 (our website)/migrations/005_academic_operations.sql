-- Additive V1 operations. Never apply to legacy systems.
CREATE TABLE academic_sessions (
 id INT PRIMARY KEY AUTO_INCREMENT,branch_id INT NOT NULL,label VARCHAR(150) NOT NULL,
 start_date VARCHAR(10) NOT NULL,end_date VARCHAR(10) NOT NULL,
 UNIQUE(branch_id,label),FOREIGN KEY(branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE courses ADD COLUMN start_date VARCHAR(10) NULL, ADD COLUMN end_date VARCHAR(10) NULL;
ALTER TABLE batches ADD COLUMN start_date VARCHAR(10) NULL, ADD COLUMN end_date VARCHAR(10) NULL, ADD COLUMN academic_session_id INT NULL, ADD CONSTRAINT fk_batch_academic_session FOREIGN KEY(academic_session_id) REFERENCES academic_sessions(id);
CREATE TABLE admission_applications (
 id INT PRIMARY KEY AUTO_INCREMENT,family_id INT NOT NULL,student_id INT NULL,course_id INT NOT NULL,
 student_name VARCHAR(150) NOT NULL,birth_date VARCHAR(10) NOT NULL,academic_level VARCHAR(150) NOT NULL,
 contact_phone VARCHAR(80) NOT NULL,country VARCHAR(100) NOT NULL,method VARCHAR(20) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'submitted',revision INT NOT NULL DEFAULT 1,
 assessment_note TEXT,placement_note TEXT,review_reason TEXT,enrollment_id INT NULL,
 request_id VARCHAR(80) NOT NULL,created_by INT NOT NULL,reviewed_by INT NULL,created_at VARCHAR(40) NOT NULL,updated_at VARCHAR(40) NOT NULL,
 UNIQUE(created_by,request_id),INDEX idx_admission_course_status(course_id,status,id),
 FOREIGN KEY(family_id) REFERENCES families(id),FOREIGN KEY(student_id) REFERENCES students(id),
 FOREIGN KEY(course_id) REFERENCES courses(id),FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 FOREIGN KEY(created_by) REFERENCES users(id),FOREIGN KEY(reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE batch_assignment_history (
 id INT PRIMARY KEY AUTO_INCREMENT,batch_id INT NOT NULL,old_teacher_id INT,new_teacher_id INT,
 old_zimmadar_id INT,new_zimmadar_id INT,reason VARCHAR(2000) NOT NULL,actor_id INT NOT NULL,at VARCHAR(40) NOT NULL,
 FOREIGN KEY(batch_id) REFERENCES batches(id),FOREIGN KEY(old_teacher_id) REFERENCES users(id),FOREIGN KEY(new_teacher_id) REFERENCES users(id),
 FOREIGN KEY(old_zimmadar_id) REFERENCES users(id),FOREIGN KEY(new_zimmadar_id) REFERENCES users(id),FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE weekly_routines (
 id INT PRIMARY KEY AUTO_INCREMENT,batch_id INT NOT NULL,weekday INT NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 start_time VARCHAR(5) NOT NULL,end_time VARCHAR(5) NOT NULL,from_date VARCHAR(10) NOT NULL,until_date VARCHAR(10) NOT NULL,
 meeting_url TEXT,active INT NOT NULL DEFAULT 1 CHECK(active IN (0,1)),created_by INT NOT NULL,created_at VARCHAR(40) NOT NULL,
 FOREIGN KEY(batch_id) REFERENCES batches(id),FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE class_sessions ADD COLUMN routine_id INT NULL, ADD COLUMN routine_occurrence VARCHAR(40) NULL, ADD COLUMN schedule_revision INT NOT NULL DEFAULT 0, ADD CONSTRAINT fk_class_routine FOREIGN KEY(routine_id) REFERENCES weekly_routines(id), ADD CONSTRAINT uq_routine_occurrence UNIQUE(routine_id,routine_occurrence);
CREATE TABLE class_schedule_events (
 id INT PRIMARY KEY AUTO_INCREMENT,class_id INT NOT NULL,action VARCHAR(30) NOT NULL,before_state TEXT NOT NULL,after_state TEXT NOT NULL,
 reason VARCHAR(2000) NOT NULL,actor_id INT NOT NULL,at VARCHAR(40) NOT NULL,
 FOREIGN KEY(class_id) REFERENCES class_sessions(id),FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE course_report_templates (
 id INT PRIMARY KEY AUTO_INCREMENT,course_id INT NOT NULL,version INT NOT NULL,prompt TEXT NOT NULL,created_by INT NOT NULL,created_at VARCHAR(40) NOT NULL,
 UNIQUE(course_id,version),FOREIGN KEY(course_id) REFERENCES courses(id),FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE report_template_bindings (
 report_id INT PRIMARY KEY,template_id INT NOT NULL,
 FOREIGN KEY(report_id) REFERENCES reports(id),FOREIGN KEY(template_id) REFERENCES course_report_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE enrollment_status_history (
 id INT PRIMARY KEY AUTO_INCREMENT,enrollment_id INT NOT NULL,from_status VARCHAR(20) NOT NULL,to_status VARCHAR(20) NOT NULL,
 previous_end_date VARCHAR(10),end_date VARCHAR(10),reason VARCHAR(2000) NOT NULL,actor_id INT NOT NULL,at VARCHAR(40) NOT NULL,
 FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_class_teacher_start ON class_sessions(actual_teacher_id,scheduled_start,status);
