/**
 * EnglishVidya — Unified Toast Notification System
 * एक ही जगह से पूरी वेबसाइट के लिए showToast() function
 * 
 * Usage:
 *   showToast('Message here');                    // default: success, 2500ms
 *   showToast('Error message', 'error');          // red toast
 *   showToast('Quick message', 'success', 1500);  // custom duration
 */
function showToast(message, type, duration) {
  // Defaults
  if (!type || (type !== 'success' && type !== 'error')) type = 'success';
  if (!duration) duration = 2500;

  // Ensure toast-container exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'ev-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = 
    'background:' + (type === 'error' ? '#ef4444' : 'var(--accent, #10b981)') + ';' +
    'color:#fff;' +
    'padding:12px 24px;' +
    'border-radius:8px;' +
    'box-shadow:0 4px 15px rgba(0,0,0,0.2);' +
    'font-weight:600;' +
    'font-size:0.9rem;' +
    'animation:slideUp 0.3s ease-out;';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}
