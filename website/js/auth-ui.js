// website/js/auth-ui.js — Autonomous Auth & Session Controller

(function() {
  let currentUser = null;

  // 1. Instant Cache Initialization (0ms UI lag)
  try {
    const cached = localStorage.getItem('ev_cached_user');
    if (cached) {
      currentUser = JSON.parse(cached);
      applyUserToUI(currentUser);
    }
  } catch (e) {}

  // 2. Background Revalidation with Live API
  async function syncAuthStatus() {
    try {
      const res = await fetch('/api/auth-me?_t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) {
        handleLoggedOut();
        return;
      }
      const data = await res.json();
      if (data.loggedIn && data.user) {
        currentUser = data.user;
        try {
          localStorage.setItem('ev_cached_user', JSON.stringify(currentUser));
        } catch (e) {}
        applyUserToUI(currentUser);
      } else {
        handleLoggedOut();
      }
    } catch (err) {
      // If offline, preserve cached user
    }
  }

  function applyUserToUI(user) {
    if (!user) return;

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
      profileBtn.title = user.name || 'My Profile';
      if (profileText) {
        const firstName = (user.name || 'Profile').split(' ')[0];
        profileText.textContent = firstName;
      }
      
      if (user.avatar_url && profileImg) {
        if (profileIcon) profileIcon.style.display = 'none';
        profileImg.src = user.avatar_url;
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

      if (!profileBtn.dataset.menuAttached) {
        document.addEventListener('click', (e) => {
          if (profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
          }
        });
        profileBtn.dataset.menuAttached = 'true';
      }
    }

    if (nameEl) nameEl.textContent = user.name || 'Student';
    if (emailEl) emailEl.textContent = user.email || '';
    if (adminLink && (user.role === 'owner' || user.role === 'admin')) {
      adminLink.classList.remove('hidden');
    }

    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        try {
          localStorage.removeItem('ev_cached_user');
        } catch (err) {}
        window.location.href = '/api/auth-logout';
      };
    }

    // Update mobile drawer and sidebar profile links
    const drawerProfileLink = document.querySelector('#mobile-drawer a[href="/login/"]');
    if (drawerProfileLink) {
      drawerProfileLink.href = '/profile/';
      drawerProfileLink.textContent = '👤 ' + (user.name || 'My Profile');
    }
  }

  function handleLoggedOut() {
    currentUser = null;
    try {
      localStorage.removeItem('ev_cached_user');
    } catch (e) {}

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

  // Run revalidation on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAuthStatus);
  } else {
    syncAuthStatus();
  }
})();
