-- Additive support and finance reference views: Payments reference, Announcements & Support, Course Resources.
CREATE TABLE payment_references (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  billing_month VARCHAR(7) NOT NULL,
  reference_code VARCHAR(80),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  portal_url VARCHAR(500),
  verified_at VARCHAR(40),
  notes VARCHAR(1000),
  updated_by INT NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  UNIQUE(enrollment_id, billing_month),
  INDEX idx_payref_status(payment_status, billing_month),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  department_id INT,
  batch_id INT,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  expires_at VARCHAR(40),
  request_id VARCHAR(80) NOT NULL,
  UNIQUE(created_by, request_id),
  INDEX idx_ann_scope(branch_id, department_id, batch_id),
  FOREIGN KEY(branch_id) REFERENCES branches(id),
  FOREIGN KEY(department_id) REFERENCES departments(id),
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  batch_id INT,
  title VARCHAR(150) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'material',
  description TEXT,
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  request_id VARCHAR(80) NOT NULL,
  UNIQUE(created_by, request_id),
  INDEX idx_res_course(course_id, batch_id),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  FOREIGN KEY(batch_id) REFERENCES batches(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

