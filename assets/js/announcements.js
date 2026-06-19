/**
 * Crown Wealth Advisor - Announcements System
 * Loads active announcements from localStorage and displays in announcement bar
 */
var CWA_Announcements = (function() {
  'use strict';

  function getAnnouncements() {
    try {
      var data = localStorage.getItem('cwa_announcements');
      if (data) return JSON.parse(data);
    } catch(e) {}
    return [];
  }

  function renderAnnouncementBar() {
    var bar = document.getElementById('announcement-bar');
    var textEl = document.getElementById('announcement-text');
    if (!bar || !textEl) return;

    var announcements = getAnnouncements().filter(function(a) { return a.active; });
    if (announcements.length === 0) {
      bar.style.display = 'none';
      return;
    }

    var text = announcements.map(function(a) {
      return a.message;
    }).join('  |  ');

    textEl.textContent = text;
    bar.style.display = 'block';
  }

  return {
    renderAnnouncementBar: renderAnnouncementBar
  };
})();
