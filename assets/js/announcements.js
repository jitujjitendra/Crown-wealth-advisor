/**
 * Crown Wealth Advisor - Announcements Bar
 * Loads ACTIVE announcements from the PHP backend and shows them in the
 * scrolling top bar. Falls back to defaults if the API is unreachable
 * (so the bar still shows something on a fresh deploy).
 */
var CWA_Announcements = (function() {
  'use strict';

  function apiBase() {
    return window.location.pathname.indexOf('/pages/') > -1 ? '../api/' : 'api/';
  }

  function defaults() {
    return [
      { message: 'Get free financial consultation this month! Call +91-7428045423 for personalized insurance and loan guidance.' },
      { message: 'Now offering Loan Against Property advisory services. Compare options from multiple lenders.' },
      { message: 'We are hiring! Join us as a Bajaj or PNB MetLife insurance advisor. Apply now.' }
    ];
  }

  function paint(list) {
    var bar = document.getElementById('announcement-bar');
    var textEl = document.getElementById('announcement-text');
    if (!bar || !textEl) return;

    var active = (list || []).filter(function(a) {
      return a && a.message && (a.active === undefined || a.active == 1 || a.active === true);
    });
    if (active.length === 0) { bar.style.display = 'none'; return; }

    textEl.textContent = active.map(function(a) { return a.message; }).join('   |   ');
    bar.style.display = 'block';
  }

  function renderAnnouncementBar() {
    fetch(apiBase() + 'announcements.php?action=active')
      .then(function(r) { return r.json(); })
      .then(function(resp) {
        if (resp && resp.success && resp.announcements && resp.announcements.length) {
          paint(resp.announcements);
        } else {
          paint(defaults());
        }
      })
      .catch(function() {
        // API not reachable (e.g. opened as plain file) - show defaults
        paint(defaults());
      });
  }

  return { renderAnnouncementBar: renderAnnouncementBar };
})();
