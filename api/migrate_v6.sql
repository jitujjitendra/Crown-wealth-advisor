-- Migration v6: Homepage Promotions system
-- Run ONCE in phpMyAdmin (SQL tab) on an existing installation.

CREATE TABLE IF NOT EXISTS promotions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description VARCHAR(400) DEFAULT '',
  button_text VARCHAR(80) DEFAULT 'Learn More',
  button_link VARCHAR(255) DEFAULT '#',
  type        ENUM('service','offer','blog','hiring','general') NOT NULL DEFAULT 'general',
  image       VARCHAR(255) DEFAULT '',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  priority    INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (active), INDEX (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: default promotion for claim support
INSERT INTO promotions (title, description, button_text, button_link, type, active, priority) VALUES
('Insurance Claim Issues?', 'Get expert help for rejected, delayed, or short-settled claims. Rs. 499 consultation.', 'Get Help Now', 'pages/claim-support.html', 'service', 1, 1),
('We Are Hiring!', 'Join as Bajaj Allianz or PNB MetLife insurance advisor. Flexible work, attractive income.', 'Apply Now', 'pages/bajaj-careers.html', 'hiring', 1, 2),
('Financial Blog', 'Read latest articles on insurance, loans, and smart money management.', 'Read Blog', 'pages/blog.html', 'blog', 1, 3);
