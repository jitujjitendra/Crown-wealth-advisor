/**
 * Admin Dashboard - Lead Management System
 * Crown Wealth Advisor
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
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase not configured. Running in demo mode.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Global State
let allLeads = [];
let filteredLeads = [];
let currentFilter = 'all';
let currentPage = 1;
let leadsPerPage = 20;
let currentUser = null;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const leadsTableBody = document.getElementById('leadsTableBody');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const logoutBtn = document.getElementById('logoutBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// Stat counters
const successCount = document.getElementById('successCount');
const wipCount = document.getElementById('wipCount');
const rejectedCount = document.getElementById('rejectedCount');
const totalCount = document.getElementById('totalCount');



// Initialize Dashboard
async function initDashboard() {
  showLoading(true);
  
  // Check Authentication
  if (isFirebaseConfigured && auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        updateUserProfile(user);
        await loadLeads();
      } else {
        window.location.href = 'index.html';
      }
    });
  } else {
    // Demo mode
    const demoMode = localStorage.getItem('demoMode');
    const adminEmail = localStorage.getItem('adminEmail');
    
    if (demoMode === 'true' && adminEmail) {
      currentUser = { email: adminEmail, displayName: 'Demo Admin' };
      updateUserProfile(currentUser);
      loadDemoData();
    } else {
      window.location.href = 'index.html';
    }
  }
}

// Update User Profile Display
function updateUserProfile(user) {
  const adminName = document.getElementById('adminName');
  const adminEmail = document.getElementById('adminEmail');
  
  adminName.textContent = user.displayName || 'Admin';
  adminEmail.textContent = user.email || '';
}

// Show/Hide Loading
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.add('show');
  } else {
    loadingOverlay.classList.remove('show');
  }
}



// Load Leads from Firestore
async function loadLeads() {
  try {
    const leadsRef = db.collection('leads').orderBy('createdAt', 'desc');
    const snapshot = await leadsRef.get();
    
    allLeads = [];
    snapshot.forEach(doc => {
      allLeads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    filteredLeads = [...allLeads];
    updateStats();
    renderLeads();
    showLoading(false);
  } catch (error) {
    console.error('Error loading leads:', error);
    showLoading(false);
    alert('Failed to load leads. Please check your connection.');
  }
}

// Load Demo Data
function loadDemoData() {
  allLeads = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      mobile: '9876543210',
      service: 'Health Insurance',
      status: 'new',
      source: 'Website Form',
      createdAt: new Date('2024-01-15'),
      comments: []
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      mobile: '9876543211',
      service: 'Home Loan',
      status: 'wip',
      source: 'Consultation Form',
      createdAt: new Date('2024-01-14'),
      comments: ['Called customer', 'Documents requested']
    },
    {
      id: '3',
      name: 'Amit Patel',
      email: 'amit@example.com',
      mobile: '9876543212',
      service: 'Life Insurance',
      status: 'success',
      source: 'Website Form',
      createdAt: new Date('2024-01-13'),
      comments: ['Policy issued']
    },
    {
      id: '4',
      name: 'Sunita Verma',
      email: 'sunita@example.com',
      mobile: '9876543213',
      service: 'Personal Loan',
      status: 'rejected',
      source: 'Bajaj Careers',
      createdAt: new Date('2024-01-12'),
      comments: ['Did not meet eligibility']
    }
  ];
  
  filteredLeads = [...allLeads];
  updateStats();
  renderLeads();
  showLoading(false);
}



// Update Statistics
function updateStats() {
  const stats = {
    success: 0,
    wip: 0,
    rejected: 0,
    total: allLeads.length
  };
  
  allLeads.forEach(lead => {
    if (lead.status === 'success') stats.success++;
    else if (lead.status === 'wip') stats.wip++;
    else if (lead.status === 'rejected') stats.rejected++;
  });
  
  successCount.textContent = stats.success;
  wipCount.textContent = stats.wip;
  rejectedCount.textContent = stats.rejected;
  totalCount.textContent = stats.total;
}

// Render Leads Table
function renderLeads() {
  const start = (currentPage - 1) * leadsPerPage;
  const end = start + leadsPerPage;
  const pageLeads = filteredLeads.slice(start, end);
  
  if (pageLeads.length === 0) {
    leadsTableBody.innerHTML = `
      <tr class="no-data">
        <td colspan="8">
          <div class="empty-state">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <p>No leads found</p>
            <small>${currentFilter === 'all' ? 'Leads will appear here once forms are submitted' : 'Try changing the filter or search term'}</small>
          </div>
        </td>
      </tr>
    `;
    updatePagination();
    return;
  }
  
  leadsTableBody.innerHTML = pageLeads.map(lead => `
    <tr data-id="${lead.id}">
      <td><input type="checkbox" class="lead-checkbox" data-id="${lead.id}"></td>
      <td><span class="status-badge ${lead.status}">${getStatusText(lead.status)}</span></td>
      <td><strong>${lead.name || 'N/A'}</strong></td>
      <td>
        ${lead.email || ''}<br>
        <small style="color: #999;">${lead.mobile || lead.phone || ''}</small>
      </td>
      <td>${lead.service || lead.insuranceType || lead.occupation || 'N/A'}</td>
      <td><small>${lead.source || 'Unknown'}</small></td>
      <td><small>${formatDate(lead.createdAt)}</small></td>
      <td>
        <button class="action-btn primary" onclick="viewLead('${lead.id}')">View</button>
        <button class="action-btn" onclick="updateLeadStatus('${lead.id}')">Update</button>
      </td>
    </tr>
  `).join('');
  
  updatePagination();
}



// Helper Functions
function getStatusText(status) {
  const statusMap = {
    new: '🆕 New',
    success: '🟢 Success',
    wip: '🟠 WIP',
    rejected: '🔴 Rejected'
  };
  return statusMap[status] || status;
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

// Update Pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage) || 1;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

// Filter Leads
function filterLeads(status) {
  currentFilter = status;
  currentPage = 1;
  
  if (status === 'all') {
    filteredLeads = [...allLeads];
  } else {
    filteredLeads = allLeads.filter(lead => lead.status === status);
  }
  
  applySearch();
  renderLeads();
}

// Search Leads
function applySearch() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) return;
  
  filteredLeads = filteredLeads.filter(lead => {
    return (
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.mobile && lead.mobile.includes(query)) ||
      (lead.phone && lead.phone.includes(query)) ||
      (lead.service && lead.service.toLowerCase().includes(query))
    );
  });
}



// Export to Excel
function exportToExcel() {
  if (filteredLeads.length === 0) {
    alert('No leads to export');
    return;
  }
  
  const data = filteredLeads.map(lead => ({
    'Lead ID': lead.id,
    'Status': getStatusText(lead.status),
    'Name': lead.name || '',
    'Email': lead.email || '',
    'Phone': lead.mobile || lead.phone || '',
    'Service/Type': lead.service || lead.insuranceType || lead.occupation || '',
    'Source': lead.source || 'Unknown',
    'Date': formatDate(lead.createdAt),
    'City': lead.city || '',
    'Comments': lead.comments ? lead.comments.join('; ') : ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  
  const fileName = `Crown_Leads_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// View Lead Details
function viewLead(leadId) {
  window.location.href = `lead-details.html?id=${leadId}`;
}

// Update Lead Status
async function updateLeadStatus(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const newStatus = prompt(
    `Update status for ${lead.name}\n\nCurrent: ${getStatusText(lead.status)}\n\nEnter new status:\n- new\n- success\n- wip\n- rejected`,
    lead.status
  );
  
  if (!newStatus || !['new', 'success', 'wip', 'rejected'].includes(newStatus)) {
    alert('Invalid status');
    return;
  }
  
  if (isFirebaseConfigured) {
    try {
      await db.collection('leads').doc(leadId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await loadLeads();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  } else {
    // Demo mode
    lead.status = newStatus;
    updateStats();
    renderLeads();
  }
}



// Event Listeners
searchInput.addEventListener('input', () => {
  filterLeads(currentFilter);
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterLeads(btn.dataset.status);
  });
});

refreshBtn.addEventListener('click', async () => {
  showLoading(true);
  if (isFirebaseConfigured) {
    await loadLeads();
  } else {
    loadDemoData();
  }
});

exportBtn.addEventListener('click', exportToExcel);

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderLeads();
  }
});

nextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderLeads();
  }
});

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
document.addEventListener('DOMContentLoaded', initDashboard);
