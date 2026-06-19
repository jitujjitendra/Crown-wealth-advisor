/**
 * Crown Wealth Advisor - Notifications System
 * Handles email (EmailJS) and WhatsApp notification generation
 * Demo mode: works without external services configured
 */
(function() {
  'use strict';

  var DEFAULT_PREFERENCES = {
    emailOnNewLead: true,
    whatsappOnNewLead: true,
    dailySummary: true,
    summaryTime: '09:00',
    summaryEmail: 'crownwealthadvisor1111@gmail.com',
    whatsappNumber: '917428045423',
    emailServiceId: '',
    emailTemplateId: '',
    emailPublicKey: ''
  };

  function getPreferences() {
    var stored = localStorage.getItem('cwa_notification_prefs');
    if (stored) {
      try { return JSON.assign({}, DEFAULT_PREFERENCES, JSON.parse(stored)); } catch(e) {}
    }
    return Object.assign({}, DEFAULT_PREFERENCES);
  }

  function savePreferences(prefs) {
    localStorage.setItem('cwa_notification_prefs', JSON.stringify(prefs));
  }

  function isEmailJSAvailable() {
    return typeof emailjs !== 'undefined';
  }

  // Send email notification using EmailJS
  function sendEmailNotification(lead, callback) {
    var prefs = getPreferences();
    if (!prefs.emailOnNewLead) {
      if (callback) callback(null, { skipped: true, reason: 'Email notifications disabled' });
      return;
    }

    if (!isEmailJSAvailable() || !prefs.emailServiceId || !prefs.emailTemplateId) {
      // Demo mode - log the notification
      console.log('[DEMO] Email notification would be sent for lead:', lead.name);
      if (callback) callback(null, { demo: true, message: 'Email notification simulated (EmailJS not configured)' });
      return;
    }

    var templateParams = {
      lead_name: lead.name || 'Unknown',
      lead_phone: lead.mobile || lead.phone || '',
      lead_email: lead.email || '',
      lead_service: lead.service || '',
      lead_city: lead.city || '',
      lead_time: lead.time || '',
      lead_source: lead.source || 'Website',
      submitted_at: new Date().toLocaleString('en-IN')
    };

    emailjs.send(prefs.emailServiceId, prefs.emailTemplateId, templateParams, prefs.emailPublicKey)
      .then(function(response) {
        if (callback) callback(null, response);
      })
      .catch(function(error) {
        if (callback) callback(error, null);
      });
  }

  // Generate WhatsApp notification link
  function generateWhatsAppLink(lead) {
    var prefs = getPreferences();
    var message = 'New Lead Alert!\n\n' +
      'Name: ' + (lead.name || 'N/A') + '\n' +
      'Phone: ' + (lead.mobile || lead.phone || 'N/A') + '\n' +
      'Service: ' + (lead.service || 'N/A') + '\n' +
      'City: ' + (lead.city || 'N/A') + '\n' +
      'Preferred Time: ' + (lead.time || 'N/A') + '\n' +
      'Source: ' + (lead.source || 'Website') + '\n' +
      'Submitted: ' + new Date().toLocaleString('en-IN');

    var encoded = encodeURIComponent(message);
    return 'https://wa.me/' + prefs.whatsappNumber + '?text=' + encoded;
  }

  // Send WhatsApp notification (opens link)
  function sendWhatsAppNotification(lead) {
    var prefs = getPreferences();
    if (!prefs.whatsappOnNewLead) {
      console.log('[DEMO] WhatsApp notification skipped (disabled)');
      return null;
    }

    var link = generateWhatsAppLink(lead);
    console.log('[NOTIFICATION] WhatsApp link generated:', link);
    return link;
  }

  // Notify on new lead (combined)
  function notifyNewLead(lead, callback) {
    var results = { email: null, whatsapp: null };

    sendEmailNotification(lead, function(err, result) {
      results.email = err ? { error: err.message } : result;
      results.whatsapp = generateWhatsAppLink(lead);
      if (callback) callback(results);
    });
  }

  // Daily summary (triggered by admin manually or via scheduled function)
  function generateDailySummary(leads) {
    var today = new Date().toISOString().split('T')[0];
    var todayLeads = leads.filter(function(l) {
      return l.createdAt && l.createdAt.split('T')[0] === today;
    });

    return {
      date: today,
      totalLeads: todayLeads.length,
      byService: todayLeads.reduce(function(acc, l) {
        var svc = l.service || 'Other';
        acc[svc] = (acc[svc] || 0) + 1;
        return acc;
      }, {}),
      byStatus: todayLeads.reduce(function(acc, l) {
        var st = l.status || 'new';
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {}),
      leads: todayLeads
    };
  }

  // Get notification log (demo)
  function getNotificationLog() {
    var stored = localStorage.getItem('cwa_notification_log');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    return [];
  }

  function addToNotificationLog(entry) {
    var log = getNotificationLog();
    log.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: entry.type || 'general',
      message: entry.message || '',
      status: entry.status || 'sent'
    });
    // Keep only last 100 entries
    if (log.length > 100) log = log.slice(0, 100);
    localStorage.setItem('cwa_notification_log', JSON.stringify(log));
  }

  // Expose globally
  window.CWA_Notifications = {
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    sendEmailNotification: sendEmailNotification,
    generateWhatsAppLink: generateWhatsAppLink,
    sendWhatsAppNotification: sendWhatsAppNotification,
    notifyNewLead: notifyNewLead,
    generateDailySummary: generateDailySummary,
    getNotificationLog: getNotificationLog,
    addToNotificationLog: addToNotificationLog
  };
})();
