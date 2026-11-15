-- Additive correction for MySQL 8, which ignores the inline REFERENCES in 001.
-- The runner checks for an equivalent enforced FK first (MariaDB may already have it).
-- Orphan reports cause this statement to fail; no records are deleted or rewritten.
ALTER TABLE reports ADD CONSTRAINT fk_reports_class
  FOREIGN KEY (class_id) REFERENCES class_sessions(id);
