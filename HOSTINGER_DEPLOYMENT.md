# Crown Wealth Advisor — Hostinger Deployment Guide (PHP + MySQL)

This is the REAL system: a static front-end + a PHP/MySQL backend. Leads, blogs,
users, announcements and analytics are all stored in a MySQL database on Hostinger.
Blog images are compressed in the browser (<500KB) and saved to `/uploads/blogs/`.

---

## What you need
- A Hostinger plan with PHP + MySQL (every shared plan has this)
- Your domain connected to Hostinger
- 15–20 minutes

---

## STEP 1 — Create a MySQL database
1. Login to **hPanel** → **Databases → MySQL Databases**
2. Create a new database, e.g. `crown`
   - Note the FULL database name (Hostinger prefixes it, e.g. `u123456789_crown`)
3. Create a database user + password (note them)
4. Make sure the user is **added to the database** with **All Privileges**

You now have 4 values:
- DB name  (e.g. `u123456789_crown`)
- DB user  (e.g. `u123456789_admin`)
- DB pass  (the password you set)
- DB host  (usually `localhost` on Hostinger)

---

## STEP 2 — Upload the website files
1. hPanel → **Files → File Manager** → open `public_html`
2. Delete any default placeholder files (e.g. Hostinger's `default.php`/`index.html`)
3. Upload the whole project (zip it, upload the zip, then **Extract**), so you have:
   ```
   public_html/
     index.html
     404.html  robots.txt  sitemap.xml
     assets/        (css, js, images)
     pages/         (all inner pages)
     admin/         (admin panel)
     api/           (PHP backend)
     uploads/blogs/ (blog images saved here)
   ```

---

## STEP 3 — Fill database credentials
1. In File Manager open **`api/config.php`** (right-click → Edit)
2. Set your 4 values:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_crown');
   define('DB_USER', 'u123456789_admin');
   define('DB_PASS', 'your-db-password');
   ```
3. Save.

---

## STEP 4 — Import the database tables
1. hPanel → **Databases → phpMyAdmin** → open your database
2. Click the **Import** tab
3. Choose file **`api/schema.sql`** (from this project) → **Go**
4. You should see tables created: `users, leads, lead_comments, blogs,
   announcements, settings, activity_log`

---

## STEP 5 — Create the admin owner account
1. In your browser visit: `https://YOURDOMAIN.com/api/install.php`
2. It prints the login details:
   - Email: `support@crownwealthadvisor.com`
   - Password: `Crown@123`
3. **DELETE `api/install.php`** afterwards (File Manager → delete).
   (Change your password later from the admin **Users** page.)

---

## STEP 6 — Set the uploads folder permission
1. File Manager → right-click **`uploads/blogs`** → **Permissions**
2. Set to **755** (so PHP can write image files there)
3. Keep the `.htaccess` inside it (it blocks script execution for security)

---

## STEP 7 — Test everything
1. **Website**: open `https://YOURDOMAIN.com` — the announcement bar shows at top.
2. **Lead capture**: fill the homepage consultation form and submit.
3. **Admin login**: open `https://YOURDOMAIN.com/admin/` →
   login with `support@crownwealthadvisor.com` / `Crown@123`
4. **Dashboard**: the lead you just submitted appears.
5. **Blog**: Admin → Write Blog → upload an image (auto-compressed) →
   Submit for Approval → Blog Approval → Approve → it now shows on
   `https://YOURDOMAIN.com/pages/blog.html`
6. **Analytics**: check counts, success rate, daily/weekly/monthly trend.

---

## Security checklist (do these once)
- [ ] Deleted `api/install.php`
- [ ] Changed the owner password (admin → Users)
- [ ] `uploads/blogs` is 755 and contains the protective `.htaccess`
- [ ] `robots.txt` disallows `/admin/` (already set)
- [ ] In `api/config.php`, `display_errors` is `0` (already set)

---

## How the data is stored (storage planning)
| Data | Where | Size |
|------|-------|------|
| Leads, blog text, users, settings | MySQL database | tiny (text) — thousands of leads = a few MB |
| Blog images | `uploads/blogs/` on Hostinger disk | ~300–500 KB each (auto-compressed) |
| Analytics | computed live from MySQL | 0 extra |

Your Hostinger plan (50 GB+) is far more than enough.

---

## Optional — Email/WhatsApp notifications
- The site stores leads reliably in the database (no lead is lost).
- For instant email alerts you can later add EmailJS keys in admin → Notifications.
- WhatsApp: the homepage form already prepares a `wa.me` message link to
  `+91-7428045423`; full auto-send needs the WhatsApp Business API.

---

## Troubleshooting
- **"Database connection failed"** → re-check the 4 values in `api/config.php`
  (Hostinger DB name/user include the `uXXXXXXXX_` prefix).
- **Admin login fails** → run `api/install.php` once, then delete it.
- **Blog image upload fails** → set `uploads/blogs` permission to 755.
- **Blank API response** → make sure files are under `public_html` and the URL is
  `https://YOURDOMAIN.com/api/...` (not opened as a local file).
