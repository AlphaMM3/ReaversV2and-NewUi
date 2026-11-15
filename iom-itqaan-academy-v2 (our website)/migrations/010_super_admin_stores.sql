CREATE TABLE super_admin_stores (
  store_key VARCHAR(120) PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_by INT NULL,
  updated_at VARCHAR(40) NOT NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
