<?php
/**
 * Crown Wealth Advisor - Database Configuration
 */

// DEBUG: full error display to find login issue
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

// ===== TICKET ATTACHMENTS =====
define('TICKET_UPLOAD_DIR', __DIR__ . '/../uploads/tickets/'); // where ticket attachments are saved
define('TICKET_UPLOAD_URL', 'uploads/tickets/');               // public URL path (relative to site root)
define('MAX_TICKET_UPLOAD_BYTES', 1100 * 1024);                // ~1.1 MB server cap (customer limit is 1 MB)

// ===== NOTIFICATION SETTINGS (optional) =====
define('OWNER_EMAIL', 'support@crownwealthadvisor.com');
define('OWNER_WHATSAPP', '917428045423');

// ===== RECAPTCHA (Google reCAPTCHA v3 — invisible) =====
// Get keys from: https://www.google.com/recaptcha/admin (choose v3)
define('RECAPTCHA_SITE_KEY', '');   // leave empty to disable captcha
define('RECAPTCHA_SECRET_KEY', ''); // leave empty to disable captcha

// ===== SESSION =====
define('SESSION_NAME', 'cwa_admin_session');

// Show errors only during setup; set to 0 in production
ini_set('display_errors', 1);
error_reporting(E_ALL);
