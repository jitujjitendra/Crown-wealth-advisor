/**
 * Form Handler with EmailJS Integration
 * Production-ready form submission handling
 */

(function() {
  'use strict';

  // EmailJS Configuration
  // Replace these with your actual EmailJS credentials after setup
  const EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
    templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
    publicKey: 'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
  };

  // Initialize EmailJS when the library loads
  function initEmailJS() {
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      console.log('EmailJS initialized successfully');
      return true;
    }
    return false;
  }

  // Determine lead source from current page
  function getLeadSource(form) {
    const path = window.location.pathname;
    if (path.indexOf('bajaj-careers') > -1) return 'Bajaj Careers';
    if (path.indexOf('pnb-careers') > -1) return 'PNB Careers';
    if (path.indexOf('claim-support') > -1) return 'Claim Support';
    if (form.getAttribute('data-source')) return form.getAttribute('data-source');
    return 'website';
  }

  // Save lead to localStorage (shared with admin panel - cwa_leads)
  function saveLeadToStore(data, form) {
    try {
      var leads = [];
      var existing = localStorage.getItem('cwa_leads');
      if (existing) {
        leads = JSON.parse(existing);
      }

      var lead = {
        id: 'L' + String(leads.length + 1).padStart(3, '0'),
        name: data.name || data.fullName || 'Unknown',
        mobile: data.mobile || data.phone || data.tel || '',
        email: data.email || '',
        city: data.city || '',
        service: data.service || data.serviceType || 'General Inquiry',
        time: data.time || data.callbackTime || 'Anytime',
        message: data.message || '',
        status: 'new',
        assignedTo: '',
        comments: [],
        createdAt: new Date().toISOString(),
        source: getLeadSource(form)
      };

      leads.unshift(lead);
      localStorage.setItem('cwa_leads', JSON.stringify(leads));

      // Add to activity log
      try {
        var activity = [];
        var actExisting = localStorage.getItem('cwa_activity');
        if (actExisting) activity = JSON.parse(actExisting);
        activity.unshift({
          action: 'New lead ' + lead.id + ' from ' + lead.name + ' (' + lead.source + ')',
          time: new Date().toISOString(),
          by: 'website'
        });
        localStorage.setItem('cwa_activity', JSON.stringify(activity));
      } catch (e) {}

      console.log('Lead saved to admin panel:', lead.id);
      return lead;
    } catch (e) {
      console.error('Failed to save lead:', e);
      return null;
    }
  }

  // Generate notification links (Email + WhatsApp) for the owner
  function notifyOwner(lead) {
    if (!lead) return;
    var adminPhone = '917428045423';
    var msg = 'New Lead Received!%0A%0AName: ' + encodeURIComponent(lead.name) +
              '%0AMobile: ' + encodeURIComponent(lead.mobile) +
              '%0ACity: ' + encodeURIComponent(lead.city) +
              '%0AService: ' + encodeURIComponent(lead.service) +
              '%0ASource: ' + encodeURIComponent(lead.source);
    // Store the WhatsApp notify link so admin can forward (used in demo mode)
    var waLink = 'https://wa.me/' + adminPhone + '?text=' + msg;
    try {
      localStorage.setItem('cwa_lastNotifyLink', waLink);
    } catch (e) {}
    console.log('Owner notification link generated (WhatsApp):', waLink);
  }

  // Form submission handler
  function handleFormSubmit(form, formMessage) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // ALWAYS save the lead to the admin panel store (works in demo mode)
    const savedLead = saveLeadToStore(data, form);
    notifyOwner(savedLead);

    // Check if EmailJS is configured
    if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
      // Fallback: Show success message without actual sending
      showMessage(formMessage, 'Thank you! Your request has been received. We will contact you soon.', 'success');
      form.reset();
      
      // Log to console for testing
      console.log('Form Data (saved to admin panel):', data);
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Sending...';

    // Send email using EmailJS
    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      from_name: data.name || data.fullName,
      from_email: data.email,
      from_phone: data.phone,
      service_type: data.service || 'General Inquiry',
      message: data.message || `New lead from ${data.name || 'Unknown'}`,
      to_name: 'Crown Wealth Advisor Team'
    })
    .then(function(response) {
      console.log('Email sent successfully:', response);
      showMessage(formMessage, 'Thank you! Your request has been sent successfully. We will contact you within 24 hours.', 'success');
      form.reset();
      
      // Track conversion (if Google Analytics is available)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submission', {
          'event_category': 'Lead Generation',
          'event_label': data.service || 'General',
          'value': 1
        });
      }
    })
    .catch(function(error) {
      console.error('Email send failed:', error);
      showMessage(formMessage, 'Sorry, something went wrong. Please try again or contact us directly.', 'error');
    })
    .finally(function() {
      // Restore button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    });
  }

  // Show message to user
  function showMessage(messageElement, text, type) {
    if (!messageElement) return;

    messageElement.textContent = text;
    messageElement.className = 'form-message is-visible';
    
    if (type === 'error') {
      messageElement.style.background = 'rgba(255, 69, 58, 0.2)';
      messageElement.style.color = '#ff453a';
    } else {
      messageElement.style.background = 'rgba(255, 255, 255, 0.14)';
      messageElement.style.color = 'var(--color-white)';
    }

    // Auto-hide message after 7 seconds
    setTimeout(function() {
      messageElement.classList.remove('is-visible');
    }, 7000);
  }

  // Form validation
  function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(function(field) {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
      } else {
        field.classList.remove('error');
      }
    });

    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        isValid = false;
        emailField.classList.add('error');
      }
    }

    // Phone validation (Indian format)
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value) {
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = phoneField.value.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        isValid = false;
        phoneField.classList.add('error');
      }
    }

    return isValid;
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize EmailJS
    if (typeof emailjs !== 'undefined') {
      initEmailJS();
    } else {
      console.warn('EmailJS library not loaded. Add the script tag to your HTML.');
    }

    // Attach handlers to all lead forms
    const leadForms = document.querySelectorAll('[data-lead-form]');
    
    leadForms.forEach(function(form) {
      const formMessage = form.querySelector('[data-form-message]');

      form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validate form
        if (!validateForm(form)) {
          if (formMessage) {
            showMessage(formMessage, 'Please fill all required fields correctly.', 'error');
          }
          return;
        }

        // Handle submission
        handleFormSubmit(form, formMessage);
      });

      // Remove error class on input
      form.querySelectorAll('input, select, textarea').forEach(function(field) {
        field.addEventListener('input', function() {
          field.classList.remove('error');
        });
      });
    });
  });

  // Alternative: Web3Forms Integration (Backup option)
  // Uncomment this if you prefer Web3Forms over EmailJS
  /*
  async function submitToWeb3Forms(formData) {
    const accessKey = 'YOUR_WEB3FORMS_ACCESS_KEY'; // Get from https://web3forms.com
    
    formData.append('access_key', accessKey);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
  */

})();
