# Hostinger Deployment Guide - Crown Wealth Advisor

Complete step-by-step guide for deploying Crown Wealth Advisor on Hostinger hosting.

## Prerequisites

- Hostinger hosting account (Premium or Business plan recommended)
- Domain name connected to Hostinger
- All website files ready for upload

---

## Method 1: File Manager Upload

### Step 1: Access File Manager
1. Log in to your Hostinger hPanel (hpanel.hostinger.com)
2. Navigate to **Files** > **File Manager**
3. Open the `public_html` directory

### Step 2: Clear Default Files
1. If there are default Hostinger files (like `index.html` placeholder), delete them
2. Ensure the `public_html` folder is empty before uploading

### Step 3: Upload Files
1. Click **Upload** button at the top of File Manager
2. Upload the entire website as a ZIP file for faster upload:
   - Create a ZIP of all project files
   - Upload the ZIP to `public_html`
   - Right-click the ZIP file > **Extract**
   - Delete the ZIP file after extraction
3. Alternatively, upload files individually using drag-and-drop

### Step 4: Verify File Structure
Your `public_html` should look like:
```
public_html/
  index.html
  404.html
  robots.txt
  sitemap.xml
  assets/
    css/styles.css
    js/main.js
    js/form-handler.js
    js/performance.js
    js/announcements.js
    js/blog-system.js
    js/role-permissions.js
    js/feature-config.js
    js/notifications.js
    js/lead-assignment.js
    images/
      crown-logo.png (upload your logo here)
  pages/
    health-insurance.html
    life-insurance.html
    ... (all page files)
  admin/
    index.html
    dashboard.html
    admin-styles.css
    ... (all admin files)
```

---

## Method 2: FTP Upload

### Step 1: Get FTP Credentials
1. Go to hPanel > **Files** > **FTP Accounts**
2. Note down:
   - FTP Host: your-domain.com or ftp.your-domain.com
   - FTP Username: (shown in FTP accounts)
   - FTP Password: (set during account creation)
   - Port: 21 (or 22 for SFTP)

### Step 2: Connect via FTP Client
Using FileZilla (recommended):
1. Download FileZilla from filezilla-project.org
2. Open FileZilla
3. Enter Host, Username, Password, Port
4. Click **Quickconnect**

### Step 3: Upload Files
1. In the remote panel, navigate to `/public_html/`
2. In the local panel, navigate to your project folder
3. Select all files and folders
4. Right-click > **Upload**
5. Wait for all transfers to complete

### Step 4: Set Permissions
Most files should be 644, directories should be 755:
- Files: 644 (Owner: Read/Write, Group: Read, Others: Read)
- Directories: 755 (Owner: Read/Write/Execute, Group: Read/Execute, Others: Read/Execute)

---

## Domain Connection

### If Domain is Registered with Hostinger
- Domain is automatically connected to your hosting

### If Domain is from External Registrar
1. Go to hPanel > **Domains** > **Add Domain**
2. Enter your domain name
3. Point your domain's nameservers to Hostinger:
   - ns1.dns-parking.com
   - ns2.dns-parking.com
4. Wait 24-48 hours for DNS propagation

### Custom Domain DNS Settings
If using A record method:
- A Record: Point `@` to your Hostinger server IP (found in hPanel > Hosting > Details)
- CNAME Record: Point `www` to your domain

---

## SSL Setup (HTTPS)

### Step 1: Enable Free SSL
1. Go to hPanel > **Security** > **SSL**
2. Click **Setup** next to your domain
3. Select **Free SSL** (Let's Encrypt)
4. Click **Install**
5. Wait 5-10 minutes for activation

### Step 2: Force HTTPS Redirect
1. Go to hPanel > **Domains** > **Force HTTPS**
2. Toggle ON to redirect all HTTP traffic to HTTPS

### Step 3: Verify
- Visit https://www.crownwealthadvisor.com
- Check for padlock icon in browser
- Test with https://www.ssllabs.com/ssltest/

---

## Firebase Configuration for Custom Domain

### Step 1: Firebase Console Setup
1. Go to console.firebase.google.com
2. Open your project
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Add your custom domain: `crownwealthadvisor.com`
5. Also add: `www.crownwealthadvisor.com`

### Step 2: Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leads collection - authenticated admin users only
    match /leads/{leadId} {
      allow read, write: if request.auth != null;
    }
    
    // Blog posts - anyone can read published, auth required for write
    match /blogs/{blogId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null;
    }
    
    // Users collection - only owners
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    // Settings - authenticated users
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Announcements - anyone can read active
    match /announcements/{annId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 3: Add Firebase Config to Website
Edit the admin pages to add your Firebase config before the SDK scripts:
```html
<script>
  var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
</script>
```

---

## Email Setup (support@crownwealthadvisor.com)

### Step 1: Access Email Manager
1. Go to hPanel > **Emails** > **Email Accounts**
2. Click **Create Email Account**

### Step 2: Create Email Accounts
Create these accounts:
- `support@crownwealthadvisor.com` (for customer support)
- `admin@crownwealthadvisor.com` (for admin notifications)

### Step 3: Configure Email Client
**IMAP Settings (Recommended):**
- Incoming Server: imap.hostinger.com
- Port: 993 (SSL)

**SMTP Settings:**
- Outgoing Server: smtp.hostinger.com
- Port: 465 (SSL)

### Step 4: Email Forwarding (Optional)
To receive support emails at Gmail:
1. Go to Email Accounts > select account > **Forwarders**
2. Add forwarder to: crownwealthadvisor1111@gmail.com

---

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Logo image (crown-logo.png) uploaded to `assets/images/`
- [ ] WhatsApp button visible and clickable on all pages
- [ ] Contact form submission works
- [ ] Admin panel accessible at /admin/
- [ ] Firebase connected (or demo mode working)
- [ ] SSL certificate active (HTTPS)
- [ ] 404 page working for invalid URLs
- [ ] Mobile responsiveness verified
- [ ] Page speed acceptable (test at pagespeed.web.dev)
- [ ] sitemap.xml accessible
- [ ] robots.txt configured correctly

---

## Troubleshooting

### Pages Not Loading
- Check file permissions (644 for files, 755 for directories)
- Verify files are in `public_html` (not in a subdirectory)
- Clear browser cache

### Admin Panel 404
- Ensure `admin/` folder is uploaded with all files
- Check `admin/index.html` exists (login page)

### Firebase Not Working
- Verify domain is added to Firebase Authorized Domains
- Check browser console for errors
- Ensure Firebase config is added before SDK scripts
- Website works in demo mode without Firebase

### SSL Issues
- Wait up to 24 hours after installation
- Try clearing DNS cache: `ipconfig /flushdns` (Windows) or restart browser
- Contact Hostinger support if SSL shows as pending for more than 24 hours

---

## Performance Optimization on Hostinger

1. **Enable Caching**: hPanel > **Advanced** > **Cache Manager** > Enable
2. **Enable Gzip**: Usually enabled by default on Hostinger
3. **CDN**: hPanel > **Performance** > **Cloudflare** (if available on your plan)
4. **Keep files lightweight**: The website uses no heavy frameworks, which is optimal

---

## Support

- Hostinger Support: Available 24/7 via live chat in hPanel
- Crown Wealth Advisor Admin: crownwealthadvisor1111@gmail.com
- Phone: +91-7428045423
