// website/js/auth-ui.js — Phase 3 Enhanced

let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch('/api/auth-me');
    const data = await res.json();
    if (data.loggedIn) {
      if (window.location.pathname === '/login/') {
        window.location.href = '/profile/';
        return;
      }
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
    profileBtn.href = '/profile/';
    profileBtn.title = currentUser.name || 'My Profile';
    profileBtn.style.cursor = 'pointer';
    
    if (currentUser.avatar_url) {
      if (profileIcon) profileIcon.style.display = 'none';
      if (profileImg) {
        profileImg.src = currentUser.avatar_url;
        profileImg.style.display = 'block';
        profileImg.style.width = '32px';
        profileImg.style.height = '32px';
        profileImg.style.borderRadius = '50%';
        profileImg.style.objectFit = 'cover';
      }
    } else {
      if (profileIcon) profileIcon.style.display = 'block';
      if (profileImg) profileImg.style.display = 'none';
    }

    profileBtn.onclick = (e) => {
      // Toggle dropdown menu on desktop click
      if (profileMenu) {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = profileMenu.style.display === 'flex';
        profileMenu.style.display = isVisible ? 'none' : 'flex';
      }
    };

    if (!profileBtn.dataset.clickAttached) {
      document.addEventListener('click', (e) => {
        if (profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
          profileMenu.style.display = 'none';
        }
      });
      profileBtn.dataset.clickAttached = 'true';
    }
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
    logoutBtn.onclick = (e) => {
      if (e) e.preventDefault();
      if (window.handleLogoutWithProtection) {
        window.handleLogoutWithProtection();
      } else {
        window.location.href = '/api/auth-logout';
      }
    };
  }

  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) {
    bottomProfile.href = '/profile/';
    const label = bottomProfile.querySelector('span:last-child');
    if (label) label.textContent = 'Profile';
  }

  const drawerProfile = document.querySelector('.mobile-drawer-link[data-route="profile"]');
  if (drawerProfile) drawerProfile.href = '/profile/';
}

function updateHeaderForLoggedOut() {
  const profileBtn  = document.getElementById('header-profile-btn');
  const profileIcon = document.getElementById('header-profile-icon');
  const profileImg  = document.getElementById('header-profile-img');

  if (profileBtn) {
    profileBtn.href = '/login/';
    profileBtn.title = 'Login';
    profileBtn.onclick = null;
  }
  if (profileIcon) profileIcon.style.display = 'block';
  if (profileImg) profileImg.style.display = 'none';

  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) bottomProfile.href = '/login/';

  const drawerProfile = document.querySelector('.mobile-drawer-link[data-route="profile"]');
  if (drawerProfile) drawerProfile.href = '/login/';

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

  exitBtn.onclick = () => {
    document.body.classList.remove('focus-mode');
    localStorage.setItem('ev-focus-mode', 'false');
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
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
