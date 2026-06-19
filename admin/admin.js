/**
 * Crown Wealth Advisor - Admin Panel
 * Single JavaScript file for all admin functionality
 * Works in DEMO MODE using localStorage (no Firebase required)
 */

var CWA_Admin = (function() {
  'use strict';

  // ===== FIREBASE CONFIG PLACEHOLDERS =====
  var firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // ===== DEMO DATA =====
  function getDefaultLeads() {
    return [
      { id: 'L001', name: 'Rahul Sharma', mobile: '9876543210', city: 'Delhi', service: 'Health Insurance', time: 'Morning', status: 'new', assignedTo: '', comments: [], createdAt: '2024-01-15T10:30:00', source: 'website' },
      { id: 'L002', name: 'Priya Verma', mobile: '9876543211', city: 'Mumbai', service: 'Home Loan', time: 'Afternoon', status: 'wip', assignedTo: 'staff@crown.com', comments: [{text:'Called client, interested',by:'admin@crown.com',at:'2024-01-16T11:00:00'}], createdAt: '2024-01-14T14:20:00', source: 'whatsapp' },
      { id: 'L003', name: 'Amit Patel', mobile: '9876543212', city: 'Ahmedabad', service: 'Personal Loan', time: 'Evening', status: 'success', assignedTo: 'admin@crown.com', comments: [{text:'Loan approved',by:'admin@crown.com',at:'2024-01-17T09:00:00'}], createdAt: '2024-01-13T09:15:00', source: 'website' },
      { id: 'L004', name: 'Sneha Gupta', mobile: '9876543213', city: 'Bangalore', service: 'Life Insurance', time: 'Anytime', status: 'rejected', assignedTo: 'staff@crown.com', comments: [{text:'Not interested anymore',by:'staff@crown.com',at:'2024-01-18T16:00:00'}], createdAt: '2024-01-12T16:45:00', source: 'referral' },
      { id: 'L005', name: 'Vikram Singh', mobile: '9876543214', city: 'Jaipur', service: 'Car Loan', time: 'Morning', status: 'new', assignedTo: '', comments: [], createdAt: '2024-01-18T08:00:00', source: 'website' },
      { id: 'L006', name: 'Anita Reddy', mobile: '9876543215', city: 'Hyderabad', service: 'Fixed Deposit & Investments', time: 'Afternoon', status: 'wip', assignedTo: 'admin@crown.com', comments: [{text:'Meeting scheduled for Tuesday',by:'admin@crown.com',at:'2024-01-19T10:30:00'}], createdAt: '2024-01-11T11:30:00', source: 'website' },
      { id: 'L007', name: 'Rajesh Kumar', mobile: '9876543216', city: 'Chennai', service: 'General Insurance', time: 'Evening', status: 'new', assignedTo: '', comments: [], createdAt: '2024-01-19T17:20:00', source: 'whatsapp' },
      { id: 'L008', name: 'Meena Iyer', mobile: '9876543217', city: 'Pune', service: 'Health Insurance', time: 'Morning', status: 'wip', assignedTo: 'staff@crown.com', comments: [{text:'Sent policy comparison',by:'staff@crown.com',at:'2024-01-20T09:45:00'}], createdAt: '2024-01-10T10:00:00', source: 'referral' },
      { id: 'L009', name: 'Suresh Joshi', mobile: '9876543218', city: 'Kolkata', service: 'Loan Against Property', time: 'Anytime', status: 'success', assignedTo: 'admin@crown.com', comments: [{text:'Documents submitted',by:'admin@crown.com',at:'2024-01-20T14:00:00'}], createdAt: '2024-01-09T13:00:00', source: 'website' },
      { id: 'L010', name: 'Kavitha Nair', mobile: '9876543219', city: 'Kochi', service: 'Home Loan', time: 'Afternoon', status: 'new', assignedTo: '', comments: [], createdAt: '2024-01-20T15:30:00', source: 'website' }
    ];
  }

  function getDefaultBlogs() {
    return [
      { id: 'B001', title: 'Why Health Insurance is Essential for Every Family', category: 'Insurance', tags: 'health,family,coverage', content: '<p>Health insurance provides crucial financial protection against medical emergencies. Every family should have adequate health coverage to protect their savings from unexpected medical bills.</p><p>Key benefits include cashless hospitalization, coverage for pre-existing diseases after waiting period, and tax benefits under Section 80D.</p>', author: 'admin@crown.com', status: 'approved', featuredImage: '', metaDescription: 'Learn why health insurance is essential for families', createdAt: '2024-01-10T10:00:00', approvedAt: '2024-01-11T09:00:00' },
      { id: 'B002', title: 'Home Loan Eligibility: Complete Guide 2024', category: 'Loans', tags: 'home loan,eligibility,guide', content: '<p>Understanding home loan eligibility helps you plan better. Banks consider your income, age, credit score, and existing obligations when determining loan amount.</p><p>Tips to improve eligibility: maintain a good credit score, reduce existing EMIs, and consider a joint application.</p>', author: 'staff@crown.com', status: 'pending', featuredImage: '', metaDescription: 'Complete guide to home loan eligibility in 2024', createdAt: '2024-01-15T14:00:00', approvedAt: '' },
      { id: 'B003', title: 'Fixed Deposit vs Mutual Funds: Where to Invest', category: 'Investments', tags: 'FD,mutual funds,investment', content: '<p>Choosing between fixed deposits and mutual funds depends on your risk appetite, investment horizon, and financial goals.</p><p>FDs offer guaranteed returns with zero risk, while mutual funds offer potentially higher returns with market-linked risk.</p>', author: 'admin@crown.com', status: 'draft', featuredImage: '', metaDescription: 'Compare FD and mutual funds for your investment', createdAt: '2024-01-18T11:00:00', approvedAt: '' }
    ];
  }

  function getDefaultUsers() {
    return [
      { email: 'admin@crown.com', name: 'Admin Owner', role: 'owner', status: 'active', avatar: 'AO', createdAt: '2024-01-01T00:00:00' },
      { email: 'staff@crown.com', name: 'Staff Member', role: 'admin', status: 'active', avatar: 'SM', createdAt: '2024-01-05T00:00:00' }
    ];
  }

  function getDefaultAnnouncements() {
    return [
      { id: 'A001', title: 'New Year Offer', message: 'Get free financial consultation this January! Limited time offer.', type: 'success', link: '', active: true, createdAt: '2024-01-01T00:00:00' },
      { id: 'A002', title: 'Office Holiday', message: 'Office will be closed on 26th January for Republic Day.', type: 'info', link: '', active: true, createdAt: '2024-01-20T00:00:00' },
      { id: 'A003', title: 'New Insurance Plans', message: 'Check out our latest health insurance comparison for 2024.', type: 'warning', link: 'pages/health-insurance.html', active: true, createdAt: '2024-01-15T00:00:00' }
    ];
  }

  function getDefaultSettings() {
    return {
      blogEnabled: true,
      analyticsEnabled: true,
      notificationsEnabled: true,
      assignmentsEnabled: true,
      autoAssign: false,
      assignmentPercentages: { 'admin@crown.com': 60, 'staff@crown.com': 40 },
      leaveMode: { 'admin@crown.com': false, 'staff@crown.com': false },
      emailNotifications: true,
      whatsappNotifications: true,
      emailjsServiceId: '',
      emailjsTemplateId: '',
      emailjsPublicKey: ''
    };
  }

  function getDefaultActivity() {
    return [
      { action: 'Lead assigned to Staff Member', time: '2024-01-20T15:00:00', by: 'admin@crown.com' },
      { action: 'Blog "Home Loan Eligibility" submitted for approval', time: '2024-01-15T14:00:00', by: 'staff@crown.com' },
      { action: 'Lead L003 marked as Success', time: '2024-01-17T09:00:00', by: 'admin@crown.com' },
      { action: 'New user Staff Member added', time: '2024-01-05T00:00:00', by: 'admin@crown.com' },
      { action: 'Announcement "New Year Offer" created', time: '2024-01-01T00:00:00', by: 'admin@crown.com' }
    ];
  }

  // ===== STORAGE HELPERS =====
  function getData(key, defaultFn) {
    try {
      var data = localStorage.getItem('cwa_' + key);
      if (data) return JSON.parse(data);
    } catch(e) {}
    var def = defaultFn();
    localStorage.setItem('cwa_' + key, JSON.stringify(def));
    return def;
  }

  function setData(key, data) {
    localStorage.setItem('cwa_' + key, JSON.stringify(data));
  }

  // ===== AUTH MODULE =====
  var auth = {
    login: function(email, password) {
      var creds = {
        'admin@crown.com': { password: 'admin123', role: 'owner', name: 'Admin Owner' },
        'staff@crown.com': { password: 'staff123', role: 'admin', name: 'Staff Member' }
      };
      if (creds[email] && creds[email].password === password) {
        var session = { email: email, role: creds[email].role, name: creds[email].name, loginAt: new Date().toISOString() };
        sessionStorage.setItem('cwa_session', JSON.stringify(session));
        return true;
      }
      return false;
    },
    logout: function() {
      sessionStorage.removeItem('cwa_session');
      window.location.href = 'index.html';
    },
    getSession: function() {
      try {
        return JSON.parse(sessionStorage.getItem('cwa_session'));
      } catch(e) { return null; }
    },
    isLoggedIn: function() {
      return this.getSession() !== null;
    },
    checkAuth: function() {
      if (!this.isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },
    getRole: function() {
      var s = this.getSession();
      return s ? s.role : null;
    },
    isOwner: function() {
      return this.getRole() === 'owner';
    }
  };

  // ===== LEADS MODULE =====
  var leads = {
    getAll: function() { return getData('leads', getDefaultLeads); },
    save: function(data) { setData('leads', data); },
    getById: function(id) { return this.getAll().find(function(l) { return l.id === id; }); },
    add: function(lead) {
      var all = this.getAll();
      lead.id = 'L' + String(all.length + 1).padStart(3, '0');
      lead.status = 'new';
      lead.assignedTo = '';
      lead.comments = [];
      lead.createdAt = new Date().toISOString();
      lead.source = lead.source || 'website';
      all.unshift(lead);
      this.save(all);
      activity.log('New lead ' + lead.id + ' from ' + lead.name);
      return lead;
    },
    updateStatus: function(id, status) {
      var all = this.getAll();
      var lead = all.find(function(l) { return l.id === id; });
      if (lead) {
        lead.status = status;
        this.save(all);
        activity.log('Lead ' + id + ' status changed to ' + status);
      }
    },
    assign: function(id, email) {
      var all = this.getAll();
      var lead = all.find(function(l) { return l.id === id; });
      if (lead) {
        lead.assignedTo = email;
        this.save(all);
        activity.log('Lead ' + id + ' assigned to ' + email);
      }
    },
    addComment: function(id, text) {
      var all = this.getAll();
      var lead = all.find(function(l) { return l.id === id; });
      if (lead) {
        lead.comments.push({ text: text, by: auth.getSession().email, at: new Date().toISOString() });
        this.save(all);
        activity.log('Comment added on lead ' + id);
      }
    },
    getStats: function() {
      var all = this.getAll();
      return {
        total: all.length,
        new: all.filter(function(l) { return l.status === 'new'; }).length,
        wip: all.filter(function(l) { return l.status === 'wip'; }).length,
        success: all.filter(function(l) { return l.status === 'success'; }).length,
        rejected: all.filter(function(l) { return l.status === 'rejected'; }).length
      };
    },
    autoAssign: function(leadId) {
      var settings = CWA_Admin.settings.getAll();
      if (!settings.autoAssign) return;
      var users = CWA_Admin.users.getAll().filter(function(u) {
        return !settings.leaveMode[u.email];
      });
      if (users.length === 0) return;
      var totalPct = 0;
      users.forEach(function(u) { totalPct += (settings.assignmentPercentages[u.email] || 0); });
      var rand = Math.random() * totalPct;
      var cumulative = 0;
      for (var i = 0; i < users.length; i++) {
        cumulative += (settings.assignmentPercentages[users[i].email] || 0);
        if (rand <= cumulative) {
          this.assign(leadId, users[i].email);
          return;
        }
      }
      this.assign(leadId, users[0].email);
    },
    exportToExcel: function() {
      var all = this.getAll();
      var data = all.map(function(l) {
        return {
          'ID': l.id, 'Name': l.name, 'Mobile': l.mobile, 'City': l.city,
          'Service': l.service, 'Status': l.status, 'Assigned To': l.assignedTo,
          'Source': l.source, 'Created': l.createdAt
        };
      });
      if (typeof XLSX !== 'undefined') {
        var ws = XLSX.utils.json_to_sheet(data);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leads');
        XLSX.writeFile(wb, 'crown_leads_export.xlsx');
      } else {
        alert('SheetJS library not loaded. Please check your internet connection.');
      }
    }
  };

  // ===== BLOG MODULE =====
  var blogs = {
    getAll: function() { return getData('blogs', getDefaultBlogs); },
    save: function(data) { setData('blogs', data); },
    getById: function(id) { return this.getAll().find(function(b) { return b.id === id; }); },
    add: function(blog) {
      var all = this.getAll();
      blog.id = 'B' + String(all.length + 1).padStart(3, '0');
      blog.author = auth.getSession().email;
      blog.createdAt = new Date().toISOString();
      blog.approvedAt = '';
      all.unshift(blog);
      this.save(all);
      activity.log('Blog "' + blog.title + '" saved as ' + blog.status);
      return blog;
    },
    update: function(id, updates) {
      var all = this.getAll();
      var idx = all.findIndex(function(b) { return b.id === id; });
      if (idx > -1) {
        Object.assign(all[idx], updates);
        this.save(all);
        activity.log('Blog "' + all[idx].title + '" updated');
      }
    },
    approve: function(id) {
      var all = this.getAll();
      var blog = all.find(function(b) { return b.id === id; });
      if (blog) {
        blog.status = 'approved';
        blog.approvedAt = new Date().toISOString();
        this.save(all);
        activity.log('Blog "' + blog.title + '" approved');
        notifications.addAlert('Blog "' + blog.title + '" has been approved');
      }
    },
    reject: function(id, reason) {
      var all = this.getAll();
      var blog = all.find(function(b) { return b.id === id; });
      if (blog) {
        blog.status = 'rejected';
        blog.rejectReason = reason;
        this.save(all);
        activity.log('Blog "' + blog.title + '" rejected: ' + reason);
        notifications.addAlert('Blog "' + blog.title + '" was rejected');
      }
    },
    getApproved: function() {
      return this.getAll().filter(function(b) { return b.status === 'approved'; });
    },
    getPending: function() {
      return this.getAll().filter(function(b) { return b.status === 'pending'; });
    }
  };

  // ===== USERS MODULE =====
  var users = {
    getAll: function() { return getData('users', getDefaultUsers); },
    save: function(data) { setData('users', data); },
    add: function(user) {
      var all = this.getAll();
      if (all.find(function(u) { return u.email === user.email; })) return false;
      user.status = 'active';
      user.avatar = user.name.split(' ').map(function(n){return n[0];}).join('').toUpperCase();
      user.createdAt = new Date().toISOString();
      all.push(user);
      this.save(all);
      activity.log('User ' + user.name + ' added');
      return true;
    },
    remove: function(email) {
      var all = this.getAll();
      var filtered = all.filter(function(u) { return u.email !== email; });
      this.save(filtered);
      activity.log('User ' + email + ' removed');
    },
    toggleLeave: function(email) {
      var settings = CWA_Admin.settings.getAll();
      settings.leaveMode[email] = !settings.leaveMode[email];
      CWA_Admin.settings.save(settings);
    }
  };

  // ===== ANNOUNCEMENTS MODULE =====
  var announcements = {
    getAll: function() { return getData('announcements', getDefaultAnnouncements); },
    save: function(data) { setData('announcements', data); },
    add: function(ann) {
      var all = this.getAll();
      ann.id = 'A' + String(all.length + 1).padStart(3, '0');
      ann.createdAt = new Date().toISOString();
      all.unshift(ann);
      this.save(all);
      activity.log('Announcement "' + ann.title + '" created');
      return ann;
    },
    remove: function(id) {
      var all = this.getAll().filter(function(a) { return a.id !== id; });
      this.save(all);
    },
    toggle: function(id) {
      var all = this.getAll();
      var ann = all.find(function(a) { return a.id === id; });
      if (ann) { ann.active = !ann.active; this.save(all); }
    },
    getActive: function() {
      return this.getAll().filter(function(a) { return a.active; });
    },
    getCount: function() {
      return this.getActive().length;
    }
  };

  // ===== SETTINGS MODULE =====
  var settings = {
    getAll: function() { return getData('settings', getDefaultSettings); },
    save: function(data) { setData('settings', data); },
    update: function(key, value) {
      var all = this.getAll();
      all[key] = value;
      this.save(all);
    }
  };

  // ===== ACTIVITY MODULE =====
  var activity = {
    getAll: function() { return getData('activity', getDefaultActivity); },
    save: function(data) { setData('activity', data); },
    log: function(action) {
      var all = this.getAll();
      var session = auth.getSession();
      all.unshift({ action: action, time: new Date().toISOString(), by: session ? session.email : 'system' });
      if (all.length > 50) all = all.slice(0, 50);
      this.save(all);
    }
  };

  // ===== NOTIFICATIONS MODULE =====
  var notifications = {
    getAlerts: function() {
      try { return JSON.parse(localStorage.getItem('cwa_alerts') || '[]'); } catch(e) { return []; }
    },
    addAlert: function(message) {
      var alerts = this.getAlerts();
      alerts.unshift({ message: message, time: new Date().toISOString(), read: false });
      localStorage.setItem('cwa_alerts', JSON.stringify(alerts));
    },
    getUnreadCount: function() {
      return this.getAlerts().filter(function(a) { return !a.read; }).length;
    },
    markAllRead: function() {
      var alerts = this.getAlerts().map(function(a) { a.read = true; return a; });
      localStorage.setItem('cwa_alerts', JSON.stringify(alerts));
    },
    sendEmailNotification: function(lead) {
      var subject = encodeURIComponent('New Lead: ' + lead.name + ' - ' + lead.service);
      var body = encodeURIComponent('Name: ' + lead.name + '\nMobile: ' + lead.mobile + '\nCity: ' + lead.city + '\nService: ' + lead.service + '\nTime: ' + lead.time);
      window.open('mailto:crownwealthadvisor1111@gmail.com?subject=' + subject + '&body=' + body);
    },
    sendWhatsAppNotification: function(lead) {
      var text = encodeURIComponent('New Lead!\nName: ' + lead.name + '\nMobile: ' + lead.mobile + '\nCity: ' + lead.city + '\nService: ' + lead.service);
      window.open('https://wa.me/917428045423?text=' + text);
    },
    testNotification: function() {
      alert('Test notification sent successfully! (Demo mode)');
      this.addAlert('Test notification triggered');
    }
  };

  // ===== ANALYTICS MODULE =====
  var analytics = {
    getLeadsPerDay: function(days) {
      var all = leads.getAll();
      var result = [];
      var now = new Date();
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(now);
        d.setDate(d.getDate() - i);
        var dateStr = d.toISOString().split('T')[0];
        var count = all.filter(function(l) {
          return l.createdAt.split('T')[0] === dateStr;
        }).length;
        result.push({ date: dateStr, count: count });
      }
      return result;
    },
    getSourceBreakdown: function() {
      var all = leads.getAll();
      var sources = {};
      all.forEach(function(l) {
        sources[l.source] = (sources[l.source] || 0) + 1;
      });
      return sources;
    },
    getStatusCounts: function() {
      return leads.getStats();
    }
  };

  // ===== ROLE CHECKING =====
  var roles = {
    applyRoleRestrictions: function() {
      if (!auth.isOwner()) {
        var ownerElements = document.querySelectorAll('[data-role="owner"]');
        ownerElements.forEach(function(el) { el.style.display = 'none'; });
      }
    }
  };

  // ===== UI HELPERS =====
  var ui = {
    initPage: function() {
      if (!auth.checkAuth()) return false;
      roles.applyRoleRestrictions();
      this.updateTopbar();
      this.updateAnnouncementBadge();
      return true;
    },
    updateTopbar: function() {
      var session = auth.getSession();
      var avatarEl = document.querySelector('.topbar-avatar');
      var nameEl = document.querySelector('.topbar-user-name');
      var roleEl = document.querySelector('.topbar-user-role');
      if (avatarEl && session) avatarEl.textContent = session.name.split(' ').map(function(n){return n[0];}).join('');
      if (nameEl && session) nameEl.textContent = session.name;
      if (roleEl && session) roleEl.textContent = session.role;
    },
    updateAnnouncementBadge: function() {
      var badge = document.querySelector('.announcement-badge');
      if (badge) {
        var count = announcements.getCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
      }
    },
    formatDate: function(dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    formatDateTime: function(dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    showModal: function(id) {
      document.getElementById(id).classList.add('active');
    },
    hideModal: function(id) {
      document.getElementById(id).classList.remove('active');
    },
    confirm: function(message, callback) {
      if (window.confirm(message)) callback();
    }
  };

  // Public API
  return {
    auth: auth,
    leads: leads,
    blogs: blogs,
    users: users,
    announcements: announcements,
    settings: settings,
    activity: activity,
    notifications: notifications,
    analytics: analytics,
    roles: roles,
    ui: ui
  };
})();
