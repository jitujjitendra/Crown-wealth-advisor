-- Migration v3: expanded lead fields, new statuses, blog topics
-- Run ONCE in phpMyAdmin (SQL tab) on an existing installation.

-- 1) New lead columns
ALTER TABLE leads
  ADD COLUMN address VARCHAR(255) DEFAULT '' AFTER email,
  ADD COLUMN state VARCHAR(100) DEFAULT '' AFTER city,
  ADD COLUMN pincode VARCHAR(15) DEFAULT '' AFTER state,
  ADD COLUMN sub_service VARCHAR(160) DEFAULT '' AFTER service,
  ADD COLUMN assigned_date DATETIME NULL AFTER assigned_to,
  ADD COLUMN next_follow_up DATE NULL AFTER source,
  ADD COLUMN last_follow_up DATE NULL AFTER next_follow_up;

-- 2) Carry over any existing follow_up_date into next_follow_up (ignore error if column absent)
UPDATE leads SET next_follow_up = follow_up_date WHERE follow_up_date IS NOT NULL;

-- 3) Map old statuses to the new set, then widen the enum
UPDATE leads SET status = 'converted' WHERE status = 'success';
UPDATE leads SET status = 'processing' WHERE status = 'wip';

ALTER TABLE leads
  MODIFY status ENUM('new','contacted','follow_up','documents_pending','processing','approved','converted','closed','rejected')
  NOT NULL DEFAULT 'new';

-- 4) Blog topics (Admin assigns a topic -> Agent writes)
CREATE TABLE IF NOT EXISTS blog_topics (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  brief       TEXT,
  assigned_to VARCHAR(160) DEFAULT '',
  status      ENUM('assigned','in_progress','submitted','done') NOT NULL DEFAULT 'assigned',
  blog_id     INT NULL,
  created_by  VARCHAR(160) DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (assigned_to), INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) Link a blog back to its topic (optional)
ALTER TABLE blogs ADD COLUMN topic_id INT NULL AFTER id;
