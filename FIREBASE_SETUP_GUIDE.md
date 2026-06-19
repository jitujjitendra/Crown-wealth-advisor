# Firebase Setup Guide for Crown Wealth Advisor Admin Panel

This guide will help you set up Firebase for the Crown Wealth Advisor website to enable:
- ✅ Admin authentication (login/logout)
- ✅ Lead data storage in Firestore
- ✅ Real-time lead management
- ✅ Email and WhatsApp notifications (optional)

## Prerequisites

- Google Account
- Access to [Firebase Console](https://console.firebase.google.com/)
- Basic understanding of Firebase concepts

---

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Add project"**
3. **Enter project name**: `crown-wealth-advisor` (or your preferred name)
4. **Disable Google Analytics** (optional, can enable later)
5. **Click "Create Project"**
6. Wait for project creation to complete

---

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. **Enter app nickname**: `Crown Wealth Admin`
3. **Check "Also set up Firebase Hosting"** (optional)
4. **Click "Register app"**
5. **Copy the Firebase configuration object** - You'll need this later

Example configuration:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "crown-wealth-advisor.firebaseapp.com",
  projectId: "crown-wealth-advisor",
  storageBucket: "crown-wealth-advisor.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

---

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** section
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

### Create Admin User

1. Go to **Authentication > Users** tab
2. **Click "Add user"**
3. **Enter email**: `crownwealthadvisor1111@gmail.com` (or your preferred admin email)
4. **Enter password**: Create a strong password (min 6 characters)
5. **Click "Add user"**
6. **Save these credentials** - You'll use them to login to admin panel

---



## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. **Click "Create database"**
3. **Select "Start in production mode"** (we'll set rules next)
4. **Choose location**: Select closest to your users (e.g., `asia-south1` for India)
5. **Click "Enable"**

### Configure Firestore Security Rules

1. Go to **Firestore Database > Rules** tab
2. **Replace default rules** with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write leads
    match /leads/{leadId} {
      allow read, write: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"**

### Create Firestore Collection Structure

Firestore will automatically create collections when you submit your first form. The structure will be:

```
📁 leads (collection)
  📄 [auto-generated-id] (document)
    - name: "Customer Name"
    - email: "email@example.com"
    - mobile: "9876543210"
    - service: "Health Insurance"
    - status: "new"
    - source: "Website Form"
    - createdAt: timestamp
    - updatedAt: timestamp
    - comments: []
    - history: []
    - [... other form fields]
```

---

## Step 5: Configure Firebase in Your Website

Now you need to add your Firebase configuration to 4 files:

### File 1: `admin/index.html` (Login Page)

**Line 298-304**: Replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // ← Replace with your actual values
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### File 2: `admin/dashboard.js` (Dashboard Logic)

**Line 9-15**: Replace the placeholder config with the same values

### File 3: `admin/lead-details.js` (Lead Details Logic)

**Line 9-15**: Replace the placeholder config with the same values

### File 4: `assets/js/form-handler.js` (Form Submissions)

**Line 14-20**: Replace EmailJS config OR add Firebase config:

```javascript
// Option A: Keep EmailJS (recommended for simple setup)
// No changes needed - forms will work without Firebase

// Option B: Use Firebase for form submissions
// Add this after EmailJS config or replace it:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---



## Step 6: Update Form Handler to Save Leads to Firebase

Open `assets/js/form-handler.js` and add Firebase Firestore saving functionality.

**Add after line 20** (after Firebase config):

```javascript
// Initialize Firebase Firestore
let db;
try {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    console.log('Firestore initialized for form submissions');
  }
} catch (error) {
  console.error('Firestore initialization error:', error);
}
```

**Modify the `handleFormSubmit` function** (around line 27) to save to Firestore:

```javascript
async function handleFormSubmit(form, formMessage) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Add metadata
  data.status = 'new';
  data.source = getFormSource(form);
  data.createdAt = new Date();
  data.comments = [];
  data.history = [{
    action: 'Lead created',
    timestamp: new Date(),
    user: 'System'
  }];
  
  // Show loading
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = 'Submitting...';
  
  try {
    // Save to Firestore
    if (db) {
      await db.collection('leads').add(data);
      console.log('Lead saved to Firestore');
    }
    
    // Optional: Send email notification via EmailJS
    // ... (keep existing EmailJS code if you want email notifications)
    
    showMessage(formMessage, 'Thank you! Your request has been submitted successfully.', 'success');
    form.reset();
    
  } catch (error) {
    console.error('Error saving lead:', error);
    showMessage(formMessage, 'Sorry, something went wrong. Please try again.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
}

// Helper function to determine form source
function getFormSource(form) {
  const pageUrl = window.location.pathname;
  
  if (pageUrl.includes('bajaj-careers')) return 'Bajaj Careers Form';
  if (pageUrl.includes('pnb-careers')) return 'PNB Careers Form';
  if (pageUrl.includes('claim-support')) return 'Claim Support Form';
  if (pageUrl.includes('index.html') || pageUrl === '/') return 'Homepage Consultation Form';
  
  return 'Website Form';
}
```

**Add Firestore script** in all HTML files that have forms (before closing `</body>` tag):

```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

---

## Step 7: Set Up Email Notifications (Optional)

You have two options for email notifications:

### Option A: EmailJS (Recommended for Beginners)

1. **Sign up at**: https://www.emailjs.com/
2. **Create an email service** (Gmail, Outlook, etc.)
3. **Create an email template**:
   - Subject: `New Lead from Crown Wealth Advisor`
   - Body:
   ```
   New lead received:
   
   Name: {{from_name}}
   Email: {{from_email}}
   Phone: {{from_phone}}
   Service: {{service_type}}
   Message: {{message}}
   ```
4. **Get your credentials**:
   - Service ID
   - Template ID
   - Public Key
5. **Update `assets/js/form-handler.js`** (lines 11-13):
   ```javascript
   const EMAILJS_CONFIG = {
     serviceId: 'your_service_id',
     templateId: 'your_template_id',
     publicKey: 'your_public_key'
   };
   ```

### Option B: Firebase Cloud Functions (Advanced)

This requires Firebase Blaze Plan (pay-as-you-go).

1. **Upgrade to Blaze Plan** in Firebase Console
2. **Install Firebase CLI**: `npm install -g firebase-tools`
3. **Initialize Functions**: `firebase init functions`
4. **Create function** in `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email transporter (use Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

// Trigger on new lead creation
exports.sendLeadNotification = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    
    const mailOptions = {
      from: 'Crown Wealth Advisor <noreply@crownwealth.com>',
      to: 'crownwealthadvisor1111@gmail.com',
      subject: `New Lead: ${lead.name}`,
      html: `
        <h2>New Lead Received</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.mobile || lead.phone}</p>
        <p><strong>Service:</strong> ${lead.service || 'N/A'}</p>
        <p><strong>Source:</strong> ${lead.source}</p>
        <p><strong>Date:</strong> ${new Date(lead.createdAt.seconds * 1000).toLocaleString()}</p>
        <br>
        <a href="https://your-domain.com/admin/lead-details.html?id=${context.params.leadId}" 
           style="background: #c9000b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Lead in Dashboard
        </a>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });
