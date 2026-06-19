/**
 * Crown Wealth Advisor - Announcement System
 * Manages homepage announcements/advertisements
 * Demo mode: works without Firebase configured
 */
(function() {
  'use strict';

  var demoAnnouncements = [
    {
      id: 'ann-demo-1',
      title: 'Special Offer',
      message: 'Get free financial consultation this month! Call +91-7428045423 for personalized insurance and loan guidance.',
      type: 'promotion',
      link: '#consultation',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-demo-2',
      title: 'New Service',
      message: 'Now offering Loan Against Property advisory services. Compare options from multiple lenders.',
      type: 'info',
      link: 'pages/loan-against-property.html',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getAnnouncements() {
    var stored = localStorage.getItem('cwa_announcements');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    localStorage.setItem('cwa_announcements', JSON.stringify(demoAnnouncements));
    return demoAnnouncements;
  }

  function saveAnnouncements(announcements) {
    localStorage.setItem('cwa_announcements', JSON.stringify(announcements));
  }

  function generateId() {
    return 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  }

  function createAnnouncement(data, callback) {
    var announcement = {
      id: generateId(),
      title: data.title || '',
      message: data.message || '',
      type: data.type || 'info',
      link: data.link || '',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || '',
      active: data.active !== undefined ? data.active : true,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      var announcements = getAnnouncements();
      announcements.unshift(announcement);
      saveAnnouncements(announcements);
      if (callback) callback(null, announcement);
      return;
    }

    var db = firebase.firestore();
    db.collection('announcements').add(announcement).then(function(docRef) {
      announcement.id = docRef.id;
      if (callback) callback(null, announcement);
    }).catch(function(err) {
      if (callback) callback(err, null);
    });
  }

  function updateAnnouncement(id, updates, callback) {
    if (!isFirebaseAvailable()) {
      var announcements = getAnnouncements();
      var index = announcements.findIndex(function(a) { return a.id === id; });
      if (index !== -1) {
        Object.assign(announcements[index], updates);
        saveAnnouncements(announcements);
        if (callback) callback(null, announcements[index]);
      } else {
        if (callback) callback(new Error('Not found'), null);
      }
      return;
    }

    var db = firebase.firestore();
    db.collection('announcements').doc(id).update(updates).then(function() {
      if (callback) callback(null, { id: id });
    }).catch(function(err) {
      if (callback) callback(err, null);
    });
  }

  function deleteAnnouncement(id, callback) {
    if (!isFirebaseAvailable()) {
      var announcements = getAnnouncements();
      announcements = announcements.filter(function(a) { return a.id !== id; });
      saveAnnouncements(announcements);
      if (callback) callback(null);
      return;
    }

    var db = firebase.firestore();
    db.collection('announcements').doc(id).delete().then(function() {
      if (callback) callback(null);
    }).catch(function(err) {
      if (callback) callback(err);
    });
  }

  function getActiveAnnouncements() {
    var now = new Date().toISOString().split('T')[0];
    var announcements = getAnnouncements();
    return announcements.filter(function(a) {
      if (!a.active) return false;
      if (a.startDate && a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
      return true;
    });
  }

  // Render announcement bar on homepage
  function renderAnnouncementBar() {
    var active = getActiveAnnouncements();
    if (active.length === 0) return;

    var existingBar = document.getElementById('announcement-bar');
    if (existingBar) existingBar.remove();

    var bar = document.createElement('div');
    bar.id = 'announcement-bar';
    bar.style.cssText = 'background:linear-gradient(135deg,#c9000b,#8e0007);color:#fff;padding:10px 0;overflow:hidden;position:relative;z-index:1001;';

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;z-index:2;padding:4px 8px;';
    closeBtn.onclick = function() { bar.remove(); };
    bar.appendChild(closeBtn);

    var scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'display:flex;animation:scrollAnnouncement 20s linear infinite;white-space:nowrap;padding-right:60px;';

    active.forEach(function(a) {
      var item = document.createElement('span');
      item.style.cssText = 'display:inline-flex;align-items:center;gap:12px;padding:0 40px;font-size:0.9rem;font-weight:600;';
      var text = a.title ? a.title + ': ' + a.message : a.message;
      if (a.link) {
        item.innerHTML = '<span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:0.75rem;">' + (a.type || 'INFO').toUpperCase() + '</span> ' +
          '<a href="' + a.link + '" style="color:#fff;text-decoration:underline;">' + text + '</a>';
      } else {
        item.innerHTML = '<span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:0.75rem;">' + (a.type || 'INFO').toUpperCase() + '</span> ' + text;
      }
      scrollContainer.appendChild(item);
    });

    // Duplicate for seamless loop
    var clone = scrollContainer.cloneNode(true);
    scrollContainer.innerHTML += scrollContainer.innerHTML;

    bar.appendChild(scrollContainer);

    // Add CSS animation
    var style = document.createElement('style');
    style.textContent = '@keyframes scrollAnnouncement{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}';
    document.head.appendChild(style);

    // Insert at top of body
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Expose globally
  window.CWA_Announcements = {
    getAnnouncements: getAnnouncements,
    saveAnnouncements: saveAnnouncements,
    createAnnouncement: createAnnouncement,
    updateAnnouncement: updateAnnouncement,
    deleteAnnouncement: deleteAnnouncement,
    getActiveAnnouncements: getActiveAnnouncements,
    renderAnnouncementBar: renderAnnouncementBar
  };
})();
