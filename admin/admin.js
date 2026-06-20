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
    ui.applyRole();
    ui.updateTopbar();
    return user;
  }

  function isOwner() {
    return !!(currentUser && currentUser.role === 'owner');
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
      if (roleEl) roleEl.textContent = session.role;
    },
    applyRole: function() {
      if (!isOwner()) {
        var ownerElements = document.querySelectorAll('[data-role="owner"]');
        ownerElements.forEach(function(el) { el.style.display = 'none'; });
      }
    }
  };

  // Public API
  return {
    api: api,
    auth: auth,
    guardPage: guardPage,
    isOwner: isOwner,
    getCurrentUser: getCurrentUser,
    leads: leads,
    blogs: blogs,
    upload: upload,
    users: users,
    announcements: announcements,
    settings: settings,
    analytics: analytics,
    ui: ui
  };
})();
