// My Diary — Local-First Note-Taking and Cloud Sync Logic
(function() {
  // Helper: Get local notes
  window.getLocalNotes = function() {
    const saved = localStorage.getItem('ev-diary-notes');
    return saved ? JSON.parse(saved) : [];
  };

  // Helper: Save local notes
  window.saveLocalNotes = function(notes) {
    localStorage.setItem('ev-diary-notes', JSON.stringify(notes));
  };

  // Helper: Get local bookmarks
  window.getLocalBookmarks = function() {
    const saved = localStorage.getItem('ev-bookmarks');
    return saved ? JSON.parse(saved) : [];
  };

  // Helper: Save local bookmarks
  window.saveLocalBookmarks = function(bookmarks) {
    localStorage.setItem('ev-bookmarks', JSON.stringify(bookmarks));
  };

  // Helper: Check if there is any unsynced data
  window.hasUnsyncedDiaryData = function() {
    const notes = window.getLocalNotes();
    const hasUnsyncedNotes = notes.some(n => !n.synced);

    const bookmarks = window.getLocalBookmarks();
    const hasUnsyncedBookmarks = bookmarks.some(b => !b.synced);

    const toRemove = JSON.parse(localStorage.getItem('ev-bookmarks-to-remove') || '[]');

    return hasUnsyncedNotes || hasUnsyncedBookmarks || toRemove.length > 0;
  };

  // 1. Text Selection Tooltip Injection and Positioning
  let tooltip = null;
  let selectedText = "";

  function initTextSelection() {
    const contentArea = document.querySelector('.markdown-content');
    if (!contentArea) return;

    // Inject Tooltip Container if not exists
    tooltip = document.createElement('div');
    tooltip.id = 'ev-selection-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      display: none;
      z-index: 10000;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 6px 12px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
      cursor: pointer;
      user-select: none;
      transition: opacity 0.2s, transform 0.2s;
      transform: scale(0.9);
      opacity: 0;
    `;
    
    const saveBtn = document.createElement('button');
    saveBtn.innerText = '✍️ Save to Diary';
    saveBtn.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
    `;
    
    tooltip.appendChild(saveBtn);
    document.body.appendChild(tooltip);

    // Track mouseup and touchend
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection); // For keyboard selections
    
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveSelectionToDiary();
    });
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (!text || text.length < 3) {
      hideTooltip();
      return;
    }

    selectedText = text;

    // Verify selection is inside markdown-content
    const range = selection.getRangeAt(0);
    const contentArea = document.querySelector('.markdown-content');
    if (!contentArea.contains(range.commonAncestorContainer)) {
      hideTooltip();
      return;
    }

    // Position tooltip
    const rect = range.getBoundingClientRect();
    tooltip.style.display = 'block';
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    const top = rect.top + window.scrollY - tooltipHeight - 10;
    const left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    setTimeout(() => {
      tooltip.style.transform = 'scale(1)';
      tooltip.style.opacity = '1';
    }, 10);
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.transform = 'scale(0.9)';
      tooltip.style.opacity = '0';
      setTimeout(() => {
        if (tooltip.style.opacity === '0') {
          tooltip.style.display = 'none';
        }
      }, 200);
    }
  }

  function saveSelectionToDiary() {
    if (!selectedText) return;

    const notes = window.getLocalNotes();
    
    // Generate unique slug for this selection
    const pageSlug = window.location.pathname.replace(/^\/|\/$/g, '').split('/').pop() || 'lesson';
    const noteId = `selection-${pageSlug}-${Date.now()}`;

    notes.unshift({
      slug: noteId,
      selected_text: selectedText,
      page_title: document.title.replace(' - EnglishVidya', ''),
      page_url: window.location.pathname,
      note_content: "", // initially empty
      created_at: new Date().toISOString(),
      synced: false
    });

    window.saveLocalNotes(notes);
    window.showTemporaryToast ? window.showTemporaryToast('डायरी में स्थानीय रूप से सहेजा गया! 📓') : alert('डायरी में स्थानीय रूप से सहेजा गया!');
    
    // Clear selection
    window.getSelection().removeAllRanges();
    hideTooltip();
    
    // Update menu badges
    window.updateDiaryBadge();
  }

  // Hide tooltip when clicking anywhere else
  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  // 2. Diary Indicator Red Dot Badge Logic
  window.updateDiaryBadge = function() {
    const hasUnsynced = window.hasUnsyncedDiaryData();
    
    // Find all "My Diary" links in header and mobile drawers
    const diaryLinks = document.querySelectorAll('a[href="/my-diary/"], .mobile-drawer-link[href="/my-diary/"]');
    
    diaryLinks.forEach(link => {
      let badge = link.querySelector('.diary-red-dot');
      if (hasUnsynced) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'diary-red-dot';
          badge.style.cssText = `
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: var(--error, #ef4444);
            border-radius: 50%;
            margin-left: 6px;
            box-shadow: 0 0 8px var(--error, #ef4444);
          `;
          link.appendChild(badge);
        }
      } else {
        if (badge) badge.remove();
      }
    });
  };

  // 3. Sync API Client Function
  window.syncDiaryToServer = async function() {
    const notes = window.getLocalNotes();
    const unsyncedNotes = notes.filter(n => !n.synced);
    
    const bookmarks = window.getLocalBookmarks();
    const unsyncedBookmarks = bookmarks.filter(b => !b.synced);

    const toRemove = JSON.parse(localStorage.getItem('ev-bookmarks-to-remove') || '[]');

    const items = [];
    
    // Format Notes payload
    unsyncedNotes.forEach(n => {
      const notePayload = {
        text: n.selected_text,
        page_title: n.page_title,
        page_url: n.page_url,
        user_note: n.note_content
      };
      items.push({
        type: 'note',
        word_slug: n.slug,
        note_content: JSON.stringify(notePayload)
      });
    });

    // Format Bookmarks payload
    unsyncedBookmarks.forEach(b => {
      items.push({
        type: 'bookmark',
        word_slug: b.slug,
        word_text: b.word,
        meaning_text: b.meaning,
        pron_text: b.pron,
        category: b.category
      });
    });

    // Format Bookmarks Removal payload
    toRemove.forEach(slug => {
      items.push({
        type: 'remove_bookmark',
        word_slug: slug
      });
    });

    if (items.length === 0) {
      return { success: true, count: 0, message: 'All items are already synced!' };
    }

    // Call Cloudflare Worker endpoint
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server sync failed');
    }

    const data = await res.json();

    // Mark local notes as synced
    const updatedNotes = notes.map(n => ({ ...n, synced: true }));
    window.saveLocalNotes(updatedNotes);

    // Mark local bookmarks as synced
    const updatedBookmarks = bookmarks.map(b => ({ ...b, synced: true }));
    window.saveLocalBookmarks(updatedBookmarks);

    // Clear removal log
    localStorage.removeItem('ev-bookmarks-to-remove');

    // Update indicators
    window.updateDiaryBadge();

    return { success: true, count: data.synced };
  };

  // 4. Pull and Merge Server Data
  window.pullDiaryFromServer = async function() {
    try {
      const res = await fetch('/api/diary');
      if (!res.ok) return;
      const data = await res.json();

      // Merge Notes
      const localNotes = window.getLocalNotes();
      const serverNotes = data.notes || [];

      serverNotes.forEach(sn => {
        const exists = localNotes.some(ln => ln.slug === sn.word_slug);
        if (!exists) {
          let selectedText = '';
          let pageTitle = 'Grammar Lesson';
          let pageUrl = '';
          let userNote = sn.note_content;

          try {
            if (sn.note_content.startsWith('{') && sn.note_content.endsWith('}')) {
              const parsed = JSON.parse(sn.note_content);
              selectedText = parsed.text || '';
              pageTitle = parsed.page_title || 'Grammar Lesson';
              pageUrl = parsed.page_url || '';
              userNote = parsed.user_note || '';
            }
          } catch (e) {}

          localNotes.push({
            slug: sn.word_slug,
            selected_text: selectedText || sn.word_slug,
            page_title: pageTitle,
            page_url: pageUrl,
            note_content: userNote,
            created_at: sn.updated_at,
            synced: true
          });
        }
      });
      window.saveLocalNotes(localNotes);

      // Merge Bookmarks
      const localBookmarks = window.getLocalBookmarks();
      const serverBookmarks = data.bookmarks || [];

      serverBookmarks.forEach(sb => {
        const exists = localBookmarks.some(lb => lb.slug === sb.word_slug);
        if (!exists) {
          localBookmarks.push({
            slug: sb.word_slug,
            word: sb.word_text,
            meaning: sb.meaning_text,
            pron: sb.pron_text,
            category: sb.category,
            addedAt: sb.created_at,
            synced: true
          });
        }
      });
      window.saveLocalBookmarks(localBookmarks);

      window.updateDiaryBadge();
    } catch (e) {
      console.warn('[Diary Pull] Failed to pull server notes:', e);
    }
  };

  // 5. Logout Protection Modal
  window.handleLogoutWithProtection = function() {
    const hasUnsynced = window.hasUnsyncedDiaryData();
    if (!hasUnsynced) {
      // No unsynced notes/bookmarks, proceed to logout
      executeLogout();
      return;
    }

    // Unsynced data exists, show beautiful glassmorphic modal
    const overlay = document.createElement('div');
    overlay.id = 'logout-protect-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
      animation: fadeIn 0.25s ease-out;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, var(--bg-raised, #1e293b), rgba(30, 41, 59, 0.95));
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      border-radius: 16px;
      padding: 30px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.5);
      color: var(--text-primary, #fff);
      animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    modal.innerHTML = `
      <div style="font-size: 2.2rem; text-align: center; margin-bottom: 15px;">☁️</div>
      <h3 style="margin: 0 0 12px 0; text-align: center; font-size: 1.3rem; font-weight: 700;">अन-सिंक डायरी डेटा मिला (Unsynced Notes Found)</h3>
      <p style="margin: 0 0 24px 0; text-align: center; font-size: 0.95rem; line-height: 1.5; color: var(--text-secondary, #94a3b8);">
        आपके पास डायरी या बुकमार्क में कुछ नया डेटा है जो अभी सर्वर पर सुरक्षित नहीं हुआ है। क्या आप लॉगआउट करने से पहले इसे सुरक्षित (Sync) करना चाहते हैं?
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="modal-sync-logout-btn" style="background: linear-gradient(135deg, var(--accent, #38bdf8), #0284c7); color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s;">
          ☁️ Save online and Logout (सुरक्षित करें और लॉगआउट)
        </button>
        <button id="modal-only-logout-btn" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;">
          🚪 Logout without saving (बिना सुरक्षित किए लॉगआउट)
        </button>
        <button id="modal-cancel-btn" style="background: transparent; color: var(--text-secondary, #94a3b8); border: none; padding: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; text-decoration: underline;">
          रद्द करें (Cancel)
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event Handlers
    modal.querySelector('#modal-sync-logout-btn').onclick = async function() {
      const btn = modal.querySelector('#modal-sync-logout-btn');
      btn.disabled = true;
      btn.innerText = 'सिंक हो रहा है... 🔄';
      try {
        await window.syncDiaryToServer();
        executeLogout();
      } catch (err) {
        alert('Sync error: ' + err.message);
        btn.disabled = false;
        btn.innerText = '☁️ Try Again';
      }
    };

    modal.querySelector('#modal-only-logout-btn').onclick = function() {
      executeLogout();
    };

    modal.querySelector('#modal-cancel-btn').onclick = function() {
      overlay.remove();
    };
  };

  function executeLogout() {
    window.location.href = '/api/auth-logout';
  }

  // 6. DOM Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initTextSelection();
    
    // Check if user is logged in
    fetch('/api/auth-me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          // Pull updates on initial load for logged in user
          window.pullDiaryFromServer();
        } else {
          window.updateDiaryBadge();
        }
      })
      .catch(() => {
        window.updateDiaryBadge();
      });
  });
})();
