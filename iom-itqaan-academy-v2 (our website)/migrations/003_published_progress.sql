-- Additive learner-specific publications. Internal reports/notes are never copied.
CREATE TABLE published_progress (
 id INT PRIMARY KEY AUTO_INCREMENT,
 enrollment_id INT NOT NULL,
 publisher_id INT NOT NULL,
 request_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 title VARCHAR(150) NOT NULL,
 progress_summary TEXT NOT NULL,
 homework_summary TEXT NOT NULL,
 published_at VARCHAR(40) NOT NULL,
 UNIQUE(publisher_id,request_id),
 FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
 FOREIGN KEY (publisher_id) REFERENCES users(id),
 INDEX idx_progress_enrollment (enrollment_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
