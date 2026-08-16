(function() {
  // Check if token exists in cookie first (purely client-side, zero server load)
  function isUserLoggedIn() {
    return document.cookie.split(';').some(item => item.trim().startsWith('ev_token='));
  }

  if (!isUserLoggedIn()) {
    return; // Stop if not logged in
  }

  let lastActivityTime = Date.now();
  let heartbeatInterval = null;

  // Track user activity
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  function recordActivity() {
    lastActivityTime = Date.now();
  }

  activityEvents.forEach(eventName => {
    window.addEventListener(eventName, recordActivity, { passive: true });
  });

  // Start heartbeat interval (every 60 seconds)
  heartbeatInterval = setInterval(async () => {
    // Check if tab is visible and user has been active within the last 60 seconds
    const isTabVisible = document.visibilityState === 'visible';
    const hasBeenActive = (Date.now() - lastActivityTime) < 60000;

    if (isTabVisible && hasBeenActive) {
      try {
        const res = await fetch('/api/heartbeat', { method: 'POST' });
        
        if (res.status === 401) {
          // Token expired or logged out - stop pings
          clearInterval(heartbeatInterval);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          
          if (data.user_awarded) {
            showRewardToast("बधाई हो! आपने 3 घंटे की पढ़ाई पूरी की और 900 कॉइन्स (₹9) अर्जित किए!");
          }
          if (data.referrer_awarded) {
            showRewardToast("बधाई हो! आपके रेफ़र किए गए दोस्त ने 3 घंटे पूरे किए और आपको 900 कॉइन्स मिले!");
          }

          // If milestone is reached, update current page if it is the referral dashboard
          if (data.milestone_reached && typeof window.loadReferralDashboard === 'function') {
            window.loadReferralDashboard();
          }
        }
      } catch (err) {
        // Fail silently to minimize errors in console
      }
    }
  }, 60000);

  // Helper to show custom premium toast
  function showRewardToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.background = 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
    toast.style.color = '#000';
    toast.style.padding = '14px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 25px rgba(234, 179, 8, 0.3)';
    toast.style.fontWeight = 'bold';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.fontSize = '0.95rem';
    toast.style.lineHeight = '1.4';
    toast.style.animation = 'slideUp 0.3s ease-out';
    toast.innerHTML = `🪙 <span></span>`;
    toast.querySelector('span').textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 500);
    }, 10000);
  }
})();
