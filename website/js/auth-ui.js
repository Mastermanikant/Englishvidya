// website/js/auth-ui.js — Phase 3 Enhanced

let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch('/api/auth-me');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      updateHeaderForLoggedIn();
      loadCoinBalance(); // Phase 3: load coin balance in header
    } else {
      currentUser = null;
      updateHeaderForLoggedOut();
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    updateHeaderForLoggedOut();
  }
}

// ─── Phase 3: Load Coin Balance into Header Badge ───
async function loadCoinBalance() {
  const badge = document.getElementById('header-coin-badge');
  const countEl = document.getElementById('header-coin-count');
  if (!badge || !countEl) return;

  try {
    const res = await fetch('/api/referral');
    if (!res.ok) return;
    const data = await res.json();
    const coins = data.referral_coins || 0;
    countEl.textContent = coins >= 1000 ? (coins / 1000).toFixed(1) + 'k' : coins;
    badge.style.display = 'inline-flex';
    badge.title = `आपके पास ${coins} Frankbase Coins हैं (= ₹${(coins / 100).toFixed(2)})`;
  } catch (e) {
    // Silently fail — coin badge remains hidden
  }
}

function updateHeaderForLoggedIn() {
  const profileBtn  = document.getElementById('header-profile-btn');
  const profileIcon = document.getElementById('header-profile-icon');
  const profileImg  = document.getElementById('header-profile-img');
  const profileMenu = document.getElementById('header-profile-menu');
  
  if (profileBtn) {
    profileBtn.removeAttribute('href');
    profileBtn.style.cursor = 'pointer';
    
    if (currentUser.avatar_url) {
      profileIcon.style.display = 'none';
      profileImg.src = currentUser.avatar_url;
      profileImg.style.display = 'block';
    }

    profileBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isVisible = profileMenu.style.display === 'flex';
      profileMenu.style.display = isVisible ? 'none' : 'flex';
    };

    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = 'none';
      }
    });
  }

  const nameEl    = document.getElementById('menu-user-name');
  const emailEl   = document.getElementById('menu-user-email');
  const adminLink = document.getElementById('menu-admin-link');
  const logoutBtn = document.getElementById('logout-btn');

  if (nameEl)  nameEl.textContent  = currentUser.name  || 'User';
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (adminLink && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
    adminLink.style.display = 'flex';
  }
  
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      document.cookie = 'ev_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
    };
  }

  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) {
    bottomProfile.href = '/settings/';
    const label = bottomProfile.querySelector('span:last-child');
    if (label) label.textContent = 'Profile';
  }
}

function updateHeaderForLoggedOut() {
  const profileBtn = document.getElementById('header-profile-btn');
  if (profileBtn) profileBtn.href = '/login/';

  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) bottomProfile.href = '/login/';

  // Hide coin badge for guests
  const badge = document.getElementById('header-coin-badge');
  if (badge) badge.style.display = 'none';
}

function requireAuth(actionFunction) {
  if (currentUser) {
    actionFunction();
  } else {
    window.location.href = '/login/';
  }
}

// ─── Phase 3: Focus Mode JS ───
function initFocusMode() {
  const exitBtn = document.getElementById('focus-exit-btn');
  if (!exitBtn) return;

  // Restore from localStorage
  const isFocused = localStorage.getItem('ev-focus-mode') === 'true';
  if (isFocused) document.body.classList.add('focus-mode');

  exitBtn.addEventListener('click', () => {
    document.body.classList.remove('focus-mode');
    localStorage.setItem('ev-focus-mode', 'false');
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// Global helper to toggle focus mode (can be called from any page button)
window.toggleFocusMode = function() {
  const isActive = document.body.classList.toggle('focus-mode');
  localStorage.setItem('ev-focus-mode', isActive ? 'true' : 'false');
  if (isActive) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
};

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initFocusMode();
});
