/**
 * Crown Wealth Advisor - Feature Configuration System
 * Handles feature toggles and phase management
 * Demo mode: works without Firebase configured
 */
(function() {
  'use strict';

  var DEFAULT_FEATURES = {
    blog: { enabled: true, label: 'Blog System', description: 'Blog creation, approval, and publishing' },
    analytics: { enabled: true, label: 'Analytics Dashboard', description: 'Lead analytics and charts' },
    notifications: { enabled: true, label: 'Notifications', description: 'Email and WhatsApp notifications' },
    leadAssignment: { enabled: true, label: 'Lead Auto-Assignment', description: 'Automatic lead distribution' },
    announcements: { enabled: true, label: 'Announcements', description: 'Homepage announcement bar' },
    userManagement: { enabled: true, label: 'User Management', description: 'Add/remove admin users' },
    exportReports: { enabled: true, label: 'Export Reports', description: 'Excel/CSV export functionality' }
  };

  var DEFAULT_PHASES = [
    { id: 'phase-1', name: 'Phase 1: Core CRM', description: 'Lead management, admin panel, basic dashboard', status: 'active', startDate: '2024-01-01' },
    { id: 'phase-2', name: 'Phase 2: Blog & Content', description: 'Blog system, TinyMCE editor, approval workflow', status: 'active', startDate: '2024-02-01' },
    { id: 'phase-3', name: 'Phase 3: Automation', description: 'Lead auto-assignment, notifications, analytics', status: 'active', startDate: '2024-03-01' },
    { id: 'phase-4', name: 'Phase 4: Advanced', description: 'Multi-tenant, API integrations, mobile app', status: 'planned', startDate: '2024-06-01' }
  ];

  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getFeatures() {
    var stored = localStorage.getItem('cwa_features');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    localStorage.setItem('cwa_features', JSON.stringify(DEFAULT_FEATURES));
    return JSON.parse(JSON.stringify(DEFAULT_FEATURES));
  }

  function saveFeatures(features) {
    localStorage.setItem('cwa_features', JSON.stringify(features));

    if (isFirebaseAvailable()) {
      var db = firebase.firestore();
      db.collection('settings').doc('features').set(features).catch(function(err) {
        console.error('Failed to save features to Firestore:', err);
      });
    }
  }

  function getPhases() {
    var stored = localStorage.getItem('cwa_phases');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    localStorage.setItem('cwa_phases', JSON.stringify(DEFAULT_PHASES));
    return JSON.parse(JSON.stringify(DEFAULT_PHASES));
  }

  function savePhases(phases) {
    localStorage.setItem('cwa_phases', JSON.stringify(phases));

    if (isFirebaseAvailable()) {
      var db = firebase.firestore();
      db.collection('settings').doc('phases').set({ phases: phases }).catch(function(err) {
        console.error('Failed to save phases to Firestore:', err);
      });
    }
  }

  function isFeatureEnabled(featureKey) {
    var features = getFeatures();
    if (features[featureKey]) {
      return features[featureKey].enabled;
    }
    return true; // Default to enabled if not found
  }

  function toggleFeature(featureKey, enabled) {
    var features = getFeatures();
    if (features[featureKey]) {
      features[featureKey].enabled = enabled;
      saveFeatures(features);
    }
    return features;
  }

  function loadFromFirestore(callback) {
    if (!isFirebaseAvailable()) {
      if (callback) callback({ features: getFeatures(), phases: getPhases() });
      return;
    }

    var db = firebase.firestore();
    Promise.all([
      db.collection('settings').doc('features').get(),
      db.collection('settings').doc('phases').get()
    ]).then(function(results) {
      var features = results[0].exists ? results[0].data() : getFeatures();
      var phasesDoc = results[1].exists ? results[1].data() : { phases: getPhases() };
      localStorage.setItem('cwa_features', JSON.stringify(features));
      localStorage.setItem('cwa_phases', JSON.stringify(phasesDoc.phases || DEFAULT_PHASES));
      if (callback) callback({ features: features, phases: phasesDoc.phases || DEFAULT_PHASES });
    }).catch(function() {
      if (callback) callback({ features: getFeatures(), phases: getPhases() });
    });
  }

  // Check if a nav item should be shown based on feature flags
  function applyFeatureFlags() {
    var features = getFeatures();
    var navItems = document.querySelectorAll('[data-feature]');
    navItems.forEach(function(el) {
      var featureKey = el.getAttribute('data-feature');
      if (features[featureKey] && !features[featureKey].enabled) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }

  // Expose globally
  window.CWA_FeatureConfig = {
    getFeatures: getFeatures,
    saveFeatures: saveFeatures,
    getPhases: getPhases,
    savePhases: savePhases,
    isFeatureEnabled: isFeatureEnabled,
    toggleFeature: toggleFeature,
    loadFromFirestore: loadFromFirestore,
    applyFeatureFlags: applyFeatureFlags
  };
})();
