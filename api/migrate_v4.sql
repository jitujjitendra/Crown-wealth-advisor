-- Migration v4: Customer Support Tickets module
-- Run ONCE in phpMyAdmin (SQL tab) on an existing installation.

CREATE TABLE IF NOT EXISTS support_tickets (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(160) NOT NULL,
  mobile            VARCHAR(30)  DEFAULT '',
  email             VARCHAR(160) DEFAULT '',
  insurance_company VARCHAR(160) DEFAULT '',
  policy_number     VARCHAR(120) DEFAULT '',
  issue_type        VARCHAR(120) DEFAULT '',
  description       TEXT,
  status            ENUM('new','assigned','under_review','documents_required','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  assigned_to       VARCHAR(160) DEFAULT '',
  assigned_date     DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (assigned_to), INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT NOT NULL,
  text       TEXT NOT NULL,
  by_user    VARCHAR(160) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (ticket_id),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
