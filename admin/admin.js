/**
 * Crown Wealth Advisor - Admin Panel
 * Async API client. All data comes from the PHP backend in /api/.
 * Exposes a global CWA_Admin object whose methods are async and return
 * the inner data of each API response.
 */

var CWA_Admin = (function() {
  'use strict';

  // Cached current user (populated by auth.login / auth.session / guardPage)
  var currentUser = null;

  // ===== CORE API CLIENT =====
  async function api(file, action, params, method) {
    method = method || 'GET';
    var url = '../api/' + file + '.php?action=' + encodeURIComponent(action);
    var options = {
      method: method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (method === 'POST') {
      options.body = JSON.stringify(params || {});
    }
    var res = await fetch(url, options);
    var data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Server returned an invalid response.');
    }
    if (!data || !data.success) {
      throw new Error((data && data.error) || 'Request failed');
    }
    return data;
  }

  // ===== AUTH MODULE =====
  var auth = {
    login: async function(email, password) {
      var data = await api('auth', 'login', { email: email, password: password }, 'POST');
      currentUser = data.user;
      return data.user;
    },
    logout: async function() {
      try {
        await api('auth', 'logout', {}, 'POST');
      } catch (e) { /* ignore network errors on logout */ }
      currentUser = null;
      window.location.href = 'index.html';
    },
    session: async function() {
      var data = await api('auth', 'session', null, 'GET');
      currentUser = data.user || null;
      return currentUser;
    }
  };

  // ===== PAGE GUARD =====
  // Pages each role is allowed to open
  var AGENT_PAGES = ['dashboard.html', 'lead-details.html', 'blog-write.html', 'support-tickets.html', 'index.html', ''];

  async function guardPage() {
    var user;
    try {
      user = await auth.session();
    } catch (e) {
      user = null;
    }
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    currentUser = user;
    // Page-access enforcement for agents
    if (user.role === 'agent') {
      var page = window.location.pathname.split('/').pop();
      if (AGENT_PAGES.indexOf(page) === -1) {
        window.location.href = 'dashboard.html';
        return null;
      }
    }
    ui.applyRole();
    ui.updateTopbar();
    return user;
  }

  function isOwner() {
    return !!(currentUser && currentUser.role === 'owner');
  }

  function isFull() {
    return !!(currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin'));
  }

  function isAgent() {
    return !!(currentUser && currentUser.role === 'agent');
  }

  function getCurrentUser() {
    return currentUser;
  }

  // ===== LEADS MODULE =====
  var leads = {
    list: async function(status, search) {
      var qs = 'list';
      var extra = [];
      if (status) extra.push('status=' + encodeURIComponent(status));
      if (search) extra.push('search=' + encodeURIComponent(search));
      // build full action+query via direct fetch helper
      var data = await apiQuery('leads', qs, extra);
      return data.leads;
    },
    get: async function(id) {
      var data = await apiQuery('leads', 'get', ['id=' + encodeURIComponent(id)]);
      return data.lead;
    },
    create: async function(payload) {
      return await api('leads', 'create', payload, 'POST');
    },
    update: async function(payload) {
      return await api('leads', 'update', payload, 'POST');
    },
    followup: async function(id, next, last) {
      var payload = { id: id, next_follow_up: next || '' };
      if (last) payload.last_follow_up = last;
      return await api('leads', 'followup', payload, 'POST');
    },
    importLeads: async function(rows) {
      return await api('leads', 'import', { rows: rows }, 'POST');
    },
    setStatus: async function(id, status) {
      return await api('leads', 'status', { id: id, status: status }, 'POST');
    },
    assign: async function(id, to) {
      return await api('leads', 'assign', { id: id, assigned_to: to }, 'POST');
    },
    comment: async function(id, text) {
      return await api('leads', 'comment', { id: id, text: text }, 'POST');
    },
    remove: async function(id) {
      return await api('leads', 'delete', { id: id }, 'POST');
    },
    stats: async function() {
      var data = await api('leads', 'stats', null, 'GET');
      return data.stats;
    }
  };

  // ===== BLOGS MODULE =====
  var blogs = {
    list: async function(status) {
      var extra = [];
      if (status) extra.push('status=' + encodeURIComponent(status));
      var data = await apiQuery('blogs', 'list', extra);
      return data.blogs;
    },
    get: async function(id) {
      var data = await apiQuery('blogs', 'get', ['id=' + encodeURIComponent(id)]);
      return data.blog;
    },
    published: async function() {
      var data = await api('blogs', 'published', null, 'GET');
      return data.blogs;
    },
    save: async function(payload) {
      var data = await api('blogs', 'save', payload, 'POST');
      return data.id;
    },
    approve: async function(id) {
      return await api('blogs', 'approve', { id: id }, 'POST');
    },
    reject: async function(id, reason) {
      return await api('blogs', 'reject', { id: id, reason: reason }, 'POST');
    },
    publish: async function(id) {
      return await api('blogs', 'publish', { id: id }, 'POST');
    },
    unpublish: async function(id) {
      return await api('blogs', 'unpublish', { id: id }, 'POST');
    },
    remove: async function(id) {
      return await api('blogs', 'delete', { id: id }, 'POST');
    }
  };

  // ===== UPLOAD MODULE =====
  var upload = {
    image: async function(dataUrl) {
      var data = await api('upload', 'image', { dataUrl: dataUrl }, 'POST');
      return { url: data.url, size: data.size };
    }
  };

  // ===== USERS MODULE =====
  var users = {
    list: async function() {
      var data = await api('users', 'list', null, 'GET');
      return data.users;
    },
    add: async function(payload) {
      return await api('users', 'add', payload, 'POST');
    },
    remove: async function(id) {
      return await api('users', 'delete', { id: id }, 'POST');
    },
    setPassword: async function(id, password) {
      return await api('users', 'password', { id: id, password: password }, 'POST');
    },
    toggleStatus: async function(id) {
      return await api('users', 'toggle_status', { id: id }, 'POST');
    }
  };

  // ===== ANNOUNCEMENTS MODULE =====
  var announcements = {
    active: async function() {
      var data = await api('announcements', 'active', null, 'GET');
      return data.announcements;
    },
    list: async function() {
      var data = await api('announcements', 'list', null, 'GET');
      return data.announcements;
    },
    save: async function(payload) {
      var data = await api('announcements', 'save', payload, 'POST');
      return data.id;
    },
    toggle: async function(id) {
      return await api('announcements', 'toggle', { id: id }, 'POST');
    },
    remove: async function(id) {
      return await api('announcements', 'delete', { id: id }, 'POST');
    }
  };

  // ===== SETTINGS MODULE =====
  var settings = {
    all: async function() {
      var data = await api('settings', 'all', null, 'GET');
      return data.settings || {};
    },
    save: async function(key, value) {
      return await api('settings', 'save', { key: key, value: value }, 'POST');
    }
  };

  // ===== BLOG TOPICS MODULE =====
  var topics = {
    list: async function() {
      var data = await api('topics', 'list', null, 'GET');
      return data.topics;
    },
    create: async function(payload) {
      var data = await api('topics', 'create', payload, 'POST');
      return data.id;
    },
    setStatus: async function(id, status) {
      return await api('topics', 'status', { id: id, status: status }, 'POST');
    },
    remove: async function(id) {
      return await api('topics', 'delete', { id: id }, 'POST');
    }
  };

  // ===== SUPPORT TICKETS MODULE =====
  var tickets = {
    list: async function(status, search) {
      var extra = [];
      if (status) extra.push('status=' + encodeURIComponent(status));
      if (search) extra.push('search=' + encodeURIComponent(search));
      var data = await apiQuery('support', 'list', extra);
      return data.tickets;
    },
    get: async function(id) {
      var data = await apiQuery('support', 'get', ['id=' + encodeURIComponent(id)]);
      return data.ticket;
    },
    create: async function(payload) {
      return await api('support', 'create', payload, 'POST');
    },
    setStatus: async function(id, status) {
      return await api('support', 'status', { id: id, status: status }, 'POST');
    },
    assign: async function(id, to) {
      return await api('support', 'assign', { id: id, assigned_to: to }, 'POST');
    },
    comment: async function(id, text) {
      return await api('support', 'comment', { id: id, text: text }, 'POST');
    },
    remove: async function(id) {
      return await api('support', 'delete', { id: id }, 'POST');
    },
    stats: async function() {
      var data = await api('support', 'stats', null, 'GET');
      return data.stats;
    }
  };

  // ===== PROMOTIONS MODULE =====
  var promotions = {
    active: async function() {
      var data = await api('promotions', 'active', null, 'GET');
      return data.promotions;
    },
    list: async function() {
      var data = await api('promotions', 'list', null, 'GET');
      return data.promotions;
    },
    save: async function(payload) {
      var data = await api('promotions', 'save', payload, 'POST');
      return data.id;
    },
    toggle: async function(id) {
      return await api('promotions', 'toggle', { id: id }, 'POST');
    },
    remove: async function(id) {
      return await api('promotions', 'delete', { id: id }, 'POST');
    }
  };

  // ===== TICKET STATUS CONSTANTS =====
  var TICKET_STATUSES = [
    { value: 'new', label: 'New' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'documents_required', label: 'Documents Required' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];
  function ticketStatusLabel(v) {
    for (var i = 0; i < TICKET_STATUSES.length; i++) { if (TICKET_STATUSES[i].value === v) return TICKET_STATUSES[i].label; }
    return v;
  }
  function ticketStatusOptions(selected) {
    return TICKET_STATUSES.map(function(s) {
      return '<option value="' + s.value + '"' + (s.value === selected ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');
  }

  // ===== LEAD STATUS CONSTANTS =====
  var STATUSES = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'documents_pending', label: 'Documents Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'approved', label: 'Approved' },
    { value: 'converted', label: 'Converted' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' }
  ];
  function statusLabel(v) {
    for (var i = 0; i < STATUSES.length; i++) { if (STATUSES[i].value === v) return STATUSES[i].label; }
    return v;
  }
  function statusOptions(selected) {
    return STATUSES.map(function(s) {
      return '<option value="' + s.value + '"' + (s.value === selected ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');
  }

  // ===== ANALYTICS MODULE =====
  var analytics = {
    summary: async function() {
      // returns full data object: { stats, successRate, overall, sources }
      return await api('analytics', 'summary', null, 'GET');
    },
    trend: async function(period) {
      var data = await apiQuery('analytics', 'trend', ['period=' + encodeURIComponent(period || 'daily')]);
      return data.trend;
    },
    activity: async function() {
      var data = await api('analytics', 'activity', null, 'GET');
      return data.activity;
    },
    agentPerformance: async function() {
      var data = await api('analytics', 'agent_performance', null, 'GET');
      return data.agents;
    },
    serviceBreakdown: async function() {
      var data = await api('analytics', 'service_breakdown', null, 'GET');
      return data.services;
    },
    adminDashboard: async function() {
      var data = await api('analytics', 'admin_dashboard', null, 'GET');
      return data.cards;
    }
  };

  // Helper for GET requests that need extra query params beyond action
  async function apiQuery(file, action, extraParams) {
    var url = '../api/' + file + '.php?action=' + encodeURIComponent(action);
    if (extraParams && extraParams.length) {
      url += '&' + extraParams.join('&');
    }
    var res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    var data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Server returned an invalid response.');
    }
    if (!data || !data.success) {
      throw new Error((data && data.error) || 'Request failed');
    }
    return data;
  }

  // ===== UI HELPERS =====
  var ui = {
    escapeHtml: function(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    formatDate: function(dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr.replace ? dateStr.replace(' ', 'T') : dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    formatDateTime: function(dateStr) {
      if (!dateStr) return '-';
      var d = new Date(dateStr.replace ? dateStr.replace(' ', 'T') : dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    showModal: function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('active');
    },
    hideModal: function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active');
    },
    initials: function(name) {
      if (!name) return '';
      return name.split(' ').map(function(n) { return n[0] || ''; }).join('').toUpperCase().slice(0, 2);
    },
    updateTopbar: function() {
      var session = currentUser;
      if (!session) return;
      var avatarEl = document.querySelector('.topbar-avatar');
      var nameEl = document.querySelector('.topbar-user-name');
      var roleEl = document.querySelector('.topbar-user-role');
      if (avatarEl) avatarEl.textContent = ui.initials(session.name);
      if (nameEl) nameEl.textContent = session.name;
      if (roleEl) roleEl.textContent = 'Admin';

      // Mobile menu toggle (inject once)
      if (!document.getElementById('mobileMenuBtn')) {
        var topbar = document.querySelector('.admin-topbar');
        var sidebar = document.querySelector('.admin-sidebar');
        if (topbar && sidebar) {
          // Add hamburger button to topbar
          var btn = document.createElement('button');
          btn.className = 'mobile-menu-btn';
          btn.id = 'mobileMenuBtn';
          btn.innerHTML = '<span></span><span></span><span></span>';
          topbar.insertBefore(btn, topbar.firstChild);

          // Add overlay
          var overlay = document.createElement('div');
          overlay.className = 'sidebar-overlay';
          overlay.id = 'sidebarOverlay';
          document.body.appendChild(overlay);

          // Toggle logic
          btn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
          });
          overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
          });
          // Close sidebar when any nav link is clicked (mobile)
          sidebar.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
              sidebar.classList.remove('open');
              overlay.classList.remove('active');
            });
          });
        }
      }
    },
    applyRole: function() {
      var role = currentUser ? currentUser.role : '';
      // "owner"-tagged elements (Users, Settings) are full-control features:
      // visible to owner AND admin, hidden only from agents.
      if (role === 'agent') {
        document.querySelectorAll('[data-role="owner"]').forEach(function(el) { el.style.display = 'none'; });
      }
      // Agent: restrict sidebar to Dashboard + Leads + Write Blog only
      if (role === 'agent') {
        var allowed = ['dashboard.html', 'lead-details.html', 'blog-write.html', 'support-tickets.html'];
        document.querySelectorAll('.sidebar-nav a').forEach(function(a) {
          var raw = a.getAttribute('href') || '';
          var href = raw.split('/').pop();
          if (raw === '#' || raw === '../index.html') return; // keep View Website + Logout
          if (allowed.indexOf(href) === -1) a.style.display = 'none';
        });
        // Hide section labels except "Main"
        document.querySelectorAll('.sidebar-section').forEach(function(s) {
          var t = s.textContent.trim();
          if (t !== 'Main' && t !== 'Content') s.style.display = 'none';
        });
        // Hide elements marked staff-only (assign, delete, approve, etc.)
        document.querySelectorAll('[data-role="staff"]').forEach(function(el) { el.style.display = 'none'; });
      }
    }
  };

  // Public API
  return {
    api: api,
    auth: auth,
    guardPage: guardPage,
    isOwner: isOwner,
    isFull: isFull,
    isAgent: isAgent,
    getCurrentUser: getCurrentUser,
    leads: leads,
    blogs: blogs,
    upload: upload,
    users: users,
    announcements: announcements,
    settings: settings,
    topics: topics,
    tickets: tickets,
    promotions: promotions,
    STATUSES: STATUSES,
    statusLabel: statusLabel,
    statusOptions: statusOptions,
    TICKET_STATUSES: TICKET_STATUSES,
    ticketStatusLabel: ticketStatusLabel,
    ticketStatusOptions: ticketStatusOptions,
    analytics: analytics,
    ui: ui
  };
})();
