/**
 * Crown Wealth Advisor - Announcements System
 * Loads active announcements from localStorage and displays in announcement bar
 */
var CWA_Announcements = (function() {
  'use strict';

  // Default announcements shown when none are configured in localStorage.
  // These ensure the bar appears on any fresh device/browser (e.g. on Hostinger).
  function getDefaultAnnouncements() {
    return [
      { message: 'Get free financial consultation this month! Call +91-7428045423 for personalized insurance and loan guidance.', active: true },
      { message: 'Now offering Loan Against Property advisory services. Compare options from multiple lenders.', active: true },
      { message: 'We are hiring! Join us as a Bajaj or PNB MetLife insurance advisor. Apply now.', active: true }
    ];
  }

  function getAnnouncements() {
    try {
      var data = localStorage.getItem('cwa_announcements');
      if (data) {
        var parsed = JSON.parse(data);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    // Fallback to defaults so the bar always shows
    return getDefaultAnnouncements();
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
