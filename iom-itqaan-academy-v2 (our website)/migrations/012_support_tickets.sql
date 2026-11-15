CREATE TABLE support_tickets (
 id INT AUTO_INCREMENT PRIMARY KEY,
 owner_id INT NOT NULL,
 branch_id INT NULL,
 department_id INT NULL,
 target_role VARCHAR(32) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'open',
 payload JSON NOT NULL,
 created_at VARCHAR(40) NOT NULL,
 updated_at VARCHAR(40) NOT NULL,
 FOREIGN KEY(owner_id) REFERENCES users(id)
);
CREATE TABLE support_replies (
 id INT AUTO_INCREMENT PRIMARY KEY,
 ticket_id INT NOT NULL,
 payload JSON NOT NULL,
 FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
);
