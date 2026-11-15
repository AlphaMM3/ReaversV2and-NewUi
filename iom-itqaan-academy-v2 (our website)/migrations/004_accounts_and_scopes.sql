-- Additive account lifecycle and approved role-switch scope. No legacy data import.
ALTER TABLE users ADD COLUMN department_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id);
CREATE TABLE IF NOT EXISTS user_role_assignments (
 id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,role VARCHAR(40) NOT NULL,
 branch_id INT,department_id INT,scope_key VARCHAR(120) NOT NULL,active INT NOT NULL DEFAULT 1,
 created_at VARCHAR(40) NOT NULL,
 CONSTRAINT uq_user_role_scope UNIQUE(user_id,scope_key),
 CONSTRAINT chk_assignment_role CHECK(role IN ('central_admin','branch_admin','teacher','zimmadar','department_supervisor')),
 CONSTRAINT chk_assignment_active CHECK(active IN (0,1)),
 FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(branch_id) REFERENCES branches(id),FOREIGN KEY(department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS session_role_bindings (
 token_hash VARCHAR(64) PRIMARY KEY,assignment_id INT NOT NULL,
 FOREIGN KEY(token_hash) REFERENCES auth_sessions(token_hash) ON DELETE CASCADE,
 FOREIGN KEY(assignment_id) REFERENCES user_role_assignments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS password_reset_tokens (
 token_hash VARCHAR(64) PRIMARY KEY,user_id INT NOT NULL,issued_by INT NOT NULL,
 expires_at VARCHAR(40) NOT NULL,used_at VARCHAR(40),created_at VARCHAR(40) NOT NULL,
 INDEX idx_reset_user(user_id,expires_at),
 FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(issued_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS login_throttles (
 bucket VARCHAR(64) PRIMARY KEY,attempts INT NOT NULL,expires_ms BIGINT NOT NULL,
 INDEX idx_throttle_expiry(expires_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_enrollment_batch_status ON enrollments(batch_id,status,start_date,end_date);
CREATE INDEX idx_class_batch_date ON class_sessions(batch_id,scheduled_start,status,held_verified);
CREATE INDEX idx_report_updated ON reports(updated_at,id);
CREATE INDEX idx_audit_at_id ON audit_events(at,id);
CREATE INDEX idx_session_expiry ON auth_sessions(expires_at);
