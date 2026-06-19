# Crown Wealth Advisor - Complete Website with Admin Panel

A professional financial advisory website with a comprehensive lead management system.

![Crown Wealth Advisor](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-2.0-blue)

## 🌟 Features

### Public Website
- ✅ **Golden Logo** - Updated brand color to #D4A574
- ✅ **Contact Information** - Phone: +91-7428045423, Email: crownwealthadvisor1111@gmail.com
- ✅ **Services Pages** - Insurance, Loans, Investments
- ✅ **Career Pages**
  - Bajaj Allianz Partnership Application
  - PNB MetLife Advisor Application
- ✅ **Claim Support Services** - Professional claim assistance with pricing packages
- ✅ **Financial Calculators** - EMI, Loan Eligibility, Insurance Need
- ✅ **WhatsApp Integration** - Direct chat button (+91-7428045423)
- ✅ **Responsive Design** - Mobile-friendly across all pages
- ✅ **SEO Optimized** - Meta tags, Schema.org markup

### Admin Panel (CRM System)
- 🔐 **Secure Login** - Firebase authentication with email/password
- 📊 **Dashboard** - Real-time statistics and lead overview
  - Success/WIP/Rejected/Total lead counts
  - Search and filter functionality
  - Status-based filtering (🟢 Success, 🟠 WIP, 🔴 Rejected)
  - Pagination (20 leads per page)
  - Export to Excel
- 📋 **Lead Management**
  - View complete lead details
  - Add comments and notes
  - Update lead status
  - Track lead history
  - Delete leads with confirmation
- 💾 **Firebase Integration**
  - Cloud Firestore for data storage
  - Real-time updates
  - Secure authentication
  - Demo mode for testing

## 📁 Project Structure

```
Crown-wealth-advisor/
├── admin/                          # Admin Panel
│   ├── index.html                 # Login page
│   ├── dashboard.html             # Lead dashboard
│   ├── lead-details.html          # Individual lead view
│   ├── dashboard.js               # Dashboard logic
│   ├── lead-details.js            # Lead details logic
│   └── admin-styles.css           # Admin panel styles
│
├── assets/
│   ├── css/
│   │   └── styles.css             # Main website styles
│   └── js/
│       ├── main.js                # Website interactions
│       ├── form-handler.js        # Form submission logic
│       └── performance.js         # Performance optimization
│
├── pages/                          # Website pages
│   ├── bajaj-careers.html         # Bajaj partnership
│   ├── pnb-careers.html           # PNB MetLife careers
│   ├── claim-support.html         # Claim assistance services
│   ├── health-insurance.html      # Insurance pages
│   ├── life-insurance.html
│   ├── general-insurance.html
│   ├── home-loan.html             # Loan pages
│   ├── personal-loan.html
│   ├── car-loan.html
│   ├── loan-against-property.html
│   ├── fixed-deposit.html         # Investment page
│   ├── emi-calculator.html        # Calculator tools
│   ├── loan-eligibility.html
│   ├── insurance-calculator.html
│   ├── blog.html                  # Blog listing
│   └── single-blog.html           # Blog post template
│
├── index.html                      # Homepage
├── 404.html                        # Error page
├── sitemap.xml                     # SEO sitemap
├── robots.txt                      # Search engine rules
├── FIREBASE_SETUP_GUIDE.md         # Complete Firebase setup
└── README.md                       # This file
```

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/jitujjitendra/Crown-wealth-advisor.git
cd Crown-wealth-advisor
```

### 2. View Locally

Simply open `index.html` in your browser. No build process required!

```bash
# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000

# Using Node.js http-server
npx http-server
```

Visit: `http://localhost:8000`

### 3. Test Admin Panel (Demo Mode)

1. Open `admin/index.html` in browser
2. Login credentials for demo:
   - Email: `admin@crownwealthadvisor.com`
   - Password: `demo123`
3. Explore dashboard with sample data

## 🔧 Setup for Production

### Step 1: Configure Firebase

Follow the comprehensive guide: **[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)**

Quick checklist:
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password)
- [ ] Set up Firestore database
- [ ] Add Firebase config to 4 files
- [ ] Create admin user
- [ ] Test form submissions

### Step 2: Update Contact Info (Already Done ✅)

All files already updated with:
- Phone/WhatsApp: +91-7428045423
- Email: crownwealthadvisor1111@gmail.com
- Support Hours: 10:00 AM - 6:00 PM

### Step 3: Deploy Website

