/**
 * Crown Wealth Advisor - Role Permissions System
 * Handles Owner and Admin role-based access control
 * Demo mode: works without Firebase configured
 */
(function() {
  'use strict';

  var ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin'
  };

  var PERMISSIONS = {
    // Lead management
    VIEW_LEADS: [ROLES.OWNER, ROLES.ADMIN],
    EDIT_LEADS: [ROLES.OWNER, ROLES.ADMIN],
    DELETE_LEADS: [ROLES.OWNER],
    EXPORT_LEADS: [ROLES.OWNER],
    COMMENT_LEADS: [ROLES.OWNER, ROLES.ADMIN],
    UPDATE_STATUS: [ROLES.OWNER, ROLES.ADMIN],

    // Blog management
    SUBMIT_BLOG: [ROLES.OWNER, ROLES.ADMIN],
    APPROVE_BLOG: [ROLES.OWNER],
    DELETE_BLOG: [ROLES.OWNER],
    EDIT_ANY_BLOG: [ROLES.OWNER],

    // User management
    MANAGE_USERS: [ROLES.OWNER],
    VIEW_USERS: [ROLES.OWNER],

    // Settings and configuration
    ACCESS_SETTINGS: [ROLES.OWNER],
    MANAGE_FEATURES: [ROLES.OWNER],
    MANAGE_ANNOUNCEMENTS: [ROLES.OWNER, ROLES.ADMIN],

    // Analytics
    VIEW_ANALYTICS: [ROLES.OWNER, ROLES.ADMIN],
    EXPORT_REPORTS: [ROLES.OWNER],

    // Notifications
    MANAGE_NOTIFICATIONS: [ROLES.OWNER],

    // Lead assignment
    MANAGE_ASSIGNMENT: [ROLES.OWNER],
    VIEW_ASSIGNMENT: [ROLES.OWNER, ROLES.ADMIN]
  };

  // Demo mode user (used when Firebase is not configured)
  var demoUser = {
    uid: 'demo-owner-001',
    email: 'crownwealthadvisor1111@gmail.com',
    displayName: 'Demo Owner',
    role: ROLES.OWNER
  };

  var currentUser = null;

  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getCurrentUser() {
    if (currentUser) return currentUser;
    
    // Try to get from session storage
    var stored = sessionStorage.getItem('cwa_current_user');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch(e) {}
    }

    // Fall back to demo user
    currentUser = demoUser;
    sessionStorage.setItem('cwa_current_user', JSON.stringify(currentUser));
    return currentUser;
  }

  function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('cwa_current_user', JSON.stringify(user));
  }

  function getUserRole() {
    var user = getCurrentUser();
    return user ? user.role : null;
  }

  function hasPermission(permission) {
    var role = getUserRole();
    if (!role) return false;
    var allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.indexOf(role) !== -1;
  }

  function isOwner() {
    return getUserRole() === ROLES.OWNER;
  }

  function isAdmin() {
    return getUserRole() === ROLES.ADMIN;
  }

  function enforcePermission(permission) {
    if (!hasPermission(permission)) {
      alert('Access Denied: You do not have permission to perform this action.');
      return false;
    }
    return true;
  }

  function hideElementsWithoutPermission() {
    // Hide elements with data-permission attribute
    var elements = document.querySelectorAll('[data-permission]');
    elements.forEach(function(el) {
      var permission = el.getAttribute('data-permission');
      if (!hasPermission(permission)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });

    // Hide elements with data-role-only attribute
    var roleElements = document.querySelectorAll('[data-role-only]');
    roleElements.forEach(function(el) {
      var requiredRole = el.getAttribute('data-role-only');
      if (getUserRole() !== requiredRole) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }

  function checkPageAccess(requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;"><h1 style="color:#c9000b;">Access Denied</h1><p>You do not have permission to access this page.</p><a href="dashboard.html" style="color:#c9000b;text-decoration:underline;">Return to Dashboard</a></div>';
      return false;
    }
    return true;
  }

  // Load user role from Firestore (or demo)
  function loadUserRole(callback) {
    if (!isFirebaseAvailable()) {
      setCurrentUser(demoUser);
      if (callback) callback(demoUser);
      return;
    }

    var auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }

      var db = firebase.firestore();
      db.collection('users').doc(user.uid).get().then(function(doc) {
        var userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: doc.exists ? (doc.data().role || ROLES.ADMIN) : ROLES.ADMIN
        };
        setCurrentUser(userData);
        if (callback) callback(userData);
      }).catch(function() {
        var userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: ROLES.ADMIN
        };
        setCurrentUser(userData);
        if (callback) callback(userData);
      });
    });
  }

  // Expose globally
  window.CWA_Permissions = {
    ROLES: ROLES,
    PERMISSIONS: PERMISSIONS,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    getUserRole: getUserRole,
    hasPermission: hasPermission,
    isOwner: isOwner,
    isAdmin: isAdmin,
    enforcePermission: enforcePermission,
    hideElementsWithoutPermission: hideElementsWithoutPermission,
    checkPageAccess: checkPageAccess,
    loadUserRole: loadUserRole,
    isFirebaseAvailable: isFirebaseAvailable
  };
})();
