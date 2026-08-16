// website/js/auth-ui.js — Autonomous Auth & Session Controller

(function() {
  let currentUser = null;

  // 1. Intercept URL Hydration Parameters (?login=success&u_name=...)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      const urlUser = {
        name: params.get('u_name') || 'Student',
        email: params.get('u_email') || 'student@englishvidya.com',
        avatar_url: params.get('u_avatar') || '',
        role: params.get('u_role') || 'learner'
      };
      localStorage.setItem('ev_cached_user', JSON.stringify(urlUser));
      currentUser = urlUser;
      
      // Clean query params from address bar without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (e) {}

  // 2. Instant Cache Initialization (0ms UI lag)
  try {
    if (!currentUser) {
      const cached = localStorage.getItem('ev_cached_user');
      if (cached) {
        currentUser = JSON.parse(cached);
      }
    }
    if (currentUser) {
      applyUserToUI(currentUser);
    }
  } catch (e) {}

  // 3. Background Revalidation with Live API
  async function syncAuthStatus() {
    try {
      const res = await fetch('/api/auth-me?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn && data.user) {
          currentUser = data.user;
          try {
            localStorage.setItem('ev_cached_user', JSON.stringify(currentUser));
          } catch (e) {}
          applyUserToUI(currentUser);
          return;
        }
      }
      
      // If server explicitly says loggedIn: false and no URL params
      if (!window.location.search.includes('login=success')) {
        const data = await res.json().catch(() => ({ loggedIn: false }));
        if (!data.loggedIn) {
          handleLoggedOut();
        }
      }
    } catch (err) {
      // If network offline, keep cached user
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

  // Instant login helper for testing / guest upgrade
  window.evInstantLogin = function(name = 'Master Learner', email = 'student@englishvidya.com') {
    const user = {
      name,
      email,
      avatar_url: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=2563eb&color=fff&size=128',
      role: 'LEARNER'
    };
    try {
      localStorage.setItem('ev_cached_user', JSON.stringify(user));
    } catch (e) {}
    applyUserToUI(user);
    if (window.location.pathname.includes('/profile')) {
      window.location.reload();
    }
  };

  // Run revalidation on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAuthStatus);
  } else {
    syncAuthStatus();
  }
})();
