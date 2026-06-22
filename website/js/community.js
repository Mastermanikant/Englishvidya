// website/js/community.js

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initRatings();
  initDiary();
  initUGC();
  initComments();
});

// --- RATINGS SYSTEM ---
async function initRatings() {
  const ratingContainer = document.getElementById('word-rating-container');
  if (!ratingContainer) return;

  const slug = ratingContainer.dataset.slug;
  const starsUI = document.querySelectorAll('.rating-star');
  const avgText = document.getElementById('rating-avg');
  const countText = document.getElementById('rating-count');

  // Load from API
  try {
    const res = await fetch(`/api/rate?slug=${slug}`);
    const data = await res.json();
    
    if (data.avgRating > 0) {
      avgText.textContent = data.avgRating.toFixed(1);
      countText.textContent = `(${data.totalVotes} votes)`;
      updateStarsUI(starsUI, data.avgRating);
    }
  } catch (err) {
    console.error('Failed to load ratings', err);
  }

  // Handle click to rate
  starsUI.forEach(star => {
    star.addEventListener('click', async (e) => {
      const value = parseInt(e.target.dataset.value);
      
      requireAuth(async () => {
        try {
          const res = await fetch('/api/rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, stars: value })
          });
          const result = await res.json();
          
          if (result.success) {
            avgText.textContent = result.avgRating.toFixed(1);
            countText.textContent = `(${result.totalVotes} votes)`;
            updateStarsUI(starsUI, result.avgRating);
            showToast('Rating saved successfully! ⭐', 'success');
          } else {
            showToast(result.error || 'Failed to save rating', 'error');
          }
        } catch (err) {
          showToast('Network error', 'error');
        }
      });
    });

    // Hover effects
    star.addEventListener('mouseover', (e) => {
      const val = parseInt(e.target.dataset.value);
      starsUI.forEach(s => {
        if (parseInt(s.dataset.value) <= val) s.style.color = '#fbbf24'; // hover color
        else s.style.color = 'var(--border)';
      });
    });
    
    star.addEventListener('mouseout', () => {
      // restore average
      const currentAvg = parseFloat(avgText.textContent) || 0;
      updateStarsUI(starsUI, currentAvg);
    });
  });
}

function updateStarsUI(stars, value) {
  stars.forEach(star => {
    const starVal = parseInt(star.dataset.value);
    if (starVal <= Math.round(value)) {
      star.style.color = '#f59e0b'; // solid gold
    } else {
      star.style.color = 'var(--border)'; // gray
    }
  });
}

// --- DIARY SYSTEM ---
function initDiary() {
  const addBtn = document.getElementById('add-diary-btn');
  if (!addBtn) return;

  const container = document.getElementById('word-rating-container');
  const slug = container ? container.dataset.slug : null;

  addBtn.addEventListener('click', () => {
    requireAuth(() => {
      openDiaryModal(slug);
    });
  });
}

function openDiaryModal(slug) {
  let modal = document.getElementById('diary-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'diary-modal';
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative;">
        <button onclick="closeDiaryModal()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        <h2 style="margin-top: 0; color: var(--text-main); font-size: 1.5rem;">Add Personal Note</h2>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">This note is private and synced to your cloud diary.</p>
        
        <textarea id="diary-textarea" rows="5" placeholder="Write your note here..." style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-body); color: var(--text-main); font-family: inherit; margin-bottom: 16px;"></textarea>
        
        <button id="save-diary-btn" class="panel-btn" style="width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Save Note</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDiaryModal();
    });
  }
  
  modal.style.display = 'flex';
  modal.offsetHeight; // reflow
  modal.style.opacity = '1';

  document.getElementById('save-diary-btn').onclick = async () => {
    const text = document.getElementById('diary-textarea').value.trim();
    if (!text) return showToast('Note cannot be empty', 'error');

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ type: 'note', word_slug: slug, note_content: text }]
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Note saved to cloud!', 'success');
        closeDiaryModal();
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    }
  };
}

