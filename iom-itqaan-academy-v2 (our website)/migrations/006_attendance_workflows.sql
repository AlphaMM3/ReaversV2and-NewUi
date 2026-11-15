-- Local-first attendance workflow candidate; explicit migration only.
CREATE TABLE attendance_revisions (
 id INT PRIMARY KEY AUTO_INCREMENT,attendance_id INT NOT NULL,old_status VARCHAR(20),new_status VARCHAR(20) NOT NULL,
 old_join_time VARCHAR(40),new_join_time VARCHAR(40),actor_id INT NOT NULL,approved_by INT,reason VARCHAR(2000) NOT NULL,
 request_id VARCHAR(80) NOT NULL,at VARCHAR(40) NOT NULL,
 UNIQUE(attendance_id,request_id),FOREIGN KEY(attendance_id) REFERENCES attendance(id),
 FOREIGN KEY(actor_id) REFERENCES users(id),FOREIGN KEY(approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE attendance_corrections (
 id INT PRIMARY KEY AUTO_INCREMENT,class_id INT NOT NULL,enrollment_id INT NOT NULL,attendance_id INT NOT NULL,
 expected_revision INT NOT NULL,new_status VARCHAR(20) NOT NULL,new_join_time VARCHAR(40),reason VARCHAR(2000) NOT NULL,
 requester_id INT NOT NULL,request_id VARCHAR(80) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',
 reviewer_id INT,review_reason VARCHAR(2000),created_at VARCHAR(40) NOT NULL,reviewed_at VARCHAR(40),
 UNIQUE(requester_id,request_id),INDEX idx_correction_state(status,id),
 FOREIGN KEY(class_id) REFERENCES class_sessions(id),FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 FOREIGN KEY(attendance_id) REFERENCES attendance(id),FOREIGN KEY(requester_id) REFERENCES users(id),FOREIGN KEY(reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE student_leaves (
 id INT PRIMARY KEY AUTO_INCREMENT,enrollment_id INT NOT NULL,start_date VARCHAR(10) NOT NULL,end_date VARCHAR(10) NOT NULL,
 reason VARCHAR(2000) NOT NULL,status VARCHAR(30) NOT NULL DEFAULT 'requested',extension_of INT,revision INT NOT NULL DEFAULT 1,
 requested_by INT NOT NULL,submitted_at VARCHAR(40) NOT NULL,reviewed_by INT,reviewed_at VARCHAR(40),review_reason VARCHAR(2000),
 returned_class_id INT,returned_at VARCHAR(40),request_id VARCHAR(80) NOT NULL,
 UNIQUE(requested_by,request_id),INDEX idx_leave_enrollment(enrollment_id,status,start_date,end_date),
 FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),FOREIGN KEY(extension_of) REFERENCES student_leaves(id),
 FOREIGN KEY(requested_by) REFERENCES users(id),FOREIGN KEY(reviewed_by) REFERENCES users(id),FOREIGN KEY(returned_class_id) REFERENCES class_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE student_leave_history (
 id INT PRIMARY KEY AUTO_INCREMENT,leave_id INT NOT NULL,revision INT NOT NULL,event VARCHAR(30) NOT NULL,
 details LONGTEXT NOT NULL,actor_id INT,at VARCHAR(40) NOT NULL,
 FOREIGN KEY(leave_id) REFERENCES student_leaves(id),FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE attendance_projections (
 enrollment_id INT PRIMARY KEY,facts_hash VARCHAR(64) NOT NULL,data_json LONGTEXT NOT NULL,revision INT NOT NULL DEFAULT 1,
 low_warning_at VARCHAR(40),next_repeat_at VARCHAR(40),calculated_at VARCHAR(40) NOT NULL,
 FOREIGN KEY(enrollment_id) REFERENCES enrollments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE followup_cases (
 id INT PRIMARY KEY AUTO_INCREMENT,enrollment_id INT NOT NULL,kind VARCHAR(30) NOT NULL,source_key VARCHAR(120) NOT NULL,
 calculation_month VARCHAR(7),source_class_id INT,assignee_id INT NOT NULL,parent_case_id INT,
 status VARCHAR(20) NOT NULL DEFAULT 'pending',cycle_kind VARCHAR(20) NOT NULL DEFAULT 'initial',cycle INT NOT NULL DEFAULT 1,
 revision INT NOT NULL DEFAULT 1,reopen_count INT NOT NULL DEFAULT 0,created_at VARCHAR(40) NOT NULL,origin_at VARCHAR(40) NOT NULL,
 due_at VARCHAR(40),escalation_at VARCHAR(40),management_at VARCHAR(40),deadline_version INT NOT NULL DEFAULT 1,
 paused INT NOT NULL DEFAULT 0,remaining_ms BIGINT,completed_at VARCHAR(40),closed_at VARCHAR(40),close_reason VARCHAR(150),
 note_submitted_at VARCHAR(40),review_needed INT NOT NULL DEFAULT 0,
 UNIQUE(enrollment_id,kind,source_key),INDEX idx_followup_queue(status,assignee_id,due_at),
 FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),FOREIGN KEY(source_class_id) REFERENCES class_sessions(id),
 FOREIGN KEY(assignee_id) REFERENCES users(id),FOREIGN KEY(parent_case_id) REFERENCES followup_cases(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE followup_notes (
 id INT PRIMARY KEY AUTO_INCREMENT,case_id INT NOT NULL,cycle INT NOT NULL,contact_date VARCHAR(10) NOT NULL,
 guardian_statement TEXT NOT NULL,next_steps TEXT NOT NULL,note TEXT NOT NULL,author_id INT NOT NULL,approved_by INT,request_id VARCHAR(80) NOT NULL,at VARCHAR(40) NOT NULL,
 UNIQUE(author_id,request_id),
 FOREIGN KEY(case_id) REFERENCES followup_cases(id),FOREIGN KEY(author_id) REFERENCES users(id),FOREIGN KEY(approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE followup_requests (
 id INT PRIMARY KEY AUTO_INCREMENT,case_id INT NOT NULL,kind VARCHAR(30) NOT NULL,expected_revision INT NOT NULL,payload LONGTEXT NOT NULL,
 requested_by INT NOT NULL,request_id VARCHAR(80) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',
 reviewed_by INT,review_reason VARCHAR(2000),created_at VARCHAR(40) NOT NULL,reviewed_at VARCHAR(40),
 UNIQUE(requested_by,request_id),FOREIGN KEY(case_id) REFERENCES followup_cases(id),
 FOREIGN KEY(requested_by) REFERENCES users(id),FOREIGN KEY(reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE followup_events (
 id INT PRIMARY KEY AUTO_INCREMENT,case_id INT NOT NULL,event VARCHAR(40) NOT NULL,event_key VARCHAR(150),details LONGTEXT NOT NULL,actor_id INT,at VARCHAR(40) NOT NULL,
 UNIQUE(case_id,event_key),
 FOREIGN KEY(case_id) REFERENCES followup_cases(id),FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE workflow_notifications (
 id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,event_key VARCHAR(190) NOT NULL,enrollment_id INT NOT NULL,case_id INT,
 route VARCHAR(30) NOT NULL,stage VARCHAR(40) NOT NULL,title VARCHAR(255) NOT NULL,channel VARCHAR(20) NOT NULL,
 status VARCHAR(20) NOT NULL,next_attempt_at VARCHAR(40),attempt_count INT NOT NULL DEFAULT 0,attempted_at VARCHAR(40),
 created_at VARCHAR(40) NOT NULL,delivered_at VARCHAR(40),read_at VARCHAR(40),error_code VARCHAR(60),provider_message_id VARCHAR(80),
 UNIQUE(user_id,event_key,channel),INDEX idx_workflow_delivery(channel,status,next_attempt_at),
 FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),FOREIGN KEY(case_id) REFERENCES followup_cases(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE telegram_connections (
 user_id INT PRIMARY KEY,chat_id VARCHAR(40) NOT NULL UNIQUE,linked_at VARCHAR(40) NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE telegram_link_tokens (
 token_hash VARCHAR(64) PRIMARY KEY,user_id INT NOT NULL,expires_at VARCHAR(40) NOT NULL,used_at VARCHAR(40),
 FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE absence_escalations (
 id INT PRIMARY KEY AUTO_INCREMENT,enrollment_id INT NOT NULL,episode_key VARCHAR(120) NOT NULL,first_case_id INT NOT NULL,
 threshold_class_id INT NOT NULL,active INT NOT NULL DEFAULT 1,created_at VARCHAR(40) NOT NULL,
 UNIQUE(enrollment_id,episode_key),FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
 FOREIGN KEY(first_case_id) REFERENCES followup_cases(id),FOREIGN KEY(threshold_class_id) REFERENCES class_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
