// common.js
// Global helpers, session resolution and navigation header synchronization

window.currentUser = null;

// Currency formatter
function formatPrice(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US') + ' USD';
}

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function setError(fieldId, message) {
  const el = document.getElementById(fieldId + '-error');
  if (el) el.textContent = message || '';
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[0-9\s-]{8,20}$/.test(phone);
}

// Check logged in user via backend cookie session
async function getLoggedInUser() {
  if (window.currentUser) return window.currentUser;
  try {
    const res = await api.auth.me();
    window.currentUser = res.user || res;
    return window.currentUser;
  } catch {
    window.currentUser = null;
    return null;
  }
}

// Update cart counter in header from backend active cart
async function updateCartCount() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  try {
    const res = await api.cart.get();
    const count = (res.cart && res.cart.productsIds) ? res.cart.productsIds.length : 0;
    badge.textContent = `(${count})`;
  } catch {
    badge.textContent = '(0)';
  }
}

// Synchronize header navigation across all pages
async function showHeader() {
  const user = await getLoggedInUser();
  const link = document.getElementById('account-link');
  const inAdmin = window.location.pathname.replace(/\\/g, '/').includes('/admin/');
  if (link) {
    if (!user) {
      link.textContent = 'Log in';
      link.href = inAdmin ? '../login.html' : 'login.html';
    } else if (user.role === 'admin') {
      link.textContent = 'Admin';
      link.href = inAdmin ? 'index.html' : 'admin/index.html';
    } else {
      link.textContent = 'My account';
      link.href = inAdmin ? '../account.html' : 'account.html';
    }
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput && getUrlParam('q')) {
    searchInput.value = getUrlParam('q');
  }

  await updateCartCount();
}

async function handleLogout() {
  try {
    await api.auth.logout();
  } catch (e) {
    console.error('Logout error:', e);
  }
  window.currentUser = null;
  showToast('Logged out');
  const inAdmin = window.location.pathname.replace(/\\/g, '/').includes('/admin/');
  setTimeout(() => {
    window.location.href = inAdmin ? '../login.html' : 'index.html';
  }, 500);
}

window.adminLogOut = handleLogout;
