<?php
/**
 * Crown Wealth Advisor - Database Configuration
 *
 * IMPORTANT (Hostinger setup):
 * 1. In hPanel go to Databases > MySQL Databases
 * 2. Create a database + user, note the name/user/password
 * 3. Fill the values below
 * 4. Import api/schema.sql via phpMyAdmin
 */

// ===== DATABASE CREDENTIALS (fill these on Hostinger) =====
define('DB_HOST', 'localhost');                 // Hostinger usually 'localhost'
define('DB_NAME', 'YOUR_DATABASE_NAME');        // e.g. u123456789_crown
define('DB_USER', 'YOUR_DATABASE_USER');        // e.g. u123456789_admin
define('DB_PASS', 'YOUR_DATABASE_PASSWORD');    // the DB user password
define('DB_CHARSET', 'utf8mb4');

// ===== APP SETTINGS =====
define('UPLOAD_DIR', __DIR__ . '/../uploads/blogs/');   // where blog images are saved
define('UPLOAD_URL', 'uploads/blogs/');                 // public URL path (relative to site root)
define('MAX_UPLOAD_BYTES', 600 * 1024);                 // 600 KB safety cap (images are pre-compressed client-side)

// ===== NOTIFICATION SETTINGS (optional) =====
define('OWNER_EMAIL', 'support@crownwealthadvisor.com');
define('OWNER_WHATSAPP', '917428045423');

// ===== SESSION =====
define('SESSION_NAME', 'cwa_admin_session');

// Show errors only during setup; set to 0 in production
ini_set('display_errors', 0);
error_reporting(E_ALL);
