# Hostinger Deployment Guide - Crown Wealth Advisor

## Step-by-Step Deployment via File Manager

### Prerequisites
- Hostinger hosting account (Premium or Business plan recommended)
- Domain pointed to Hostinger nameservers
- All website files ready for upload

### Step 1: Login to Hostinger
1. Go to https://hpanel.hostinger.com
2. Login with your credentials
3. Navigate to "Hosting" section
4. Click "Manage" on your hosting plan

### Step 2: Access File Manager
1. In the hosting dashboard, click "File Manager"
2. Navigate to `public_html` directory
3. This is the root folder where all files should go

### Step 3: Upload Files
1. Click "Upload" button in File Manager
2. Upload the following structure:

```
public_html/
  index.html
  404.html
  robots.txt
  sitemap.xml
  assets/
    css/
      styles.css
    js/
      main.js
      announcements.js
      form-handler.js
      performance.js
      blog-system.js
      feature-config.js
      lead-assignment.js
      notifications.js
      role-permissions.js
    images/
      crown-logo.png
  pages/
    health-insurance.html
    life-insurance.html
    general-insurance.html
    home-loan.html
    personal-loan.html
    car-loan.html
    loan-against-property.html
    fixed-deposit.html
    emi-calculator.html
    insurance-calculator.html
    loan-eligibility.html
    blog.html
    single-blog.html
    bajaj-careers.html
    pnb-careers.html
    claim-support.html
  admin/
    index.html
    dashboard.html
    lead-details.html
    blog-write.html
    blog-approval.html
    blog-list.html
    users.html
    analytics.html
    notifications.html
    assignments.html
    announcements.html
    settings.html
    admin-styles.css
    admin.js
```

### Step 4: Verify Upload
1. Visit your domain in a browser
2. Check that the homepage loads correctly
3. Verify the logo appears
4. Test navigation to all pages
5. Test admin panel at yourdomain.com/admin/

### Step 5: SSL Certificate Setup
1. In Hostinger hPanel, go to "SSL"
2. Click "Setup" or "Install" for your domain
3. Select "Free SSL (Let's Encrypt)"
4. Click "Install"
5. Wait 5-10 minutes for activation
6. Verify https:// works on your domain

### Step 6: Domain Configuration
1. In hPanel, go to "Domains"
2. If using an external domain:
   - Point nameservers to: ns1.dns-parking.com and ns2.dns-parking.com
   - Or add A record pointing to your server IP
3. If domain was purchased at Hostinger, it auto-connects

### Step 7: Create support@crownwealthadvisor.com Email
1. In hPanel, go to "Emails"
2. Click "Email Accounts"
3. Click "Create Email Account"
4. Enter: support (the part before @)
5. Set a strong password
6. Click "Create"
7. Access webmail at: mail.crownwealthadvisor.com
8. You can also set up email forwarding to your Gmail

### Step 8: Performance Settings
1. In hPanel, go to "Advanced" > "Cache Manager"
2. Enable browser caching
3. Go to "CDN" section and enable Cloudflare if available
4. Enable GZIP compression (usually enabled by default)

## Updating the Site

### To update files:
1. Go to File Manager
2. Navigate to the file you want to update
3. Right-click > Edit, or delete and re-upload
4. Changes are instant (no build step needed)

### To update admin panel:
1. Navigate to public_html/admin/
2. Upload updated admin.js or HTML files
3. Clear browser cache to see changes

## Firebase Setup (Optional - for production)

To move from demo mode (localStorage) to Firebase:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your config from Project Settings > General
5. Replace the placeholders in admin/admin.js:
   - YOUR_API_KEY
   - YOUR_PROJECT_ID
   - YOUR_PROJECT.firebaseapp.com
   - YOUR_SENDER_ID
   - YOUR_APP_ID

## Troubleshooting

### 404 errors on pages
- Ensure all HTML files are in correct directories
- Check that file names match exactly (case sensitive on Linux servers)

### Logo not showing
- Verify crown-logo.png is in assets/images/
- Check file permissions (should be 644)

### Admin panel not working
- Clear browser localStorage if you see stale data
- Ensure admin.js is uploaded correctly
- Check browser console for errors

### SSL not working
- Wait 24 hours for DNS propagation
- Try clearing browser cache
- Contact Hostinger support if issue persists

## Contact
- Admin Email: crownwealthadvisor1111@gmail.com
- Support: support@crownwealthadvisor.com
- Phone: +91-7428045423
