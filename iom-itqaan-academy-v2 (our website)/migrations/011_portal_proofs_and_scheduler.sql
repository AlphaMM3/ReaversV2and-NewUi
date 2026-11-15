-- Migration 011: Guardian bKash/Nagad Payment Proof Submissions & Auto-Reminder Dispatches

CREATE TABLE guardian_payment_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  student_id INT NULL,
  submitted_by INT NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  trx_id VARCHAR(80) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  sender_number VARCHAR(30) NULL,
  screenshot_data LONGTEXT NULL,
  notes VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  review_note VARCHAR(500) NULL,
  created_at VARCHAR(40) NOT NULL,
  reviewed_at VARCHAR(40) NULL,
  INDEX idx_gps_invoice(invoice_id, status),
  INDEX idx_gps_submitter(submitted_by, created_at),
  INDEX idx_gps_status(status),
  FOREIGN KEY(invoice_id) REFERENCES tuition_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY(submitted_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auto_reminder_dispatches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dispatch_key VARCHAR(160) NOT NULL UNIQUE,
  rule_id VARCHAR(64) NOT NULL,
  channel VARCHAR(30) NOT NULL,
  target VARCHAR(180) NOT NULL,
  message_body TEXT NOT NULL,
  status VARCHAR(25) NOT NULL,
  http_status INT NULL,
  error_text VARCHAR(500) NULL,
  sent_at VARCHAR(40) NOT NULL,
  INDEX idx_ard_sent_at(sent_at),
  INDEX idx_ard_rule(rule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

