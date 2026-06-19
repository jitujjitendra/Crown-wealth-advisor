# Crown Wealth Advisor - Setup Instructions

## 🚀 Quick Start

This website is production-ready with all features implemented. Follow these steps to complete the setup.

---

## 📋 Prerequisites

- A web hosting service (GitHub Pages, Netlify, Vercel, or any web server)
- Basic knowledge of HTML/CSS/JavaScript
- Email service account (EmailJS or Web3Forms)

---

## 🔧 Required Configurations

### 1. **Form Integration Setup (CRITICAL)**

The contact forms need email service configuration. Choose one option:

#### **Option A: EmailJS (Recommended - Free tier available)**

1. Go to [EmailJS](https://www.emailjs.com/)
2. Create a free account
3. Create an email service (Gmail, Outlook, etc.)
4. Create an email template with these variables:
   - `{{from_name}}` - User's name
   - `{{from_email}}` - User's email
   - `{{from_phone}}` - User's phone
   - `{{service_type}}` - Service type
   - `{{message}}` - User's message
   - `{{to_name}}` - Your company name

5. Get your credentials:
   - Service ID
   - Template ID
   - Public Key

6. Update `/assets/js/form-handler.js`:
   ```javascript
   const EMAILJS_CONFIG = {
     serviceId: 'YOUR_SERVICE_ID',     // Replace this
     templateId: 'YOUR_TEMPLATE_ID',   // Replace this
     publicKey: 'YOUR_PUBLIC_KEY'      // Replace this
   };
   ```

7. Add EmailJS script to all HTML files (before closing `</body>` tag):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   <script src="assets/js/form-handler.js"></script>
   ```

#### **Option B: Web3Forms (Alternative - Also free)**

1. Go to [Web3Forms](https://web3forms.com/)
2. Create a free account and get your Access Key
3. Uncomment the Web3Forms section in `form-handler.js`
4. Replace `YOUR_WEB3FORMS_ACCESS_KEY` with your key

---

### 2. **Contact Information Update (CRITICAL)**

Update your business contact details:

#### **WhatsApp Number**
Find and replace in ALL HTML files:
```html
<!-- Find this: -->
<a class="whatsapp-float" href="https://wa.me/91XXXXXXXXXX">

<!-- Replace XXXXXXXXXX with your actual WhatsApp number -->
<a class="whatsapp-float" href="https://wa.me/919876543210">
```

#### **Footer Contact Details**
Update in `index.html` and all page files (search for "Contact Us" section in footer):
```html
<li>📞 +91-XXXXXXXXXX</li>
<li>✉️ info@crownwealthadvisor.com</li>
<li>📍 Your Office Address Here</li>
```

---

### 3. **Google Analytics Setup (Optional but Recommended)**

1. Create a Google Analytics 4 property at [analytics.google.com](https://analytics.google.com)
2. Get your Measurement ID (looks like `G-XXXXXXXXXX`)
3. Add to all HTML files in the `<head>` section:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

### 4. **Favicon Setup**

1. Create your favicon using [Favicon Generator](https://realfavicongenerator.net/)
2. Download the generated files
3. Place them in the root directory
4. Add to `<head>` section of all HTML files:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
```

---

### 5. **SEO Meta Tags**

Already added to all pages! But customize these:

#### In `index.html` and all pages:
```html
<!-- Update with your actual domain -->
<meta property="og:url" content="https://www.yourwebsite.com">
<meta property="og:image" content="https://www.yourwebsite.com/og-image.jpg">
<meta name="twitter:image" content="https://www.yourwebsite.com/twitter-card.jpg">
```

Create social media images:
- **og-image.jpg**: 1200x630px (Facebook/LinkedIn)
- **twitter-card.jpg**: 1200x600px (Twitter/X)

---

## 📁 File Structure

```
Crown-wealth-advisor/
├── index.html              # Home page
├── pages/                  # All service pages
│   ├── health-insurance.html
│   ├── life-insurance.html
│   ├── general-insurance.html
│   ├── home-loan.html
│   ├── personal-loan.html
│   ├── car-loan.html
│   ├── loan-against-property.html
│   ├── fixed-deposit.html
│   ├── emi-calculator.html
│   ├── loan-eligibility.html      # NEW
│   ├── insurance-calculator.html  # NEW
│   ├── blog.html
│   └── 404.html                    # NEW
├── assets/
│   ├── css/
│   │   └── styles.css      # Main stylesheet (optimized)
│   ├── js/
│   │   ├── main.js         # Core functionality
│   │   └── form-handler.js # Form submission (NEW)
│   └── images/             # Your images (add here)
├── sitemap.xml             # NEW - SEO sitemap
├── robots.txt              # NEW - Search engine rules
├── SETUP_INSTRUCTIONS.md   # This file
└── README.md               # Project documentation
```

---

## 🚀 Deployment Options

### **Option 1: GitHub Pages (Free)**
1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select branch and root folder
4. Your site will be live at `username.github.io/repo-name`

### **Option 2: Netlify (Free)**
1. Sign up at [Netlify](https://www.netlify.com/)
2. Drag and drop your folder
3. Your site goes live instantly
4. Get free SSL certificate

### **Option 3: Vercel (Free)**
1. Sign up at [Vercel](https://vercel.com/)
2. Import from GitHub or upload files
3. Automatic deployments on every push

### **Option 4: Traditional Web Hosting**
1. Use FTP/SFTP to upload all files
2. Point domain to hosting server
3. Ensure SSL certificate is installed

---

## ✅ Pre-Launch Checklist

- [ ] EmailJS/Web3Forms configured and tested
- [ ] WhatsApp number updated (all pages)
- [ ] Contact details updated (footer)
- [ ] Google Analytics added
- [ ] Favicon generated and added
- [ ] Social media images created
- [ ] OG meta tags URLs updated
- [ ] Tested forms on desktop
- [ ] Tested forms on mobile
- [ ] All links working
- [ ] All calculators tested
- [ ] Mobile responsiveness checked
- [ ] Page load speed tested
- [ ] Cross-browser testing done
- [ ] Domain configured (if applicable)

---

## 🔍 Testing

### **Test Forms:**
```
1. Fill all fields correctly → Should show success message
2. Leave required fields empty → Should show validation error
3. Enter invalid email → Should show validation error
4. Enter invalid phone → Should show validation error
```

### **Test Calculators:**
```
EMI Calculator: Enter loan amount, rate, tenure → Should show EMI
Loan Eligibility: Enter income, obligations → Should show eligibility
Insurance Calculator: Enter details → Should show coverage
```

### **Test Responsive Design:**
```
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px, 414px)
```

---

## 📞 Support

For any issues during setup:
1. Check browser console for errors (F12 → Console)
2. Verify all credentials are correctly added
3. Test on local server first before deploying
4. Check EmailJS dashboard for delivery status

---

## 🎉 You're Ready!

Once you've completed all the steps above, your website is production-ready and can handle real customer inquiries!

**Important Notes:**
- Keep your EmailJS/Web3Forms credentials secure
- Monitor form submissions regularly
- Update content as needed
- Keep backups of your configuration

---

## 📈 Post-Launch

After launching:
1. Submit sitemap.xml to Google Search Console
2. Monitor Google Analytics for traffic
3. Test forms from different devices
4. Collect user feedback
5. Update content regularly (especially blog section)

Good luck with your financial advisory business! 🚀
