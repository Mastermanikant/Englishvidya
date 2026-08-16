// website/js/auth-ui.js — Autonomous Auth & Session Controller

let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch('/api/auth-me?_t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) {
      updateHeaderForLoggedOut();
      return;
    }
    const data = await res.json();
    if (data.loggedIn && data.user) {
      currentUser = data.user;
      if (window.location.pathname === '/login/') {
        window.location.href = '/profile/';
        return;
      }
      updateHeaderForLoggedIn();
    } else {
      currentUser = null;
      updateHeaderForLoggedOut();
    }
  } catch (err) {
    currentUser = null;
    updateHeaderForLoggedOut();
  }
}

function updateHeaderForLoggedIn() {
  const profileBtn = document.getElementById('header-profile-btn');
  const profileIcon = document.getElementById('header-profile-icon');
  const profileImg = document.getElementById('header-profile-img');
  const profileText = document.getElementById('header-profile-text');
  const profileMenu = document.getElementById('header-profile-menu');
  const nameEl = document.getElementById('menu-user-name');
  const emailEl = document.getElementById('menu-user-email');
  const adminLink = document.getElementById('menu-admin-link');
  const logoutBtn = document.getElementById('logout-btn');

  if (profileBtn) {
    profileBtn.title = currentUser.name || 'My Profile';
    if (profileText) profileText.textContent = currentUser.name ? currentUser.name.split(' ')[0] : 'Profile';
    
    if (currentUser.avatar_url && profileImg) {
      if (profileIcon) profileIcon.style.display = 'none';
      profileImg.src = currentUser.avatar_url;
      profileImg.style.display = 'block';
    } else {
      if (profileIcon) profileIcon.style.display = 'block';
      if (profileImg) profileImg.style.display = 'none';
    }

    profileBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (profileMenu) {
        profileMenu.classList.toggle('hidden');
      } else {
        window.location.href = '/profile/';
      }
    };

    if (!profileBtn.dataset.clickAttached) {
      document.addEventListener('click', (e) => {
        if (profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
          profileMenu.classList.add('hidden');
        }
      });
      profileBtn.dataset.clickAttached = 'true';
    }
  }

  if (nameEl) nameEl.textContent = currentUser.name || 'Student';
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (adminLink && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
    adminLink.classList.remove('hidden');
  }

  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      window.location.href = '/api/auth-logout';
    };
  }

  // Update mobile drawer and sidebar profile links
  const drawerProfileLink = document.querySelector('#mobile-drawer a[href="/login/"]');
  if (drawerProfileLink) {
    drawerProfileLink.href = '/profile/';
    drawerProfileLink.textContent = '👤 ' + (currentUser.name || 'My Profile');
  }
}

function updateHeaderForLoggedOut() {
  const profileBtn = document.getElementById('header-profile-btn');
  const profileIcon = document.getElementById('header-profile-icon');
  const profileImg = document.getElementById('header-profile-img');
  const profileText = document.getElementById('header-profile-text');

  if (profileBtn) {
    profileBtn.title = 'Login / Sign In';
    profileBtn.onclick = null;
    if (profileText) profileText.textContent = 'Login';
  }
  if (profileIcon) profileIcon.style.display = 'block';
  if (profileImg) profileImg.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
