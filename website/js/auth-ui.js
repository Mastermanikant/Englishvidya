// website/js/auth-ui.js

let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch('/api/auth-me');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      updateHeaderForLoggedIn();
    } else {
      currentUser = null;
      updateHeaderForLoggedOut();
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    updateHeaderForLoggedOut();
  }
}

function updateHeaderForLoggedIn() {
  // Update Header UI
  const profileBtn = document.getElementById('header-profile-btn');
  const profileIcon = document.getElementById('header-profile-icon');
  const profileImg = document.getElementById('header-profile-img');
  const profileMenu = document.getElementById('header-profile-menu');
  
  if (profileBtn) {
    profileBtn.removeAttribute('href'); // Make it a toggle button instead of a link
    profileBtn.style.cursor = 'pointer';
    
    if (currentUser.avatar_url) {
      profileIcon.style.display = 'none';
      profileImg.src = currentUser.avatar_url;
      profileImg.style.display = 'block';
    }

    // Toggle Dropdown
    profileBtn.onclick = (e) => {
      e.preventDefault();
      const isVisible = profileMenu.style.display === 'flex';
      profileMenu.style.display = isVisible ? 'none' : 'flex';
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = 'none';
      }
    });
  }

  // Populate Dropdown
  const nameEl = document.getElementById('menu-user-name');
  const emailEl = document.getElementById('menu-user-email');
  const adminLink = document.getElementById('menu-admin-link');
  const logoutBtn = document.getElementById('logout-btn');

  if (nameEl) nameEl.textContent = currentUser.name || 'User';
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (adminLink && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
    adminLink.style.display = 'flex';
  }
  
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      document.cookie = "ev_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.reload();
    };
  }

  // Update Bottom Nav
  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) {
    bottomProfile.href = '/settings/';
  }
}

function updateHeaderForLoggedOut() {
  // Update Header UI
  const profileBtn = document.getElementById('header-profile-btn');
  if (profileBtn) {
    profileBtn.href = '/login/';
  }

  // Update Bottom Nav
  const bottomProfile = document.getElementById('bottom-nav-profile-link');
  if (bottomProfile) {
    bottomProfile.href = '/login/';
  }
}

function requireAuth(actionFunction) {
  if (currentUser) {
    actionFunction();
  } else {
    // Redirect to login page and remember where they came from
    window.location.href = '/login/';
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', checkAuth);
