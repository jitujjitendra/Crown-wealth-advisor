/**
 * Crown Wealth Advisor - Lead Auto-Assignment System
 * Handles manual and automatic lead distribution
 * Demo mode: works without Firebase configured
 */
(function() {
  'use strict';

  var DEFAULT_SETTINGS = {
    autoAssign: false,
    agents: [
      { id: 'agent-1', name: 'Agent 1', email: 'agent1@crownwealthadvisor.com', percentage: 50, onLeave: false, active: true },
      { id: 'agent-2', name: 'Agent 2', email: 'agent2@crownwealthadvisor.com', percentage: 50, onLeave: false, active: true }
    ],
    categoryRules: [
      { category: 'Health Insurance', assignTo: '' },
      { category: 'Life Insurance', assignTo: '' },
      { category: 'General Insurance', assignTo: '' },
      { category: 'Home Loan', assignTo: '' },
      { category: 'Personal Loan', assignTo: '' },
      { category: 'Car Loan', assignTo: '' },
      { category: 'Loan Against Property', assignTo: '' },
      { category: 'Fixed Deposit & Investments', assignTo: '' }
    ],
    roundRobinIndex: 0
  };

  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getSettings() {
    var stored = localStorage.getItem('cwa_assignment_settings');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  function saveSettings(settings) {
    localStorage.setItem('cwa_assignment_settings', JSON.stringify(settings));

    if (isFirebaseAvailable()) {
      var db = firebase.firestore();
      db.collection('settings').doc('lead_assignment').set(settings).catch(function(err) {
        console.error('Failed to save assignment settings to Firestore:', err);
      });
    }
  }

  function loadSettings(callback) {
    if (!isFirebaseAvailable()) {
      if (callback) callback(getSettings());
      return;
    }

    var db = firebase.firestore();
    db.collection('settings').doc('lead_assignment').get().then(function(doc) {
      if (doc.exists) {
        var settings = doc.data();
        localStorage.setItem('cwa_assignment_settings', JSON.stringify(settings));
        if (callback) callback(settings);
      } else {
        if (callback) callback(getSettings());
      }
    }).catch(function() {
      if (callback) callback(getSettings());
    });
  }

  // Get active agents (not on leave)
  function getActiveAgents(settings) {
    return settings.agents.filter(function(agent) {
      return agent.active && !agent.onLeave;
    });
  }

  // Redistribute percentages when an agent goes on leave
  function redistributePercentages(settings) {
    var activeAgents = getActiveAgents(settings);
    if (activeAgents.length === 0) return settings;

    var totalPercentage = 100;
    var perAgent = Math.floor(totalPercentage / activeAgents.length);
    var remainder = totalPercentage - (perAgent * activeAgents.length);

    settings.agents.forEach(function(agent) {
      if (agent.active && !agent.onLeave) {
        agent.percentage = perAgent;
      } else {
        agent.percentage = 0;
      }
    });

    // Give remainder to first active agent
    if (activeAgents.length > 0) {
      var firstActive = settings.agents.find(function(a) { return a.active && !a.onLeave; });
      if (firstActive) firstActive.percentage += remainder;
    }

    return settings;
  }

  // Assign lead based on settings
  function assignLead(lead, settings) {
    if (!settings) settings = getSettings();
    
    // Check category-based rules first
    var categoryRule = settings.categoryRules.find(function(rule) {
      return rule.category === lead.service && rule.assignTo;
    });

    if (categoryRule && categoryRule.assignTo) {
      var categoryAgent = settings.agents.find(function(a) { return a.id === categoryRule.assignTo; });
      if (categoryAgent && categoryAgent.active && !categoryAgent.onLeave) {
        return {
          agentId: categoryAgent.id,
          agentName: categoryAgent.name,
          method: 'category-rule'
        };
      }
    }

    // Auto-assignment by percentage (weighted round-robin)
    if (settings.autoAssign) {
      var activeAgents = getActiveAgents(settings);
      if (activeAgents.length === 0) {
        return { agentId: null, agentName: 'Unassigned', method: 'no-active-agents' };
      }

      // Weighted random selection
      var totalWeight = activeAgents.reduce(function(sum, a) { return sum + a.percentage; }, 0);
      var random = Math.random() * totalWeight;
      var cumulative = 0;

      for (var i = 0; i < activeAgents.length; i++) {
        cumulative += activeAgents[i].percentage;
        if (random <= cumulative) {
          return {
            agentId: activeAgents[i].id,
            agentName: activeAgents[i].name,
            method: 'auto-percentage'
          };
        }
      }

      // Fallback to last agent
      var lastAgent = activeAgents[activeAgents.length - 1];
      return {
        agentId: lastAgent.id,
        agentName: lastAgent.name,
        method: 'auto-fallback'
      };
    }

    return { agentId: null, agentName: 'Unassigned', method: 'manual' };
  }

  // Manual assignment
  function manualAssign(leadId, agentId, callback) {
    var settings = getSettings();
    var agent = settings.agents.find(function(a) { return a.id === agentId; });
    var assignment = {
      leadId: leadId,
      agentId: agentId,
      agentName: agent ? agent.name : 'Unknown',
      assignedAt: new Date().toISOString(),
      method: 'manual'
    };

    // Save assignment log
    var log = getAssignmentLog();
    log.unshift(assignment);
    if (log.length > 200) log = log.slice(0, 200);
    localStorage.setItem('cwa_assignment_log', JSON.stringify(log));

    if (callback) callback(null, assignment);
  }

  function getAssignmentLog() {
    var stored = localStorage.getItem('cwa_assignment_log');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    return [];
  }

  // Toggle leave mode for an agent
  function toggleLeave(agentId, onLeave) {
    var settings = getSettings();
    var agent = settings.agents.find(function(a) { return a.id === agentId; });
    if (agent) {
      agent.onLeave = onLeave;
      if (onLeave) {
        settings = redistributePercentages(settings);
      }
      saveSettings(settings);
    }
    return settings;
  }

  // Add a new agent
  function addAgent(agentData) {
    var settings = getSettings();
    settings.agents.push({
      id: 'agent-' + Date.now(),
      name: agentData.name || 'New Agent',
      email: agentData.email || '',
      percentage: 0,
      onLeave: false,
      active: true
    });
    settings = redistributePercentages(settings);
    saveSettings(settings);
    return settings;
  }

  // Remove an agent
  function removeAgent(agentId) {
    var settings = getSettings();
    settings.agents = settings.agents.filter(function(a) { return a.id !== agentId; });
    settings = redistributePercentages(settings);
    saveSettings(settings);
    return settings;
  }

  // Expose globally
  window.CWA_LeadAssignment = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    loadSettings: loadSettings,
    assignLead: assignLead,
    manualAssign: manualAssign,
    toggleLeave: toggleLeave,
    addAgent: addAgent,
    removeAgent: removeAgent,
    redistributePercentages: redistributePercentages,
    getActiveAgents: getActiveAgents,
    getAssignmentLog: getAssignmentLog
  };
})();