**Option A: GitHub Pages (Free)**
```bash
# Push to GitHub
git add .
git commit -m "Deploy Crown Wealth Advisor"
git push origin main

# Enable GitHub Pages in repository settings
```

**Option B: Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

**Option C: Traditional Hosting**
- Upload all files via FTP
- Ensure index.html is in root directory

## 📱 Key Contact Information

- **Phone/WhatsApp**: +91-7428045423
- **Email**: crownwealthadvisor1111@gmail.com
- **Support Hours**: 10:00 AM - 6:00 PM (Mon-Sat)
- **Tagline**: "All Financial Needs One Step Solution"

## 🎨 Design Highlights

- **Brand Color**: Golden (#D4A574) - Premium and trustworthy
- **Primary Red**: #c9000b - Attention and action
- **Clean Layout**: Easy to navigate
- **Professional Forms**: Validation and user feedback
- **Mobile Responsive**: Works on all devices

## 📋 Form Collection Sources

The admin panel tracks leads from:
1. Homepage Consultation Form
2. Bajaj Careers Application
3. PNB MetLife Careers Application
4. Claim Support Request Form
5. Service-specific inquiry forms

## 🔐 Admin Panel Features

### Dashboard
- **Statistics Cards**: Real-time count of leads by status
- **Search**: Find leads by name, email, phone, or service
- **Filters**: Filter by status (New, Success, WIP, Rejected)
- **Export**: Download all leads to Excel
- **Pagination**: Navigate through large lead lists

### Lead Details
- **Complete Information**: All form fields displayed
- **Status Management**: Update lead status with visual indicators
- **Comments System**: Add notes and track conversations
- **History Timeline**: See all status changes and actions
- **Delete Option**: Remove leads with confirmation

## 📊 Pricing Packages

### Claim Support Services
1. **Basic Consultation** - ₹499
2. **Grievance Filing** - ₹2,999 (Most Popular)
3. **Full Case Management** - ₹5,999

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Firestore + Authentication + Functions)
- **Libraries**: 
  - SheetJS (Excel export)
  - Firebase SDK v10.7.1
- **Tools**: 
  - EmailJS (email notifications)
  - WhatsApp Business API (optional)

## 📈 SEO & Performance

- ✅ **Page Speed**: Optimized images and lazy loading
- ✅ **Meta Tags**: Complete Open Graph and Twitter Cards
- ✅ **Schema Markup**: Structured data for search engines
- ✅ **Sitemap**: All pages indexed
- ✅ **Mobile-First**: Responsive design
- ✅ **Accessibility**: ARIA labels and semantic HTML

## 🧪 Testing Checklist

### Website Testing
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] WhatsApp button works
- [ ] Navigation links functional
- [ ] Mobile responsive
- [ ] Calculators work properly

### Admin Panel Testing
- [ ] Login with credentials
- [ ] Dashboard displays stats
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] View lead details
- [ ] Add comments
- [ ] Update status
- [ ] Export to Excel
- [ ] Delete lead

## 🔒 Security

- Firebase Authentication for admin access
- Firestore security rules implemented
- No sensitive data in client-side code
- HTTPS enforced in production
- Password reset functionality
- Session management

## 💰 Cost Estimation

### Firebase Free Tier (Sufficient for 100-500 leads/month)
- Authentication: 50,000 verifications/month
- Firestore: 50K reads, 20K writes per day
- Hosting: 10 GB storage, 360 MB/day
- **Estimated Monthly Cost**: ₹0 (FREE)

### Additional Costs (Optional)
- Domain name: ~₹500-1000/year
- Email service (EmailJS Pro): $10-30/month
- WhatsApp Business API: Varies by provider

## 📞 Support

For setup assistance:
- Email: crownwealthadvisor1111@gmail.com
- WhatsApp: +91-7428045423

For Firebase/Technical issues:
- Refer to [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
- Firebase Documentation: https://firebase.google.com/docs

## 📝 License

© 2024 Crown Wealth Advisor. All rights reserved.

## 🎯 Next Steps

1. ✅ **Review all pages** - Check content and design
2. 🔧 **Configure Firebase** - Follow setup guide
3. 🧪 **Test thoroughly** - All forms and admin features
4. 🚀 **Deploy to production** - Choose hosting option
5. 📣 **Start marketing** - Begin lead generation

---

**Built with ❤️ for Crown Wealth Advisor**

*Version 2.0 - Production Ready with Full Admin CRM System*
