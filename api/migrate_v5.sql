-- Migration v5: support ticket attachment
-- Run ONCE in phpMyAdmin (SQL tab) on an existing installation.

ALTER TABLE support_tickets
  ADD COLUMN attachment VARCHAR(255) DEFAULT '' AFTER description;