```

5. **Deploy**: `firebase deploy --only functions`

---



## Step 8: Set Up WhatsApp Notifications (Optional)

WhatsApp Business API requires approval and setup. Here are two options:

### Option A: WhatsApp Business API (Official)

1. **Apply for WhatsApp Business API**: https://business.whatsapp.com/
2. **Get approved** (may take several days)
3. **Use a service provider** like:
   - Twilio: https://www.twilio.com/whatsapp
   - MessageBird: https://www.messagebird.com/
   - Gupshup: https://www.gupshup.io/

**Example with Twilio** (in Firebase Cloud Function):

```javascript
const twilio = require('twilio');
const client = new twilio('ACCOUNT_SID', 'AUTH_TOKEN');

exports.sendWhatsAppNotification = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox or your number
      to: 'whatsapp:+917428045423',   // Your WhatsApp number
      body: `🆕 New Lead Alert!\n\nName: ${lead.name}\nPhone: ${lead.mobile}\nService: ${lead.service}\n\nView: https://your-domain.com/admin/lead-details.html?id=${context.params.leadId}`
    });
  });
```

### Option B: Simple WhatsApp Link (Quick Solution)

For immediate implementation without API:

1. **No setup required** - Already implemented in website
2. **WhatsApp float button** opens chat with `+91-7428045423`
3. **You'll receive messages directly** when customers click the button
4. **For notifications**, you can manually forward lead details to WhatsApp

---

## Step 9: Testing Your Setup

### Test Authentication

1. **Open admin panel**: `your-domain.com/admin/index.html`
2. **Login with admin credentials** you created in Step 3
3. **Should redirect to dashboard** after successful login

### Test Form Submission

1. **Open website**: `your-domain.com/index.html`
2. **Fill out consultation form** in homepage
3. **Submit the form**
4. **Check Firestore Console**: Go to Firestore Database → `leads` collection
5. **You should see a new document** with form data
6. **Check admin dashboard**: Refresh dashboard to see new lead

### Test Lead Management

1. **In dashboard**, click **View** on any lead
2. **Update status** to WIP or Success
3. **Add a comment** about the lead
4. **Check Firestore** - changes should be saved
5. **Test Export to Excel** button

---

## Step 10: Deploy to Production

### Option A: GitHub Pages (Free, Static Hosting)

1. **Push code to GitHub** repository
2. **Go to repository Settings** → Pages
3. **Select branch**: main
4. **Select folder**: / (root)
5. **Save and wait** for deployment
6. **Access website**: `https://username.github.io/repository-name`

