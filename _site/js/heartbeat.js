// website/js/heartbeat.js — Zero-Server-Load Local Study Timer

(function() {
  const STORAGE_KEY = 'ev_study_seconds';
  const LAST_ACTIVE_KEY = 'ev_last_active_date';
  const TARGET_SECONDS = 3 * 60 * 60; // 3 Hours (10800s)

  let localSeconds = 0;
  try {
    localSeconds = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {
    localSeconds = 0;
  }

  // Check if day changed - reset daily study count
  const today = new Date().toISOString().slice(0, 10);
  try {
    const lastDate = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastDate !== today) {
      localStorage.setItem(LAST_ACTIVE_KEY, today);
      localStorage.setItem(STORAGE_KEY, '0');
      localSeconds = 0;
    }
  } catch (e) {}

  let userActive = true;
  let lastInteraction = Date.now();

  const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  function onUserInteraction() {
    userActive = true;
    lastInteraction = Date.now();
  }

  activityEvents.forEach(evt => {
    window.addEventListener(evt, onUserInteraction, { passive: true });
  });

  // Local study timer ticker (Runs every 5 seconds locally, ZERO server network requests)
  setInterval(() => {
    const isVisible = document.visibilityState === 'visible';
    const isRecentlyActive = (Date.now() - lastInteraction) < 120000; // Active in last 2 mins

    if (isVisible && isRecentlyActive) {
      localSeconds += 5;
      try {
        localStorage.setItem(STORAGE_KEY, localSeconds.toString());
      } catch (e) {}

      // Milestone trigger: Only fire 1 single network request when milestone is reached
      if (localSeconds === TARGET_SECONDS) {
        claimStudyMilestoneReward();
      }
    }
  }, 5000);

  async function claimStudyMilestoneReward() {
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_reached: true, seconds: localSeconds })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user_awarded && window.showToast) {
          window.showToast("🎉 बधाई हो! आपने आज 3 घंटे की पढ़ाई पूरी की और कॉइन्स अर्जित किए!", "success");
        }
      }
    } catch (err) {
      console.warn('Milestone reward non-fatal sync error:', err);
    }
  }
})();
