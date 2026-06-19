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
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.innerHTML = `
      <img src="${currentUser.avatar_url || '/assets/icons/icon-192.png'}" 
           style="width:24px; height:24px; border-radius:50%; margin-right:8px; object-fit:cover;">
      Profile
    `;
    loginBtn.onclick = () => window.location.href = '/profile/';
  }
}

function updateHeaderForLoggedOut() {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.innerHTML = `Login <span style="font-size: 0.8em; margin-left: 5px;">▼</span>`;
    loginBtn.onclick = openLoginModal;
  }
}

function openLoginModal() {
  let modal = document.getElementById('login-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; position: relative;">
        <button onclick="closeLoginModal()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        <h2 style="margin-top: 0; color: var(--text-main); font-size: 1.8rem;">Join the Community</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Rate words, save personal notes, and add local meanings.</p>
        
        <a href="/api/auth-google" style="display: flex; align-items: center; justify-content: center; gap: 12px; background: white; color: #333; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem; border: 1px solid #ddd; transition: transform 0.2s, box-shadow 0.2s;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="24" height="24" alt="Google">
          Continue with Google
        </a>
        
        <p style="margin-top: 24px; font-size: 0.85rem; color: var(--text-secondary);">
          We use Google to prevent spam. You can add a password later.
        </p>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLoginModal();
    });
  }
  
  modal.style.display = 'flex';
  modal.offsetHeight; // reflow
  modal.style.opacity = '1';
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

function requireAuth(actionFunction) {
  if (currentUser) {
    actionFunction();
  } else {
    openLoginModal();
  }
}

// Run on load
document.addEventListener('DOMContentLoaded', checkAuth);
