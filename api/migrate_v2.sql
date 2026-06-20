-- Migration v2: roles + follow-up date
-- Run ONCE in phpMyAdmin (SQL tab) on an existing installation.

-- 1) Allow the 'agent' role (safe to re-run)
ALTER TABLE users
  MODIFY role ENUM('owner','admin','agent') NOT NULL DEFAULT 'admin';

-- 2) Follow-up date on leads (agents/admins set this)
ALTER TABLE leads
  ADD COLUMN follow_up_date DATE NULL AFTER source;
