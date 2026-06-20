-- Crown Wealth Advisor - Database Schema
-- Import this in phpMyAdmin (Hostinger) after creating your database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ===== USERS (admin panel accounts) =====
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner','admin','agent') NOT NULL DEFAULT 'admin',
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== LEADS =====
CREATE TABLE IF NOT EXISTS leads (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  mobile      VARCHAR(30)  DEFAULT '',
  email       VARCHAR(160) DEFAULT '',
  address     VARCHAR(255) DEFAULT '',
  city        VARCHAR(120) DEFAULT '',
  state       VARCHAR(100) DEFAULT '',
  pincode     VARCHAR(15)  DEFAULT '',
  service     VARCHAR(160) DEFAULT '',
  sub_service VARCHAR(160) DEFAULT '',
  message     TEXT,
  status      ENUM('new','contacted','follow_up','documents_pending','processing','approved','converted','closed','rejected') NOT NULL DEFAULT 'new',
  assigned_to VARCHAR(160) DEFAULT '',
  assigned_date DATETIME NULL,
  source      VARCHAR(120) DEFAULT 'website',
  next_follow_up DATE NULL,
  last_follow_up DATE NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (source), INDEX (created_at), INDEX (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== LEAD COMMENTS =====
CREATE TABLE IF NOT EXISTS lead_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lead_id    INT NOT NULL,
  text       TEXT NOT NULL,
  by_user    VARCHAR(160) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (lead_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== BLOGS =====
CREATE TABLE IF NOT EXISTS blogs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  topic_id        INT NULL,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) DEFAULT '',
  category        VARCHAR(80)  DEFAULT 'General',
  tags            VARCHAR(255) DEFAULT '',
  content         LONGTEXT,
  excerpt         VARCHAR(400) DEFAULT '',
  featured_image  VARCHAR(255) DEFAULT '',
  meta_description VARCHAR(300) DEFAULT '',
  author          VARCHAR(160) DEFAULT '',
  status          ENUM('draft','pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reject_reason   VARCHAR(400) DEFAULT '',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at     DATETIME NULL,
  INDEX (status), INDEX (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== BLOG TOPICS (Admin assigns -> Agent writes) =====
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

-- ===== ANNOUNCEMENTS =====
CREATE TABLE IF NOT EXISTS announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(160) DEFAULT '',
  message    VARCHAR(500) NOT NULL,
  type       VARCHAR(40)  DEFAULT 'info',
  link       VARCHAR(255) DEFAULT '',
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== SETTINGS (key-value) =====
CREATE TABLE IF NOT EXISTS settings (
  skey  VARCHAR(80) PRIMARY KEY,
  sval  TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== ACTIVITY LOG =====
CREATE TABLE IF NOT EXISTS activity_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  action     VARCHAR(255) NOT NULL,
  by_user    VARCHAR(160) DEFAULT 'system',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== SEED DATA =====
-- NOTE: The owner account is created by running api/install.php (it hashes the
-- password correctly for your PHP version). Default login after install:
--   Email:    support@crownwealthadvisor.com
--   Password: Crown@123   (change it after first login)

INSERT INTO announcements (title, message, type, active) VALUES
('Welcome', 'Get free financial consultation this month! Call +91-7428045423 for personalized insurance and loan guidance.', 'success', 1),
('Services', 'Now offering Loan Against Property advisory services. Compare options from multiple lenders.', 'info', 1),
('Hiring', 'We are hiring! Join us as a Bajaj or PNB MetLife insurance advisor. Apply now.', 'warning', 1);

INSERT INTO settings (skey, sval) VALUES
('auto_assign', '0'),
('email_notifications', '1'),
('whatsapp_notifications', '1')
ON DUPLICATE KEY UPDATE skey = skey;
