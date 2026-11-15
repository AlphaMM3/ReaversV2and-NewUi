-- Additive learning records migration: Homework and Assessments.
CREATE TABLE homework (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id INT NOT NULL,
  enrollment_id INT,
  class_id INT,
  title VARCHAR(150) NOT NULL,
  instructions TEXT NOT NULL,
  due_date VARCHAR(10) NOT NULL,
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  request_id VARCHAR(80) NOT NULL,
  UNIQUE(created_by, request_id),
  INDEX idx_hw_batch(batch_id, due_date),
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(class_id) REFERENCES class_sessions(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_homework (
  id INT PRIMARY KEY AUTO_INCREMENT,
  homework_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'assigned',
  teacher_feedback TEXT,
  feedback_at VARCHAR(40),
  completed_at VARCHAR(40),
  updated_by INT,
  updated_at VARCHAR(40),
  revision INT NOT NULL DEFAULT 1,
  UNIQUE(homework_id, enrollment_id),
  INDEX idx_sh_enrollment(enrollment_id, status),
  FOREIGN KEY(homework_id) REFERENCES homework(id),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  assessment_type VARCHAR(30) NOT NULL DEFAULT 'oral_practical',
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  pass_marks DECIMAL(5,2),
  assessment_date VARCHAR(10) NOT NULL,
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  request_id VARCHAR(80) NOT NULL,
  UNIQUE(created_by, request_id),
  INDEX idx_assess_batch(batch_id, assessment_date),
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessment_marks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assessment_id INT NOT NULL,
  enrollment_id INT NOT NULL,
  obtained_marks DECIMAL(5,2) NOT NULL,
  teacher_remarks TEXT,
  guardian_feedback TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at VARCHAR(40),
  published_by INT,
  recorded_by INT NOT NULL,
  recorded_at VARCHAR(40) NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  UNIQUE(assessment_id, enrollment_id),
  INDEX idx_marks_enrollment(enrollment_id, status),
  FOREIGN KEY(assessment_id) REFERENCES assessments(id),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(published_by) REFERENCES users(id),
  FOREIGN KEY(recorded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessment_mark_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mark_id INT NOT NULL,
  revision INT NOT NULL,
  old_marks DECIMAL(5,2),
  new_marks DECIMAL(5,2) NOT NULL,
  reason VARCHAR(2000) NOT NULL,
  actor_id INT NOT NULL,
  at VARCHAR(40) NOT NULL,
  INDEX idx_amh_mark(mark_id, revision),
  FOREIGN KEY(mark_id) REFERENCES assessment_marks(id),
  FOREIGN KEY(actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

