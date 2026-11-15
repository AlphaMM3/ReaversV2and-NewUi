-- Migration 009: Commercial 1:1 Packages, Minute Ledger, Tuition Invoices & Teacher Payables (AM-18, D-011, D-015, D-141)

CREATE TABLE one_to_one_packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  total_classes INT NOT NULL,
  total_minutes INT NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  validity_days INT NOT NULL DEFAULT 30,
  active TINYINT NOT NULL DEFAULT 1,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_pkg_active(active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE one_to_one_contracts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  package_id INT NOT NULL,
  billing_period VARCHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  allocated_minutes INT NOT NULL,
  used_minutes INT NOT NULL DEFAULT 0,
  remaining_minutes INT NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10) NOT NULL,
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_contract_enrollment(enrollment_id, billing_period),
  INDEX idx_contract_status(status),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(package_id) REFERENCES one_to_one_packages(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE package_minute_ledger (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contract_id INT NOT NULL,
  class_session_id INT,
  entry_type VARCHAR(30) NOT NULL,
  minutes INT NOT NULL,
  balance_after INT NOT NULL,
  recorded_by INT NOT NULL,
  recorded_at VARCHAR(40) NOT NULL,
  notes VARCHAR(500),
  INDEX idx_ledger_contract(contract_id),
  INDEX idx_ledger_class(class_session_id),
  FOREIGN KEY(contract_id) REFERENCES one_to_one_contracts(id),
  FOREIGN KEY(class_session_id) REFERENCES class_sessions(id),
  FOREIGN KEY(recorded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tuition_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  contract_id INT,
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  billing_month VARCHAR(7) NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  due_date VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  payment_reference_code VARCHAR(80),
  notes VARCHAR(500),
  created_by INT NOT NULL,
  created_at VARCHAR(40) NOT NULL,
  INDEX idx_inv_enrollment(enrollment_id, billing_month),
  INDEX idx_inv_status(status),
  FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
  FOREIGN KEY(contract_id) REFERENCES one_to_one_contracts(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_payables (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  class_session_id INT NOT NULL UNIQUE,
  billing_month VARCHAR(7) NOT NULL,
  conducted_minutes INT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  payable_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  calculated_at VARCHAR(40) NOT NULL,
  INDEX idx_tp_teacher(teacher_id, billing_month),
  INDEX idx_tp_status(status),
  FOREIGN KEY(teacher_id) REFERENCES users(id),
  FOREIGN KEY(class_session_id) REFERENCES class_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
