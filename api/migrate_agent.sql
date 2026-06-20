-- Migration: add the 'agent' role to existing installations.
-- Run this ONCE in phpMyAdmin (SQL tab) if you already imported schema.sql earlier.

ALTER TABLE users
  MODIFY role ENUM('owner','admin','agent') NOT NULL DEFAULT 'admin';
