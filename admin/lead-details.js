/**
 * Lead Details Page - Individual Lead Management
 * Crown Wealth Advisor Admin
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db, auth;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isFirebaseConfigured = true;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Global State
let currentLead = null;
let currentUser = null;
let leadId = null;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const leadInfo = document.getElementById('leadInfo');
const commentList = document.getElementById('commentList');
const commentForm = document.getElementById('commentForm');
const commentText = document.getElementById('commentText');
const saveStatusBtn = document.getElementById('saveStatusBtn');
const deleteBtn = document.getElementById('deleteBtn');
const statusOptions = document.querySelectorAll('.status-option');
const leadHistory = document.getElementById('leadHistory');
const leadNameHeader = document.getElementById('leadName');
const logoutBtn = document.getElementById('logoutBtn');



// Initialize Page
async function initPage() {
  showLoading(true);
  
  // Get Lead ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  leadId = urlParams.get('id');
  
  if (!leadId) {
    alert('Invalid lead ID');
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Check Authentication
  if (isFirebaseConfigured && auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        updateUserProfile(user);
        await loadLeadData();
      } else {
        window.location.href = 'index.html';
      }
    });
  } else {
    // Demo mode
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      currentUser = { email: localStorage.getItem('adminEmail') };
      updateUserProfile(currentUser);
      loadDemoData();
    } else {
      window.location.href = 'index.html';
    }
  }
}

// Update User Profile
function updateUserProfile(user) {
  document.getElementById('adminName').textContent = user.displayName || 'Admin';
  document.getElementById('adminEmail').textContent = user.email || '';
}

// Show/Hide Loading
function showLoading(show) {
  loadingOverlay.classList.toggle('show', show);
}

// Load Lead Data from Firestore
async function loadLeadData() {
  try {
    const doc = await db.collection('leads').doc(leadId).get();
    
    if (!doc.exists) {
      alert('Lead not found');
      window.location.href = 'dashboard.html';
      return;
    }
    
    currentLead = { id: doc.id, ...doc.data() };
    renderLeadDetails();
    showLoading(false);
  } catch (error) {
    console.error('Error loading lead:', error);
    alert('Failed to load lead data');
    showLoading(false);
  }
}



// Load Demo Data
function loadDemoData() {
  currentLead = {
    id: leadId,
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    mobile: '9876543210',
    service: 'Health Insurance',
    status: 'wip',
    source: 'Website Form',
    city: 'Mumbai',
    createdAt: new Date('2024-01-15'),
    comments: [
      { text: 'Initial contact made', timestamp: new Date('2024-01-15'), user: 'Admin' },
      { text: 'Sent policy options via email', timestamp: new Date('2024-01-16'), user: 'Admin' },
      { text: 'Follow-up scheduled for next week', timestamp: new Date('2024-01-17'), user: 'Admin' }
    ],
    history: [
      { action: 'Lead created', timestamp: new Date('2024-01-15'), user: 'System' },
      { action: 'Status changed to WIP', timestamp: new Date('2024-01-16'), user: 'Admin' }
    ]
  };
  
  renderLeadDetails();
  showLoading(false);
}

// Render Lead Details
function renderLeadDetails() {
  // Update header
  leadNameHeader.textContent = `Lead Details: ${currentLead.name || 'Unknown'}`;
  
  // Render contact information
  const fields = [
    { label: 'Full Name', value: currentLead.name },
    { label: 'Email', value: currentLead.email },
    { label: 'Phone', value: currentLead.mobile || currentLead.phone },
    { label: 'City', value: currentLead.city },
    { label: 'Service/Type', value: currentLead.service || currentLead.insuranceType || currentLead.occupation },
    { label: 'Source', value: currentLead.source },
    { label: 'Date Submitted', value: formatDate(currentLead.createdAt) }
  ];
  
  // Add all other fields dynamically
  Object.keys(currentLead).forEach(key => {
    if (!['id', 'name', 'email', 'mobile', 'phone', 'city', 'service', 'source', 'status', 'createdAt', 'updatedAt', 'comments', 'history', 'insuranceType', 'occupation'].includes(key)) {
      fields.push({
        label: formatFieldName(key),
        value: currentLead[key]
      });
    }
  });
  
  leadInfo.innerHTML = fields
    .filter(f => f.value)
    .map(f => `
      <div class="detail-row">
        <div class="detail-label">${f.label}:</div>
        <div class="detail-value">${f.value || 'N/A'}</div>
      </div>
    `).join('');
  
  // Set active status
  statusOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.status === currentLead.status);
  });
  
  // Render comments
  renderComments();
  
  // Render history
  renderHistory();
}



// Render Comments
function renderComments() {
  const comments = currentLead.comments || [];
  
  if (comments.length === 0) {
    commentList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No comments yet</p>';
    return;
  }
  
  commentList.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <div class="comment-header">
        <strong>${comment.user || 'Admin'}</strong>
        <span>${formatDate(comment.timestamp)}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
    </div>
  `).join('');
}

// Render History
function renderHistory() {
  const history = currentLead.history || [];
  
  if (history.length === 0) {
    leadHistory.innerHTML = '<p style="text-align: center; color: #999; padding: 20px; font-size: 0.85rem;">No history available</p>';
    return;
  }
  
  leadHistory.innerHTML = `
    <div style="font-size: 0.85rem; color: #666; max-height: 200px; overflow-y: auto;">
      ${history.map(h => `
        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <strong style="color: #1a1a1a;">${h.action}</strong><br>
          <small style="color: #999;">${formatDate(h.timestamp)} by ${h.user}</small>
        </div>
      `).join('')}
    </div>
  `;
}

// Helper Functions
function formatFieldName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}



// Add Comment
async function addComment(text) {
  const comment = {
    text: text.trim(),
    timestamp: new Date(),
    user: currentUser.displayName || currentUser.email || 'Admin'
  };
  
  if (isFirebaseConfigured) {
    try {
      await db.collection('leads').doc(leadId).update({
        comments: firebase.firestore.FieldValue.arrayUnion(comment),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      await loadLeadData();
      commentText.value = '';
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  } else {
    // Demo mode
    if (!currentLead.comments) currentLead.comments = [];
    currentLead.comments.push(comment);
    renderComments();
    commentText.value = '';
  }
}

// Save Status
async function saveStatus() {
  const selectedStatus = document.querySelector('.status-option.active');
  if (!selectedStatus) {
    alert('Please select a status');
    return;
  }
  
  const newStatus = selectedStatus.dataset.status;
  
  if (isFirebaseConfigured) {
    try {
      await db.collection('leads').doc(leadId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        history: firebase.firestore.FieldValue.arrayUnion({
          action: `Status changed to ${newStatus.toUpperCase()}`,
          timestamp: new Date(),
          user: currentUser.displayName || currentUser.email
        })
      });
      
      alert('Status updated successfully');
      await loadLeadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  } else {
    // Demo mode
    currentLead.status = newStatus;
    if (!currentLead.history) currentLead.history = [];
    currentLead.history.push({
      action: `Status changed to ${newStatus.toUpperCase()}`,
      timestamp: new Date(),
      user: 'Admin'
    });
    alert('Status updated successfully (Demo Mode)');
    renderLeadDetails();
  }
}



// Delete Lead
async function deleteLead() {
  if (!confirm(`Are you sure you want to delete lead "${currentLead.name}"? This action cannot be undone.`)) {
    return;
  }
  
  if (isFirebaseConfigured) {
    try {
      await db.collection('leads').doc(leadId).delete();
      alert('Lead deleted successfully');
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  } else {
    // Demo mode
    alert('Lead deleted successfully (Demo Mode)');
    window.location.href = 'dashboard.html';
  }
}

// Event Listeners
statusOptions.forEach(option => {
  option.addEventListener('click', () => {
    statusOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
  });
});

commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = commentText.value.trim();
  if (text) {
    await addComment(text);
  }
});

saveStatusBtn.addEventListener('click', saveStatus);
deleteBtn.addEventListener('click', deleteLead);

logoutBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to logout?')) {
    if (isFirebaseConfigured && auth) {
      await auth.signOut();
    } else {
      localStorage.removeItem('demoMode');
      localStorage.removeItem('adminEmail');
    }
    window.location.href = 'index.html';
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPage);