**Note**: Admin panel will work on GitHub Pages but forms need Firebase configured.

### Option B: Firebase Hosting (Recommended)

1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Login**: `firebase login`
3. **Initialize hosting**: `firebase init hosting`
   - Select your Firebase project
   - Public directory: `.` (current directory)
   - Configure as single-page app: No
   - Don't overwrite existing files
4. **Deploy**: `firebase deploy --only hosting`
5. **Access website**: `https://your-project.firebaseapp.com`

### Option C: Custom Domain Hosting

Use services like:
- **Netlify**: Drag and drop deployment
- **Vercel**: Connect GitHub repository
- **Traditional hosting**: Upload via FTP

---

## Troubleshooting

### Issue: "Firebase not configured" error

**Solution**: Make sure you replaced `YOUR_API_KEY` with actual Firebase credentials in all 4 files.

### Issue: Forms not saving to Firestore

**Solution**: 
1. Check browser console for errors
2. Verify Firestore security rules allow writes
3. Ensure Firebase scripts are loaded before form-handler.js

### Issue: Admin login not working

**Solution**:
1. Verify admin user exists in Firebase Authentication
2. Check if email/password is correct
3. Ensure Firebase Auth is enabled

### Issue: "Permission denied" in Firestore

**Solution**: 
1. Check Firestore security rules
2. Ensure user is authenticated before accessing data
3. Make sure rules allow read/write for authenticated users

### Issue: Email notifications not working

**Solution**:
1. Verify EmailJS credentials are correct
2. Check email service quota limits
3. Look for errors in browser console

---

## Security Best Practices

1. **Never commit Firebase config** with real credentials to public GitHub
2. **Use environment variables** for sensitive data
3. **Enable Firebase App Check** for production
4. **Set up Firestore backup** rules
5. **Monitor Firebase usage** to avoid unexpected costs
6. **Use strong passwords** for admin accounts
7. **Enable 2FA** on Firebase Console account
8. **Review Firestore security rules** regularly

---

## Cost Estimation

### Firebase Free Tier (Spark Plan)

- ✅ **Authentication**: 50,000 verifications/month
- ✅ **Firestore**: 50K reads, 20K writes, 20K deletes per day
- ✅ **Hosting**: 10 GB storage, 360 MB/day transfer
- ✅ **Cloud Functions**: Not available on free tier

**Estimated cost for 100-500 leads/month**: **FREE** ✅

### If You Need More (Blaze Plan)

- Pay only for what you use
- ~$0.001 per lead (minimal cost)
- Email notifications via Cloud Functions: ~$0.40 per million invocations

---

## Support & Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Console**: https://console.firebase.google.com/
- **EmailJS Documentation**: https://www.emailjs.com/docs/
- **Firestore Query Guide**: https://firebase.google.com/docs/firestore/query-data/queries

---

## Quick Reference: Files to Update

| File | What to Update | Line Numbers |
|------|----------------|--------------|
| `admin/index.html` | Firebase config | 298-304 |
| `admin/dashboard.js` | Firebase config | 9-15 |
| `admin/lead-details.js` | Firebase config | 9-15 |
| `assets/js/form-handler.js` | Firebase config + Save logic | 14-20, 27+ |

---

**🎉 Congratulations!** Your Crown Wealth Advisor admin panel is now fully configured with Firebase.

For questions or issues, refer to the troubleshooting section or Firebase documentation.