function closeDiaryModal() {
  const modal = document.getElementById('diary-modal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

// --- UGC SYSTEM (Local Meanings) ---
async function initUGC() {
  const container = document.getElementById('word-rating-container');
  const slug = container ? container.dataset.slug : null;
  if (!slug) return;

  const listContainer = document.getElementById('ugc-list');
  if (listContainer) {
    try {
      const res = await fetch(`/api/ugc?slug=${slug}`);
      const meanings = await res.json();
      
      if (meanings.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No local meanings added yet. Be the first!</p>';
      } else {
        listContainer.innerHTML = meanings.map(m => `
          <div class="card" style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: bold; color: var(--text-main);">${escapeHTML(m.meaning_text)}</span>
              ${m.status === 'not_verified' ? '<span style="font-size: 0.75rem; background: #fbbf24; color: black; padding: 2px 6px; border-radius: 4px;">Not Verified</span>' : ''}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
              ${m.region ? `📍 ${escapeHTML(m.region)} • ` : ''} By ${escapeHTML(m.name)}
            </div>
            <div style="display: flex; gap: 12px;">
              <button onclick="voteUGC(${m.id}, 'up')" style="background: none; border: none; cursor: pointer; color: #10b981; display: flex; align-items: center; gap: 4px;">
                👍 <span id="up-${m.id}">${m.upvotes}</span>
              </button>
              <button onclick="voteUGC(${m.id}, 'down')" style="background: none; border: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; gap: 4px;">
                👎 <span id="down-${m.id}">${m.downvotes}</span>
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      listContainer.innerHTML = '<p style="color: red;">Failed to load meanings.</p>';
    }
  }

  const addBtn = document.getElementById('add-ugc-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      requireAuth(() => openUGCModal(slug));
    });
  }
}

function openUGCModal(slug) {
  let modal = document.getElementById('ugc-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ugc-modal';
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 32px; border-radius: 16px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative;">
        <button onclick="closeUGCModal()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        <h2 style="margin-top: 0; color: var(--text-main); font-size: 1.5rem;">Add Rural / Local Meaning</h2>
        
        <input type="text" id="ugc-meaning" placeholder="Meaning in your language..." style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-body); color: var(--text-main); margin-bottom: 16px;">
        <input type="text" id="ugc-region" placeholder="Region (e.g. Bihar, MP)" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-body); color: var(--text-main); margin-bottom: 24px;">
        
        <button id="save-ugc-btn" class="panel-btn" style="width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Submit for Review</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeUGCModal(); });
  }
  modal.style.display = 'flex';
  modal.offsetHeight;
  modal.style.opacity = '1';

  document.getElementById('save-ugc-btn').onclick = async () => {
    const text = document.getElementById('ugc-meaning').value.trim();
    const region = document.getElementById('ugc-region').value.trim();
    if (!text) return showToast('Meaning required', 'error');

    try {
      const res = await fetch('/api/ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', slug, meaning_text: text, region })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        closeUGCModal();
        setTimeout(initUGC, 1000); // reload list
      } else showToast(data.error, 'error');
    } catch (e) { showToast('Network error', 'error'); }
  };
}

function closeUGCModal() {
  const modal = document.getElementById('ugc-modal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

window.voteUGC = (meaning_id, vote_type) => {
  requireAuth(async () => {
    try {
      const res = await fetch('/api/ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', meaning_id, vote_type })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById(`up-${meaning_id}`).textContent = data.upvotes;
        document.getElementById(`down-${meaning_id}`).textContent = data.downvotes;
      } else showToast(data.error, 'error');
    } catch (e) { showToast('Network error', 'error'); }
  });
};

// --- COMMENTS SYSTEM ---
async function initComments() {
  const container = document.getElementById('word-rating-container');
  const slug = container ? container.dataset.slug : null;
  if (!slug) return;

  const listContainer = document.getElementById('comments-list');
  const postBtn = document.getElementById('post-comment-btn');
  const inputEl = document.getElementById('comment-input');
  const toggleRefsBtn = document.getElementById('toggle-refs-btn');
  const refsContainer = document.getElementById('refs-container');
  const addMoreRefsBtn = document.getElementById('add-more-refs-btn');

  // Handle reference inputs visibility
  if (toggleRefsBtn && refsContainer) {
    toggleRefsBtn.addEventListener('click', () => {
      refsContainer.style.display = refsContainer.style.display === 'none' ? 'flex' : 'none';
    });
  }

  if (addMoreRefsBtn) {
    addMoreRefsBtn.addEventListener('click', () => {
      const hiddenInputs = refsContainer.querySelectorAll('input[style*="display: none"]');
      if (hiddenInputs.length > 0) {
        hiddenInputs[0].style.display = 'block';
        if (hiddenInputs.length === 1) addMoreRefsBtn.style.display = 'none'; // all shown
      }
    });
  }

  if (listContainer) {
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      const comments = await res.json();
      
      if (comments.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No comments yet. Start the discussion!</p>';
      } else {
        listContainer.innerHTML = comments.map(c => {
          let refsHtml = '';
          try {
            const refs = JSON.parse(c.reference_links || '[]');
            if (refs.length > 0) {
              refsHtml = `<div style="margin-top: 8px; font-size: 0.85rem;">
                <strong style="color: var(--text-secondary);">References:</strong>
                <ul style="margin: 4px 0 0 0; padding-left: 20px;">
                  ${refs.map(r => `<li><a href="${escapeHTML(r)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent);">${escapeHTML(r)}</a></li>`).join('')}
                </ul>
              </div>`;
            }
          } catch(e) {}

          return `
          <div style="display: flex; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <img src="${c.avatar_url || '/assets/icons/icon-192.png'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <div>
                  <span style="font-weight: bold; color: var(--text-main); margin-right: 8px;">${escapeHTML(c.name)}</span>
                  ${c.user_rating ? `<span style="color: #f59e0b; font-size: 0.9rem;">${'★'.repeat(c.user_rating)}${'☆'.repeat(5 - c.user_rating)}</span>` : ''}
                  ${c.trust_score > 50 ? '<span style="background: var(--accent-soft); color: var(--accent); font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Pro</span>' : ''}
                </div>
                <span style="font-size: 0.8rem; color: var(--text-tertiary);">${new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p style="margin: 0; color: var(--text-primary); font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(c.comment_text)}</p>
              ${refsHtml}
            </div>
          </div>
          `;
        }).join('');
      }
    } catch (e) {
      listContainer.innerHTML = '<p style="color: red;">Failed to load comments.</p>';
    }
  }

  if (postBtn && inputEl) {
    inputEl.addEventListener('focus', () => {
      // Just check auth; if not logged in, it will trigger the redirect flow
      requireAuth(() => {});
    });

    postBtn.addEventListener('click', () => {
      requireAuth(async () => {
        const text = inputEl.value.trim();
        if (!text) return showToast('Comment cannot be empty', 'error');
        
        // Client-Side (Offline) Keyword Blocker to save server load
        const blockedKeywords = ['bjp', 'congress', 'hindu', 'muslim', 'islam', 'christian', 'modi', 'rahul', 'politics', 'धर्म', 'राजनीति', 'गाली', 'chutiya', 'madarchod', 'bhenchod', 'scam'];
        const lowerText = text.toLowerCase();
        for (const kw of blockedKeywords) {
          if (lowerText.includes(kw)) {
            return showToast('आपका मैसेज हमारी कम्युनिटी गाइडलाइन्स (राजनीति, धर्म या अभद्र भाषा) के खिलाफ है।', 'error');
          }
        }
        
        // Client-Side URL Blocker
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i;
        if (urlRegex.test(text)) {
          return showToast('कमेंट में लिंक (URL) डालना सख्त मना है। कृपया नीचे "Reference Links" वाले बॉक्स का इस्तेमाल करें।', 'error');
        }

        // Collect references
        const refInputs = document.querySelectorAll('.ref-input');
        const references = [];
        if (refInputs) {
          refInputs.forEach(i => { if (i.value.trim()) references.push(i.value.trim()); });
        }

        postBtn.disabled = true;
        try {
          const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, text, references })
          });
          const data = await res.json();
          if (data.success) {
            inputEl.value = '';
            showToast('Comment posted!', 'success');
            setTimeout(initComments, 500); // reload list
          } else {
            showToast(data.error, 'error');
          }
        } catch (e) {
          showToast('Network error', 'error');
        }
        postBtn.disabled = false;
      });
    });
  }
}

// --- TOAST SYSTEM ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style = `
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-weight: bold;
    animation: slideUp 0.3s ease-out;
  `;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
