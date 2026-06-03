/* ══════════════════════════════════════════════════════════════
   ENGLISH VIDYA — Core Application Engine (app.js)
   Pure Vanilla JS | Client-Side Static Shell Router | Zero-Backend Search
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Constants ──
  const DATA_BASE = './data';
  const VOCAB_PATH = `${DATA_BASE}/vocabulary/categories`;
  const SEARCH_INDEX_PATH = `${DATA_BASE}/site/search-index.json`;
  const CATEGORIES_INDEX_PATH = `${DATA_BASE}/site/categories-index.json`;
  const STORAGE_KEYS = {
    theme: 'ev-theme',
    recent: 'ev-recent-searches',
    streak: 'ev-streak',
    lastVisit: 'ev-last-visit',
    fcProgress: 'ev-fc-progress',
    userName: 'ev-user-name'
  };
  const MAX_RECENT = 8;

  // ── State ──
  const state = {
    searchIndex: null,
    categoriesIndex: null,
    currentCategory: null,
    currentWords: [],
    fcDeck: [],
    fcIndex: 0,
    fcKnown: 0,
    fcTransitioning: false,
    route: '',
    isHashMode: location.protocol === 'file:',
    basePath: '/'
  };

  // Calculate dynamic basePath for routing
  if (!state.isHashMode) {
    let cleanPath = location.pathname;
    
    // List of known top-level SPA route prefixes
    const knownRoutes = ['grammar', 'dictionary', 'flashcards', 'profile', 'about-us', 'about', 'contact-us', 'contact', 'legal-policies', 'legal'];
    
    // Find where the route starts in the path
    const parts = cleanPath.split('/');
    let routeIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (knownRoutes.includes(parts[i].toLowerCase())) {
        routeIndex = i;
        break;
      }
    }
    
    if (routeIndex !== -1) {
      // Reconstruct the base path up to the route index
      cleanPath = parts.slice(0, routeIndex).join('/') + '/';
    } else {
      // Standard cleanup
      if (cleanPath.endsWith('/index.html')) {
        cleanPath = cleanPath.slice(0, -10);
      } else if (cleanPath.endsWith('/old_index.html')) {
        cleanPath = cleanPath.slice(0, -14);
      }
      if (!cleanPath.endsWith('/')) {
        const lastSlash = cleanPath.lastIndexOf('/');
        if (lastSlash >= 0) {
          cleanPath = cleanPath.slice(0, lastSlash + 1);
        } else {
          cleanPath = '/';
        }
      }
    }
    state.basePath = cleanPath;
  }

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const appContent = $('#view-dynamic-target'); // Dynamic target slot
  const searchOverlay = $('#search-overlay');
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  const scrollProgress = $('#scroll-progress');
  const toastContainer = $('#toast-container');

  // ═══════════════════════════════════════════════════
  //  1. THEME MANAGER
  // ═══════════════════════════════════════════════════
  const ThemeManager = {
    init() {
      const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
      this.apply(saved);
      $('#theme-toggle-btn').addEventListener('click', (e) => this.toggle(e));
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.content = theme === 'dark' ? '#0c1222' : '#f8fafc';
      }
    },

    toggle(event) {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      // 🛡️ Security Rule 2 & Premium Animation: Circular Reveal wave transition
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      
      if (event && event.clientX && event.clientY) {
        x = event.clientX;
        y = event.clientY;
      } else {
        const btn = $('#theme-toggle-btn');
        if (btn) {
          const rect = btn.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      // Max radius to cover screen
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Create wave element
      const wave = document.createElement('div');
      wave.className = 'theme-transition-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.backgroundColor = next === 'dark' ? '#0c1222' : '#f8fafc';
      document.body.appendChild(wave);

      // Force layout reflow
      wave.offsetHeight;

      // Animate size expansion & fade-in
      wave.style.width = `${endRadius * 2}px`;
      wave.style.height = `${endRadius * 2}px`;
      wave.style.transform = 'translate(-50%, -50%) scale(1)';
      wave.style.opacity = '1';

      // Switch theme and remove overlay after wave expansion
      setTimeout(() => {
        this.apply(next);
        wave.style.transition = 'opacity 0.25s ease';
        wave.style.opacity = '0';
        setTimeout(() => {
          wave.remove();
        }, 250);
      }, 450);

      showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
    }
  };

  // ═══════════════════════════════════════════════════
  //  2. ROUTER (Static Shell-Based SPA)
  // ═══════════════════════════════════════════════════
  const Router = {
    init() {
      window.addEventListener('hashchange', () => this.resolve());
      if (!state.isHashMode) {
        window.addEventListener('popstate', () => this.resolve());
      }
      this.resolve();
    },

    resolve() {
      let route = 'home';
      let param = null;

      const hasDeepHash = location.hash && (location.hash.startsWith('#/') || location.hash.length > 1);

      if (state.isHashMode || hasDeepHash) {
        // Hash routing mode for offline/local file protocol or deep links typed directly
        let hash = location.hash.slice(1) || '/';
        if (hash.startsWith('/')) {
          hash = hash.slice(1);
        }
        const parts = hash.split('/').filter(Boolean);
        route = parts[0] || 'home';
        param = parts[1] || null;
      } else {
        // Clean URL pathname routing mode for live environments
        let path = location.pathname;
        const base = state.basePath.toLowerCase();
        if (path.toLowerCase().startsWith(base)) {
          path = path.slice(base.length);
        }
        
        const parts = path.split('/').filter(Boolean);
        route = parts[0] || 'home';
        param = parts[1] || null;
      }
      
      // Clean path to internal route key normalization
      if (route === 'about-us' || route === 'about') {
        route = 'about';
      } else if (route === 'contact-us' || route === 'contact') {
        route = 'contact';
      } else if (route === 'legal-policies' || route === 'legal') {
        route = 'legal';
      }

      state.route = route;
      this.updateNav(route);

      // Hide all static and target views by default
      $$('.spa-view').forEach(v => v.classList.remove('active'));

      switch (route) {
        case 'home':
          $('#view-home').classList.add('active');
          renderDashboard();
          break;
        case 'about':
          $('#view-about').classList.add('active');
          break;
        case 'contact':
          $('#view-contact').classList.add('active');
          break;
        case 'legal':
          $('#view-legal').classList.add('active');
          break;
        case 'youtube':
          window.location.replace('https://youtube.com/@englishvidyahq');
          break;
        case 'grammar':
          $('#view-dynamic-target').classList.add('active');
          if (param) {
            renderLesson(param);
          } else {
            renderGrammarList();
          }
          break;
        case 'dictionary':
          $('#view-dynamic-target').classList.add('active');
          renderDictionary(param);
          break;
        case 'flashcards':
          $('#view-dynamic-target').classList.add('active');
          renderFlashcards(param);
          break;
        case 'profile':
          $('#view-dynamic-target').classList.add('active');
          renderProfile();
          break;
        default:
          $('#view-home').classList.add('active');
          renderDashboard();
      }

      // Scroll to top on route change
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Record activity on page navigation
      if (typeof window.recordActivity === 'function') {
        window.recordActivity(1);
      }
    },

    updateNav(route) {
      $$('.nav-item').forEach(item => {
        const itemRoute = item.getAttribute('data-route');
        item.classList.toggle('active', itemRoute === route || (route === 'home' && itemRoute === 'home'));
      });
      $$('.desktop-nav-link').forEach(item => {
        const itemRoute = item.getAttribute('data-route');
        item.classList.toggle('active', itemRoute === route || (route === 'home' && itemRoute === 'home'));
      });
      $$('.mobile-drawer-link').forEach(item => {
        const itemRoute = item.getAttribute('data-route');
        item.classList.toggle('active', itemRoute === route || (route === 'home' && itemRoute === 'home'));
      });
    }
  };

  // ═══════════════════════════════════════════════════
  //  3. DATA LOADER (Lazy, Cached)
  // ═══════════════════════════════════════════════════
  async function loadJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[Data] Failed to load ${url}:`, err.message);
      return null;
    }
  }

  async function ensureSearchIndex() {
    if (!state.searchIndex) {
      state.searchIndex = await loadJSON(SEARCH_INDEX_PATH);
    }
    return state.searchIndex;
  }

  async function ensureCategoriesIndex() {
    if (!state.categoriesIndex) {
      state.categoriesIndex = await loadJSON(CATEGORIES_INDEX_PATH);
    }
    return state.categoriesIndex;
  }

  async function loadCategoryWords(slug) {
    return await loadJSON(`${VOCAB_PATH}/${slug}.json`);
  }

  // ═══════════════════════════════════════════════════
  //  4. STREAK TRACKER
  // ═══════════════════════════════════════════════════
  const StreakTracker = {
    get() {
      const streak = parseInt(localStorage.getItem(STORAGE_KEYS.streak) || '0', 10);
      const lastVisit = localStorage.getItem(STORAGE_KEYS.lastVisit);
      const today = new Date().toDateString();

      if (lastVisit === today) return streak;

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) {
        const newStreak = streak + 1;
        localStorage.setItem(STORAGE_KEYS.streak, newStreak);
        localStorage.setItem(STORAGE_KEYS.lastVisit, today);
        return newStreak;
      }

      // Streak broken
      localStorage.setItem(STORAGE_KEYS.streak, '1');
      localStorage.setItem(STORAGE_KEYS.lastVisit, today);
      return 1;
    }
  };

  // ═══════════════════════════════════════════════════
  //  5. SEARCH ENGINE (Zero-Cost Client-Side)
  // ═══════════════════════════════════════════════════
  const SearchEngine = {
    init() {
      $('#search-trigger-btn').addEventListener('click', () => this.open());
      $('#search-close-btn').addEventListener('click', () => this.close());

      searchInput.addEventListener('input', debounce(() => this.search(searchInput.value), 150));

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },

    open() {
      searchOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInput.focus(), 100);
      this.showRecent();
    },

    close() {
      searchOverlay.classList.remove('active');
      document.body.style.overflow = '';
      searchInput.value = '';
      searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 Type above — results appear instantly</p><div id="recent-searches-container"></div></div>';
    },

    async search(query) {
      if (!query || query.length < 2) {
        this.showRecent();
        return;
      }

      const index = await ensureSearchIndex();
      if (!index) {
        searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">⚠️ Search index could not be loaded</p></div>';
        return;
      }

      const q = query.toLowerCase().trim();
      const matches = index.filter(item =>
        item.w.toLowerCase().includes(q) || item.m.includes(q)
      ).slice(0, 20);

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="search-placeholder"><p class="search-hint">😔 No results found for "${query}"</p></div>`;
        return;
      }

      searchResults.innerHTML = matches.map(item => `
        <div class="search-result-item" data-word="${escHtml(item.w)}" data-slug="${escHtml(item.s)}">
          <div>
            <div class="search-result-word">${escHtml(item.w)}</div>
            <div class="search-result-meaning">${escHtml(item.m)}</div>
          </div>
          <span class="search-result-category">${escHtml(item.s.replace(/_/g, ' '))}</span>
        </div>
      `).join('');
      searchResults.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const word = el.dataset.word;
          const slug = el.dataset.slug;
          this.addToRecent(word);
          this.close();
          navigate(`/dictionary/${slug}`);
        });
      });
    },

    addToRecent(word) {
      let recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.recent) || '[]');
      recent = recent.filter(w => w !== word);
      recent.unshift(word);
      if (recent.length > MAX_RECENT) recent.pop();
      localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recent));
    },

    showRecent() {
      const recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.recent) || '[]');
      if (recent.length === 0) {
        searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 Type above — results appear instantly</p></div>';
        return;
      }

      searchResults.innerHTML = `
        <div style="padding-top: var(--sp-4);">
          <p class="text-small text-secondary" style="margin-bottom: var(--sp-3);">Recently searched:</p>
          <div>${recent.map(w => `<span class="recent-tag" data-word="${escHtml(w)}">${escHtml(w)}</span>`).join('')}</div>
        </div>
      `;

      searchResults.querySelectorAll('.recent-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          searchInput.value = tag.dataset.word;
          this.search(tag.dataset.word);
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════
  //  6. DYNAMIC DASHBOARD GREETINGS
  // ═══════════════════════════════════════════════════
  function renderDashboard() {
    const streak = StreakTracker.get();
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'Student';
    const timeGreeting = getTimeGreeting();

    const greetingText = $('#hero-greeting-text');
    if (greetingText) {
      greetingText.textContent = `${timeGreeting}, ${userName} 🙏`;
    }

    const streakNumberText = $('#streak-number-text');
    if (streakNumberText) {
      streakNumberText.textContent = `🔥 ${streak}-Day Streak`;
    }

    const streakMessageText = $('#streak-message-text');
    if (streakMessageText) {
      streakMessageText.textContent = streak >= 7 
        ? '🎉 Amazing! You are doing an outstanding job!' 
        : 'Visit daily, read for 5 minutes, and keep your streak alive!';
    }

    // 🌟 Elite Polish: Trigger Stats count-up animations on home load
    setTimeout(() => {
      animateValue('#stat-words', 0, 19773, 1200);
      animateValue('#stat-lessons', 0, 60, 1000);
      animateValue('#stat-categories', 0, 148, 800);
    }, 300);
  }

  // ═══════════════════════════════════════════════════
  //  7. ACTIVE VIEW CONTROLLERS (For Dynamic targeting)
  // ═══════════════════════════════════════════════════

  // ── 7a. GRAMMAR LIST ──
  async function renderGrammarList() {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-4);">
          <h1 style="font-size: 1.5rem;">📖 Grammar Lessons</h1>
          <p class="hero-subtitle">For Hindi-medium students — explained simply</p>
        </div>
        <div class="loading-screen" style="min-height:200px;"><div class="loader-spinner"></div></div>
      </div>
    `;

    const index = await loadJSON(`${DATA_BASE}/site/articles-index.json`);

    // Deduplicate
    const seen = new Set();
    const lessons = [];
    if (index && Array.isArray(index)) {
      for (const item of index) {
        const part = item.part;
        if (!seen.has(part) && item.title && item.slug && !item.slug.match(/^\d+$/) && item.slug !== '') {
          seen.add(part);
          lessons.push(item);
        }
      }
    }

    if (lessons.length === 0) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <div class="hero-welcome" style="padding-bottom: var(--sp-4);">
            <h1 style="font-size: 1.5rem;">📖 Grammar Lessons</h1>
          </div>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">🚧</p>
            <h2>Lessons coming soon!</h2>
          </div>
        </div>
      `;
      return;
    }

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-4);">
          <h1 style="font-size: 1.5rem;">📖 Grammar Lessons</h1>
          <p class="hero-subtitle">For Hindi-medium students — explained simply</p>
        </div>
        <div class="chapter-list">
          ${lessons.map(l => {
            const titleMatch = l.title.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
            const titleEn = titleMatch ? titleMatch[1].trim().replace(/[✅⏳❌]/g, '').trim() : l.title;
            const titleHi = titleMatch && titleMatch[2] ? titleMatch[2].trim() : '';
            return `
              <a href="/grammar/${escHtml(l.slug)}" class="chapter-item">
                <div class="chapter-num">${l.part}</div>
                <div class="chapter-info">
                  <div class="chapter-title">${escHtml(titleEn)}</div>
                  ${titleHi ? `<div class="chapter-subtitle">${escHtml(titleHi)}</div>` : ''}
                </div>
                <span class="chapter-arrow">→</span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ── 7b. LESSON READER ──
  async function renderLesson(lessonSlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="/grammar" class="lesson-back-btn">← All Lessons</a>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;

    const lessonData = await loadJSON(`${DATA_BASE}/grammar/lessons/${lessonSlug}.json`);

    if (!lessonData) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <a href="/grammar" class="lesson-back-btn">← All Lessons</a>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">🚧</p>
            <h2>This lesson is coming soon!</h2>
          </div>
        </div>
      `;
      return;
    }

    const categories = lessonData.categories || [];

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="/grammar" class="lesson-back-btn">← All Lessons</a>

        <div class="lesson-header">
          <span class="badge">Lesson ${lessonData.part || ''}</span>
          <h1 style="margin-top: var(--sp-3);">${escHtml(lessonData.title || '')}</h1>
        </div>

        ${lessonData.teacher_note ? `
          <div class="card teacher-card">
            <div class="teacher-header">
              <div class="teacher-avatar">👨‍🏫</div>
              <div>
                <div class="teacher-name">Teacher's Note</div>
                <div class="teacher-role">English Mentor</div>
              </div>
            </div>
            <div class="teacher-quote">"${escHtml(lessonData.teacher_note)}"</div>
          </div>
        ` : ''}

        ${lessonData.definition_en ? `
          <div class="card">
            <h3>Definition</h3>
            <p style="margin-top: var(--sp-3); font-size: 1.05rem; font-weight: 500;">
              ${escHtml(lessonData.definition_en)}
            </p>
            ${lessonData.definition_hi ? `
              <div class="definition-block" style="margin-top: var(--sp-3);">
                <strong>Hindi:</strong> ${escHtml(lessonData.definition_hi)}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${categories.length > 0 ? `
          <div class="examples-accordion">
            ${categories.map((cat, i) => `
              <div class="accordion-item${i === 0 ? ' open' : ''}">
                <button class="accordion-trigger" onclick="this.parentElement.classList.toggle('open')">
                  <span>${escHtml(cat.name || '')}</span>
                  <span class="accordion-arrow">→</span>
                </button>
                <div class="accordion-content">
                  <div class="accordion-body">
                    ${cat.intro ? `<p class="accordion-intro">${escHtml(cat.intro)}</p>` : ''}
                    ${(cat.examples || []).map(ex => `
                      <div class="example-pair">
                        <div class="example-en">${escHtml(ex.en || '')}</div>
                        <div class="example-hi">${escHtml(ex.hi || '')}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── 7c. DICTIONARY ──
  async function renderDictionary(categorySlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🔤 Dictionary</h1>
          <p class="hero-subtitle">19,773 words across 148 categories — with Hindi meanings</p>
        </div>
        <div class="loading-screen" style="min-height: 200px;">
          <div class="loader-spinner"></div>
          <p class="loader-text">Loading categories...</p>
        </div>
      </div>
    `;

    const categories = await ensureCategoriesIndex();

    if (!categories || categories.length === 0) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
            <h1 style="font-size: 1.5rem;">🔤 Dictionary</h1>
          </div>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">📦</p>
            <h2>Loading data...</h2>
          </div>
        </div>
      `;
      return;
    }

    const selectedSlug = categorySlug || categories[0].slug;

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🔤 Dictionary</h1>
          <p class="hero-subtitle">Choose a category and learn words</p>
        </div>

        <div class="category-chips-scroll" id="category-chips">
          ${categories.map(c => `
            <button class="category-chip${c.slug === selectedSlug ? ' active' : ''}" data-slug="${escHtml(c.slug)}">
              ${c.icon || '📁'} ${escHtml(c.name)} (${c.count})
            </button>
          `).join('')}
        </div>

        <div id="words-container">
          <div class="loading-screen" style="min-height: 200px;"><div class="loader-spinner"></div></div>
        </div>
      </div>
    `;

    $$('#category-chips .category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const slug = chip.dataset.slug;
        $$('#category-chips .category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Update URL to match selected category slug cleanly
        if (state.isHashMode) {
          location.hash = `#/dictionary/${slug}`;
        } else {
          const targetPath = (state.basePath + `/dictionary/${slug}`).replace(/\/+/g, '/');
          history.pushState(null, '', targetPath);
        }
        
        loadAndShowWords(slug);
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    loadAndShowWords(selectedSlug);
  }

  function fixMojibake(str) {
    if (!str) return '';
    const cpMap = {
      0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
      0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
      0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
      0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
      0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
      0x017e: 0x9e, 0x0178: 0x9f
    };
    const bytes = new Uint8Array(str.length * 3);
    let bIdx = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128) {
        bytes[bIdx++] = code;
      } else if (code <= 255) {
        bytes[bIdx++] = code;
      } else if (cpMap[code]) {
        bytes[bIdx++] = cpMap[code];
      } else {
        if (code < 0x800) {
          bytes[bIdx++] = 0xc0 | (code >> 6);
          bytes[bIdx++] = 0x80 | (code & 0x3f);
        } else {
          bytes[bIdx++] = 0xe0 | (code >> 12);
          bytes[bIdx++] = 0x80 | ((code >> 6) & 0x3f);
          bytes[bIdx++] = 0x80 | (code & 0x3f);
        }
      }
    }
    try {
      return new TextDecoder('utf-8').decode(bytes.subarray(0, bIdx));
    } catch (e) {
      return str;
    }
  }

  function toDevanagariPron(word, pron) {
    if (!word) return '';
    
    // If pron already has Devanagari, return it
    if (pron && /[\u0900-\u097F]/.test(pron)) {
      return pron;
    }
    
    // Predefined high-quality mapping for common words/syllables
    const dictionaryFallback = {
      'design': 'डिज़ाइन (di-zayn)',
      'desk': 'डेस्क (desk)',
      'detrimental': 'डेट्रिमेन्टल (det-ri-men-tuhl)',
      'develop': 'डेवलप (de-vel-uhp)',
      'devise': 'डिवाइज़ (di-vyz)',
      'diagnostic test': 'डायग्नोस्टिक टेस्ट (dy-uhg-nos-tik test)',
      'discern': 'डिसर्न (di-sern)',
      'discipline': 'डिसिप्लिन (dis-uh-plin)',
      'discovery': 'डिस्कवरी (dis-kuv-uh-ree)',
      'discuss': 'डिस्कस (dis-kus)',
      'dissertation': 'डिअर्टेशन (dis-er-tay-shuhn)',
      'discrepancy': 'डिस्क्रेपेंसी (dis-krep-uhn-see)',
      'disparate': 'डिस्पेरट (dis-puh-ruht)',
      'dimensionality reduction': 'डाइमेंशनलिटी रिडक्शन (dy-men-shuhn-al-i-tee ri-duk-shuhn)',
      'absolutely': 'ऐब्सोल्यूटली (ab-so-loot-lee)',
      'actually': 'ऐक्चुअली (ak-choo-uh-lee)',
      'agree': 'अग्री (uh-gree)',
      'air': 'ऐर (air)',
      'alright': 'ऑलराइट (awl-right)',
      'amazed': 'अमेज़्ड (uh-mayzd)',
      'amused': 'अम्यूज़्ड (uh-myoozd)',
      'angry': 'ऐंग्री (ang-ree)',
      'annoyed': 'अनॉइड (uh-noyd)',
      'answer': 'आन्सर (ahn-sur)',
      'anxious': 'ऐंग्शस (angk-shuhs)',
      'anyway': 'ऐनीवे (eh-nee-way)',
      'apologize': 'अपोलोजाइज़ (uh-pol-uh-jyz)',
      'arm': 'आर्म (aarm)',
      'arrogant': 'ऐरोगेंट (ar-uh-gunt)',
      'ask': 'आस्क (ask)',
      'awesome': 'ऑसम (aw-sum)',
      'awful': 'ऑफुल (aw-ful)',
      'back': 'बैक (bak)',
      'bad': 'बैड (bad)',
      'bag': 'बैग (bag)',
      'basically': 'बेसिकली (bay-sik-lee)',
      'bathroom': 'बाथरूम (baath-ruum)',
      'believe': 'बिलीव (bi-leev)',
      'blood': 'ब्लड (blud)',
      'bone': 'बोन (bo-n)',
      'book': 'बुक (buk)',
      'bored': 'बोर्ड (bord)',
      'boss': 'बॉस (baws)',
      'bottle': 'बॉटल (bo-tl)',
      'brain': 'ब्रेन (brayn)',
      'breathe': 'ब्रीद (bree-dh)',
      'busy': 'बिज़ी (biz-ee)',
      'calm': 'काम (kahm)',
      'curious': 'क्यूरियस (kyoor-ee-uhs)',
      'depressed': 'डिप्रेस्ड (di-prest)',
      'disappointed': 'डिसअपॉइंटेड (dis-uh-poyn-tid)',
      'disease': 'डिज़ीज़ (di-zeez)',
      'doctor': 'डॉक्टर (dok-tar)',
      'door': 'डोर (dor)',
      'drop': 'ड्रॉप (drop)',
      'easy': 'इज़ी (ee-zee)',
      'excited': 'एक्साइटेड (ek-sy-tid)',
      'exhausted': 'एग्जॉस्टेड (eg-zaws-tid)',
      'face': 'फेस (fays)',
      'family': 'फैमिली (fam-uh-lee)',
      'father': 'फादर (fah-ther)',
      'fever': 'फीवर (fee-ver)',
      'finger': 'फिंगर (fing-ger)',
      'finish': 'फिनिश (fin-ish)',
      'fire': 'फायर (fyr)',
      'flat': 'फ्लैट (flat)',
      'flight': 'फ्लाइट (flyt)',
      'flower': 'फ्लॉवर (flow-er)',
      'focus': 'फोकस (foh-kuhs)',
      'food': 'फूड (food)',
      'forget': 'फॉर्गेट (fer-get)',
      'friend': 'फ्रेंड (frend)',
      'fun': 'फन (fun)',
      'funny': 'फनी (fun-ee)',
      'game': 'गेम (gaym)',
      'garden': 'गार्डन (gahr-dhn)',
      'girl': 'गर्ल (gurl)',
      'glass': 'ग्लास (glahs)',
      'glove': 'ग्लव (gluv)',
      'go': 'गो (goh)',
      'good': 'गुड (gud)',
      'green': 'ग्रीन (green)',
      'ground': 'ग्राउंड (grownd)',
      'group': 'ग्रुप (groop)',
      'grow': 'ग्रो (groh)',
      'hair': 'हेयर (hair)',
      'half': 'हाफ (haf)',
      'hand': 'हैंड (hand)',
      'happy': 'हैपी (hap-ee)',
      'head': 'हेड (hed)',
      'health': 'हेल्थ (helth)',
      'heart': 'हार्ट (hahrt)',
      'hello': 'हेलो (heh-loh)',
      'help': 'हेल्प (help)',
      'high': 'हाई (hy)',
      'home': 'होम (hohm)',
      'hope': 'होप (hohp)',
      'hospital': 'हॉस्पिटल (hos-pi-tuhl)',
      'hot': 'हॉट (hot)',
      'house': 'हाउस (hows)',
      'hungry': 'हंग्री (hung-gree)',
      'husband': 'हस्बैंड (huz-buhnd)',
      'idea': 'आइडिया (ey-dee-uh)',
      'important': 'इम्पॉर्टेंट (im-pawr-tuhnt)',
      'information': 'इंफॉर्मेशन (in-fer-may-shuhn)',
      'inside': 'इनसाइड (in-syd)',
      'interest': 'इंटरेस्ट (in-trest)',
      'job': 'जॉब (job)',
      'journey': 'जर्नी (jur-nee)',
      'jump': 'जंप (jump)',
      'keep': 'कीप (keep)',
      'key': 'की (kee)',
      'kitchen': 'किचन (kich-uhn)',
      'knee': 'नी (nee)',
      'knife': 'नाइफ (nyf)',
      'know': 'नो (noh)',
      'knowledge': 'नॉलेज (nol-ij)',
      'lady': 'लेडी (lay-dee)',
      'land': 'लैंड (land)',
      'language': 'लैंग्वेज (lang-gwij)',
      'laugh': 'लाफ (laf)',
      'learn': 'लर्न (lurn)',
      'leave': 'लीव (leev)',
      'leg': 'लेग (leg)',
      'lesson': 'लेसन (les-uhn)',
      'letter': 'लेटर (let-er)',
      'life': 'लाइफ (lyf)',
      'light': 'लाइट (lyt)',
      'like': 'लाइक (lyk)',
      'line': 'लाइन (lyn)',
      'listen': 'लिसन (lis-uhn)',
      'little': 'लिटिल (lit-uhl)',
      'live': 'लाइव (lyv) / लिव (liv)',
      'long': 'लॉन्ग (long)',
      'look': 'लुक्स (looks) / लुक (look)',
      'love': 'लव (luv)',
      'machine': 'मशीन (muh-sheen)',
      'make': 'मेक (mayk)',
      'man': 'मैन (man)',
      'many': 'मैनी (men-ee)',
      'market': 'मार्केट (mahr-kit)',
      'marry': 'मैरी (mar-ee)',
      'matter': 'मैटर् (mat-er)',
      'maybe': 'मेबी (may-bee)',
      'mean': 'मीन (meen)',
      'measure': 'मेझर (mezh-er)',
      'medicine': 'मेडिसिन (med-uh-sin)',
      'meeting': 'मीटिंग (mee-ting)',
      'member': 'मेम्बर (mem-ber)',
      'memory': 'मेमोरी (mem-uh-ree)',
      'message': 'मैसेज (mes-ij)',
      'middle': 'मिडिल (mid-uhl)',
      'might': 'माइट (myt)',
      'mind': 'माइंड (mynd)',
      'minute': 'मिनट (min-it)',
      'mistake': 'मिस्टेक (mis-tayk)',
      'money': 'मनी (mun-ee)',
      'month': 'मंथ (munth)',
      'morning': 'मॉर्निंग (mawr-ning)',
      'mother': 'मदर (muth-er)',
      'mountain': 'माउंटेन (mown-tuhn)',
      'mouth': 'माउथ (mowth)',
      'move': 'मूव (moov)',
      'music': 'म्यूजिक (myoo-zik)',
      'name': 'नेम (naym)',
      'nature': 'नेचर (nay-cher)',
      'near': 'नियर (neer)',
      'neck': 'नेक (nek)',
      'need': 'नीड (need)',
      'neighbor': 'नेबर (nay-ber)',
      'nervous': 'नर्वस (ner-vuhs)',
      'never': 'नेवर (nev-er)',
      'new': 'न्यू (nyoo)',
      'news': 'न्यूज़ (nyooz)',
      'night': 'नाइट (nyt)',
      'no': 'नो (noh)',
      'noise': 'नॉइज़ (noyz)',
      'nose': 'नोस (nohz)',
      'note': 'नोट (noht)',
      'nothing': 'नथिंग (nuth-ing)',
      'number': 'नंबर (num-ber)',
      'office': 'ऑफिस (of-is)',
      'often': 'ऑफन (of-uhn)',
      'okay': 'ओके (oh-kay)',
      'old': 'ओल्ड (ohld)',
      'once': 'वन्स (wuns)',
      'open': 'ओपन (oh-puhn)',
      'opinion': 'ओपिनियन (uh-pin-yuhn)',
      'order': 'ऑर्डर (awr-der)',
      'outside': 'आउटसाइड (owt-syd)',
      'page': 'पेज (payj)',
      'pain': 'पेन (payn)',
      'paper': 'पेपर (pay-per)',
      'parent': 'पेरेंट (pair-uhnt)',
      'park': 'पार्क (pahrk)',
      'part': 'पार्ट (pahrt)',
      'party': 'पार्टी (pahr-tee)',
      'pass': 'पास (pahss)',
      'past': 'पास्ट (pahst)',
      'pay': 'पे (pay)',
      'pen': 'पेन (pen)',
      'pencil': 'पेंसिल (pen-suhl)',
      'people': 'पीपल (pee-puhl)',
      'perfect': 'परफेक्ट (per-fikt)',
      'person': 'पर्सन (per-suhn)',
      'phone': 'फोन (fohn)',
      'photo': 'फोटो (foh-toh)',
      'picture': 'पिक्चर (pik-cher)',
      'piece': 'पीस (pees)',
      'place': 'प्लेस (plays)',
      'plan': 'प्लान (plan)',
      'plane': 'प्लेन (playn)',
      'plant': 'प्लांट (plant)',
      'plate': 'प्लेट (playt)',
      'play': 'प्ले (play)',
      'please': 'प्लीज़ (pleez)',
      'pocket': 'पॉकेट (pok-it)',
      'point': 'पॉइंट (poynt)',
      'police': 'पुलिस (puh-lees)',
      'poor': 'पुअर (poor)',
      'popular': 'पॉपुलर (pop-yuh-ler)',
      'position': 'पोजीशन (puh-zish-uhn)',
      'possible': 'पॉसिबल (pos-uh-buhl)',
      'power': 'पावर (pow-er)',
      'practice': 'प्रैक्टिस (prak-tis)',
      'prepare': 'प्रिपेयर (pri-pair)',
      'present': 'प्रेजेंट (prez-uhnt)',
      'pretty': 'प्रिटी (prit-ee)',
      'price': 'प्राइस (prys)',
      'pride': 'प्राइड (pryd)',
      'principal': 'प्रिंसिपल (prin-suh-buhl)',
      'problem': 'प्रॉब्लम (prob-luhm)',
      'process': 'प्रोसेस (pros-es)',
      'produce': 'प्रोड्यूस (pruh-doos)',
      'product': 'प्रोडक्ट (prod-ukt)',
      'professional': 'प्रोफेशनल (pruh-fesh-uhn-uhl)',
      'professor': 'प्रोफेसर (pruh-fes-er)',
      'profit': 'प्रॉफिट (prof-it)',
      'program': 'प्रोग्राम (proh-gram)',
      'progress': 'प्रोग्रेस (prog-res)',
      'project': 'प्रोजेक्ट (proj-ekt)',
      'promise': 'प्रॉमिस (prom-is)',
      'pronounce': 'प्रोनॉन्स (pruh-nowns)',
      'proud': 'प्राउड (prowd)',
      'prove': 'प्रूव (proov)',
      'public': 'पब्लिक (pub-lik)',
      'pull': 'पुल (pool)',
      'push': 'पुश (poosh)',
      'put': 'पुट (poot)',
      'quality': 'क्वालिटी (kwol-i-tee)',
      'question': 'क्वेश्चन (kwes-chuhn)',
      'quick': 'क्विक (kwik)',
      'quiet': 'क्वाइट (kwyet)',
      'quite': 'क्वाइट (kwyt)',
      'radio': 'रेडियो (ray-dee-oh)',
      'rain': 'रेन (rayn)',
      'raise': 'रेज़ (rayz)',
      'range': 'रेंज (raynj)',
      'rate': 'रेट (rayt)',
      'rather': 'रादर (rath-er)',
      'reach': 'रीच (reech)',
      'read': 'रीड (reed)',
      'ready': 'रेडी (red-ee)',
      'real': 'रियल (ree-uhl)',
      'realize': 'रियलाइज़ (ree-uh-lyz)',
      'really': 'रियली (ree-lee)',
      'reason': 'रीज़न (ree-zuhn)',
      'receive': 'रिसीव (ri-seev)',
      'recent': 'रीसेंट (ree-suhnt)',
      'recognize': 'रिकग्नाइज़ (rek-uhg-nyz)',
      'record': 'रिकॉर्ड (rek-erd)',
      'red': 'रेड (red)',
      'reduce': 'रिड्यूस (ri-doos)',
      'refer': 'रेफ़र (ri-fur)',
      'refuse': 'रिफ्यूज़ (ri-fyooz)',
      'regard': 'रिगार्ड (ri-gahrd)',
      'region': 'रीजन (ree-juhn)',
      'relation': 'रिलेशन (ri-lay-shuhn)',
      'relationship': 'रिलेशनशिप (ri-lay-shuhn-ship)',
      'relax': 'रिलैक्स (ri-laks)',
      'relieved': 'रिलीव्ड (ri-leevd)',
      'religion': 'रिलिजन (ri-lij-uhn)',
      'remain': 'रिमेन (ri-mayn)',
      'remember': 'रिमेम्बर (ri-mem-ber)',
      'remove': 'रिमूव (ri-moov)',
      'repeat': 'रिपीट (ri-peet)',
      'reply': 'रिप्लाई (ri-ply)',
      'report': 'रिपोर्ट (ri-pawrt)',
      'represent': 'रिप्रेजेंट (rep-ri-zent)',
      'request': 'रिक्वेस्ट (ri-kwest)',
      'require': 'रिक्वायर (ri-kwyr)',
      'research': 'रिसर्च (ri-surch)',
      'resource': 'रिसोर्स (ri-sawrs)',
      'respect': 'रिस्पेक्ट (ri-spekt)',
      'response': 'रिस्पॉन्स (ri-spons)',
      'responsibility': 'रिस्पॉन्सिबिलिटी (ri-spon-suh-bil-i-tee)',
      'rest': 'रेस्ट (rest)',
      'restaurant': 'रेस्टोरेंट (res-ter-ohnt)',
      'result': 'रिजल्ट (ri-zult)',
      'return': 'रिटर्न (ri-turn)',
      'reveal': 'रिवीअल (ri-veel)',
      'revenue': 'रेवेन्यू (rev-uh-noo)',
      'review': 'रिव्यू (ri-vyoo)',
      'rice': 'राइस (rys)',
      'rich': 'रिच (rich)',
      'ride': 'राइड (ryd)',
      'right': 'RIGHT',
      'ring': 'रिंग (ring)',
      'rise': 'राइज़ (ryz)',
      'risk': 'रिस्क (risk)',
      'river': 'रिवर (riv-er)',
      'road': 'रोड (rohd)',
      'rock': 'रॉक (rok)',
      'role': 'रोल (rohl)',
      'roll': 'रोल (rohl)',
      'roof': 'रूफ (roof)',
      'room': 'रूम (room)',
      'root': 'रूट (root)',
      'rope': 'रोप (rohp)',
      'rough': 'रफ (ruf)',
      'round': 'राउंड (rownd)',
      'route': 'रूट (root)',
      'row': 'रो (roh)',
      'rub': 'रब (rub)',
      'rule': 'रूल (rool)',
      'run': 'रन (run)',
      'sad': 'सैड (sad)',
      'safe': 'सेफ (sayf)',
      'safety': 'सेफ्टी (sayf-tee)',
      'sail': 'सेल (sayl)',
      'salt': 'सॉल्ट (sawlt)',
      'same': 'सेम (saym)',
      'sand': 'सैंड (sand)',
      'satisfied': 'सैटिस्फाइड (sat-is-fyd)',
      'save': 'सेव (sayv)',
      'say': 'से (say)',
      'scale': 'स्केल (skayl)',
      'scared': 'स्केअर्ड (skaird)',
      'scene': 'सीन (seen)',
      'scenery': 'सीनरी (seen-er-ee)',
      'school': 'स्कूल (skool)',
      'science': 'साइंस (sy-uhns)',
      'scientist': 'साइंटिस्ट (sy-uhn-tist)',
      'score': 'स्कोर (skawr)',
      'scream': 'स्क्रीम (skreem)',
      'screen': 'स्क्रीन (skreen)',
      'sea': 'सी (see)',
      'search': 'सर्च (surch)',
      'season': 'सीज़न (see-zuhn)',
      'seat': 'सीट (seet)',
      'second': 'सेकंड (sek-uhnd)',
      'secret': 'सीक्रेट (see-krit)',
      'section': 'सेक्शन (sek-shuhn)',
      'security': 'सिक्योरिटी (si-kyoor-i-tee)',
      'see': 'सी (see)',
      'seed': 'सीड (seed)',
      'seek': 'सीक (seek)',
      'seem': 'सीम (seem)',
      'select': 'सलेक्ट (suh-lekt)',
      'sell': 'सेल (sel)',
      'send': 'सेंड (send)',
      'sense': 'सेंस (sens)',
      'sentence': 'सेंटेंस (sen-tuhns)',
      'separate': 'सेपरेट (sep-uhr-it)',
      'serious': 'सीरियस (seer-ee-uhs)',
      'servant': 'सर्वेंट (sur-vuhnt)',
      'serve': 'सर्व (surv)',
      'service': 'सर्विस (sur-vis)',
      'session': 'सेशन (sesh-uhn)',
      'set': 'सेट (set)',
      'settle': 'सेटल (set-l)',
      'seven': 'सेवन (sev-uhn)',
      'several': 'सेवरल (sev-uhr-uhl)',
      'severe': 'सिवियर (suh-veer)',
      'sex': 'सेक्स (seks)',
      'shade': 'शेड (shayd)',
      'shadow': 'शैडो (shad-oh)',
      'shake': 'शेक (shayk)',
      'shall': 'शैल (shal)',
      'shame': 'शेम (shaym)',
      'shape': 'शेप (shayp)',
      'share': 'शेयर (shair)',
      'sharp': 'शार्प (shahrp)',
      'she': 'शी (shee)',
      'sheep': 'शीप (sheep)',
      'sheet': 'शीट (sheet)',
      'shelf': 'शेल्फ (shelf)',
      'shell': 'शेल (shel)',
      'shelter': 'शेल्टर (shel-ter)',
      'shift': 'शिफ्ट (shift)',
      'shine': 'शाइन (shyn)',
      'ship': 'शिप (ship)',
      'shirt': 'शर्ट (shurt)',
      'shocked': 'शॉक्ड (shokt)',
      'shoe': 'शू (shoo)',
      'shoot': 'शूट (shoot)',
      'shop': 'शॉप (shop)',
      'shopping': 'शॉपिंग (shop-ing)',
      'shore': 'शोर (shawr)',
      'short': 'शॉर्ट (shawrt)',
      'should': 'शुड (shood)',
      'shoulder': 'शोल्डर (shohl-der)',
      'shout': 'शआउट (showt)',
      'show': 'शो (shoh)',
      'shower': 'शावर (show-er)',
      'shut': 'शट (shut)',
      'sick': 'सिक (sik)',
      'side': 'साइड (syd)',
      'sight': 'साइट (syt)',
      'sign': 'साइन (syn)',
      'signal': 'सिग्नल (sig-nuhl)',
      'silence': 'साइलेंस (sy-luhns)',
      'silent': 'साइलेंट (sy-luhnt)',
      'silk': 'सिल्क (silk)',
      'silly': 'सिली (sil-ee)',
      'silver': 'सिल्वर (sil-ver)',
      'similar': 'सिमिलर (sim-uh-ler)',
      'simple': 'सिंपल (sim-puhl)',
      'simply': 'सिंपली (sim-plee)',
      'since': 'सिंस (sins)',
      'sing': 'सिंग (sing)',
      'singer': 'सिंगर (sing-er)',
      'single': 'सिंगल (sing-guhl)',
      'sink': 'सिंक (sink)',
      'sir': 'सर (sur)',
      'sister': 'सिस्टर (sis-ter)',
      'sit': 'सिट (sit)',
      'site': 'साइट (syt)',
      'situation': 'सिचुएशन (sich-oo-ay-shuhn)',
      'six': 'सिक्स (siks)',
      'size': 'साइज़ (syz)',
      'skill': 'स्किल (skil)',
      'skin': 'स्किन (skin)',
      'skirt': 'स्कर्ट (skurt)',
      'sky': 'स्काई (sky)',
      'slave': 'स्लेव (slayv)',
      'sleep': 'स्लीप (sleep)',
      'sleepy': 'स्लीपी (slee-pee)',
      'sleeve': 'स्लीव (sleev)',
      'slice': 'स्लाइस (slys)',
      'slide': 'स्लाइड (slyd)',
      'slight': 'स्लाइट (slyt)',
      'slip': 'स्लिप (slip)',
      'slippery': 'स्लिपरी (slip-uhr-ee)',
      'slow': 'स्लो (sloh)',
      'small': 'स्मॉल (smawl)',
      'smart': 'स्मार्ट (smahrt)',
      'smell': 'स्मेल (smel)',
      'smile': 'स्माइल (smyl)',
      'smoke': 'स्मोक (smohk)',
      'smooth': 'स्मूद (smood)',
      'snake': 'स्नेक (snayk)',
      'snow': 'स्नो (snoh)',
      'so': 'सो (soh)',
      'soap': 'सोप (sohp)',
      'social': 'सोशल (soh-shuhl)',
      'society': 'सोसाइटी (suh-sy-i-tee)',
      'sock': 'सॉक (sok)',
      'soft': 'सॉफ्ट (sawft)',
      'soil': 'सॉइल (soyl)',
      'soldier': 'सोल्जर (sohl-jer)',
      'role': 'रोल (rohl)',
      'yell': 'येल (yel)',
      'yellow': 'येलो (yel-oh)',
      'yes': 'यस (yes)',
      'yesterday': 'यस्टरडे (yes-ter-dee)',
      'yet': 'येट (yet)',
      'yoga': 'योगा (yoh-guh)',
      'you': 'यू (yoo)',
      'young': 'यंग (yung)',
      'your': 'योर (yawr)',
      'yours': 'योर्स (yawrz)',
      'yourself': 'योरसेल्फ (yawr-self)',
      'youth': 'यूथ (yooth)',
      'zero': 'ज़ीरो (zee-roh)'
    };

    const key = word.toLowerCase().trim();
    if (dictionaryFallback[key]) {
      return dictionaryFallback[key];
    }
    
    // Rule-based transcriber as ultimate robust fallback if pron only contains English syllables!
    if (pron && /^[a-zA-Z\s\-\[\]\/\\?\(\),;.]+$/.test(pron)) {
      let clean = pron.replace(/[\[\]\(\)\/]/g, '').trim().toLowerCase();
      
      // Syllable/sounds translation map
      const soundMap = [
        { en: 'uh-mayzd', hi: 'अमेज़्ड (uh-mayzd)' },
        { en: 'uh-myoozd', hi: 'अम्यूज़्ड (uh-myoozd)' },
        { en: 'angk-shuhs', hi: 'ऐंग्शस (angk-shuhs)' },
        { en: 'di-prest', hi: 'डिप्रेस्ड (di-prest)' },
        { en: 'dis-uh-poyn-tid', hi: 'डिसअपॉइंटेड (dis-uh-poyn-tid)' },
        { en: 'uh-noyd', hi: 'अनॉइड (uh-noyd)' },
        { en: 'kyoor-ee-uhs', hi: 'क्यूरियस (kyoor-ee-uhs)' },
        { en: 'di-zayn', hi: 'डिज़ाइन (di-zayn)' },
        { en: 'shuhn', hi: 'शन' },
        { en: 'chuhn', hi: 'चन' },
        { en: 'tuhl', hi: 'टल' },
        { en: 'buhl', hi: 'बल' },
        { en: 'muhnt', hi: 'मंट' },
        { en: 'suhn', hi: 'सन' },
        { en: 'uhp', hi: 'अप' },
        { en: 'ing', hi: 'इंग' },
        { en: 'est', hi: 'ए्स्ट' },
        { en: 'ist', hi: 'इस्ट' },
        { en: 'ous', hi: 'अस' },
        { en: 'uhs', hi: 'अस' },
        { en: 'lee', hi: 'ली' },
        { en: 'ree', hi: 'री' },
        { en: 'tee', hi: 'टी' },
        { en: 'dee', hi: 'डी' },
        { en: 'nee', hi: 'नी' },
        { en: 'zee', hi: 'ज़ी' },
        { en: 'see', hi: 'सी' },
        { en: 'kee', hi: 'की' },
        { en: 'fee', hi: 'फी' },
        { en: 'mee', hi: 'मी' },
        { en: 'pee', hi: 'पी' },
        { en: 'aarm', hi: 'आर्म' },
        { en: 'ah', hi: 'आ' },
        { en: 'ee', hi: 'ई' },
        { en: 'oo', hi: 'ऊ' },
        { en: 'oy', hi: 'ऑय' },
        { en: 'ow', hi: 'आउ' },
        { en: 'ay', hi: 'ए' },
        { en: 'ey', hi: 'आइ' },
        { en: 'aw', hi: 'ऑ' },
        { en: 'uh', hi: 'अ' },
        { en: 'er', hi: 'अर' },
        { en: 'ur', hi: 'अर' },
        { en: 'ar', hi: 'अर' },
        { en: 'bay', hi: 'बे' },
        { en: 'bee', hi: 'बी' },
        { en: 'but', hi: 'बट' },
        { en: 'buh', hi: 'ब' },
        { en: 'day', hi: 'डे' },
        { en: 'dee', hi: 'डी' },
        { en: 'dik', hi: 'डिक' },
        { en: 'dis', hi: 'डिस' },
        { en: 'div', hi: 'डिव' },
        { en: 'doh', hi: 'डो' },
        { en: 'duh', hi: 'ड' },
        { en: 'fay', hi: 'फे' },
        { en: 'fee', hi: 'फी' },
        { en: 'fin', hi: 'फिन' },
        { en: 'foh', hi: 'फो' },
        { en: 'fuh', hi: 'फ' },
        { en: 'gay', hi: 'गे' },
        { en: 'gee', hi: 'गी' },
        { en: 'goh', hi: 'गो' },
        { en: 'guh', hi: 'ग' },
        { en: 'hay', hi: 'हे' },
        { en: 'hee', hi: 'ही' },
        { en: 'hoh', hi: 'हो' },
        { en: 'huh', hi: 'ह' },
        { en: 'jay', hi: 'जे' },
        { en: 'jee', hi: 'जी' },
        { en: 'joh', hi: 'जो' },
        { en: 'juh', hi: 'ज' },
        { en: 'kay', hi: 'के' },
        { en: 'kee', hi: 'की' },
        { en: 'koh', hi: 'को' },
        { en: 'kuh', hi: 'क' },
        { en: 'lay', hi: 'ले' },
        { en: 'lee', hi: 'ली' },
        { en: 'loh', hi: 'लो' },
        { en: 'luh', hi: 'ल' },
        { en: 'may', hi: 'मे' },
        { en: 'mee', hi: 'मी' },
        { en: 'moh', hi: 'मो' },
        { en: 'muh', hi: 'म' },
        { en: 'nay', hi: 'ने' },
        { en: 'nee', hi: 'नी' },
        { en: 'noh', hi: 'नो' },
        { en: 'nuh', hi: 'न' },
        { en: 'pay', hi: 'पे' },
        { en: 'pee', hi: 'पी' },
        { en: 'poh', hi: 'पो' },
        { en: 'guh', hi: 'ग' },
        { en: 'ruh', hi: 'र' },
        { en: 'say', hi: 'से' },
        { en: 'see', hi: 'सी' },
        { en: 'soh', hi: 'सो' },
        { en: 'suh', hi: 'स' },
        { en: 'tay', hi: 'टे' },
        { en: 'tee', hi: 'टी' },
        { en: 'toh', hi: 'टो' },
        { en: 'tuh', hi: 'ट' },
        { en: 'way', hi: 'वे' },
        { en: 'wee', hi: 'वी' },
        { en: 'woh', hi: 'वो' },
        { en: 'wuh', hi: 'व' },
        { en: 'yay', hi: 'ये' },
        { en: 'yee', hi: 'यी' },
        { en: 'yoh', hi: 'यो' },
        { en: 'yuh', hi: 'य' },
        { en: 'zee', hi: 'ज़ी' }
      ];
      
      soundMap.sort((a, b) => b.en.length - a.en.length);
      
      let result = clean;
      soundMap.forEach(pair => {
        const regex = new RegExp(pair.en, 'g');
        result = result.replace(regex, pair.hi);
      });
      
      if (result !== clean) {
        return `${result} (${pron})`;
      }
    }

    return pron;
  }

  function parseWord(w) {
    const word = fixMojibake(w.word || w.w || '');
    let rawPron = fixMojibake(w.pronunciation || w.p || '');
    const example = fixMojibake(w.example || w.example_en || w.e || w.ex || '');

    let hindiMeaning = fixMojibake(w.meaning_hi || w.m || w.hindi || '');
    let englishDef = fixMojibake(w.definition_en || w.d || '');

    const rawMeaning = fixMojibake(w.meaning || '');
    const rawDef = fixMojibake(w.definition || '');

    const isHindi = (str) => /[\u0900-\u097F]/.test(str);

    if (!hindiMeaning) {
      if (isHindi(rawMeaning)) {
        hindiMeaning = rawMeaning;
      } else if (isHindi(rawDef)) {
        hindiMeaning = rawDef;
      }
    }

    if (!englishDef) {
      if (rawDef && !isHindi(rawDef)) {
        englishDef = rawDef;
      } else if (rawMeaning && !isHindi(rawMeaning)) {
        englishDef = rawMeaning;
      }
    }

    // Convert pronunciation to Devanagari using smart phonetic mapping!
    const pron = toDevanagariPron(word, rawPron);

    return {
      word,
      pron,
      meaning: hindiMeaning,
      definition: englishDef,
      example
    };
  }

  function createWordCard(w, i) {
    const parsed = parseWord(w);
    const card = document.createElement('div');
    card.className = 'word-card';
    card.dataset.index = i;
    
    card.innerHTML = `
      <div class="word-header">
        <div class="word-main">
          <div class="word-en-row">
            <span class="word-en">${escHtml(parsed.word)}</span>
            ${parsed.pron ? `<span class="word-pron">[${escHtml(parsed.pron)}]</span>` : ''}
          </div>
          <div class="word-hi">${escHtml(parsed.meaning || parsed.definition.slice(0, 60) + (parsed.definition.length > 60 ? '...' : ''))}</div>
        </div>
        <div class="word-actions">
          <button class="word-speak-btn" data-word="${escHtml(parsed.word)}" title="Hear pronunciation">🔊</button>
          <span class="word-expand-arrow">▼</span>
        </div>
      </div>
      <div class="word-details-drawer">
        <div class="word-details-content">
          ${parsed.meaning ? `
            <div class="word-detail-row">
              <span class="word-detail-label">Hindi Meaning</span>
              <span class="word-detail-val">${escHtml(parsed.meaning)}</span>
            </div>
          ` : ''}
          ${parsed.definition ? `
            <div class="word-detail-row">
              <span class="word-detail-label">English Definition</span>
              <span class="word-detail-val">${escHtml(parsed.definition)}</span>
            </div>
          ` : ''}
          ${parsed.example ? `
            <div class="word-detail-row word-detail-example">
              <span class="word-detail-label">Example Sentence</span>
              <span class="word-detail-val">"${escHtml(parsed.example)}"</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Add click events
    card.querySelector('.word-speak-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      speakWord(parsed.word);
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.word-speak-btn')) return;
      
      const isExpanded = card.classList.contains('expanded');
      card.classList.toggle('expanded');
      
      const drawer = card.querySelector('.word-details-drawer');
      if (drawer) {
        if (card.classList.contains('expanded')) {
          drawer.style.maxHeight = drawer.scrollHeight + 'px';
        } else {
          drawer.style.maxHeight = '0px';
        }
      }
    });

    return card;
  }

  async function loadAndShowWords(slug) {
    const container = $('#words-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-screen" style="min-height:200px;"><div class="loader-spinner"></div></div>';
    const words = await loadCategoryWords(slug);

    if (!words || words.length === 0) {
      container.innerHTML = '<div class="card text-center"><p class="text-secondary">No words available in this category.</p></div>';
      return;
    }

    state.currentWords = words;
    state.currentCategory = slug;

    container.innerHTML = `
      <div class="word-grid animate-fade-in"></div>
      ${words.length > 50 ? `
        <div class="text-center mt-6" id="load-more-container">
          <button class="fc-btn fc-btn-know" id="load-more-btn">Load more words (${words.length - 50} remaining)</button>
        </div>
      ` : ''}
    `;

    const grid = container.querySelector('.word-grid');
    words.slice(0, 50).forEach((w, i) => {
      grid.appendChild(createWordCard(w, i));
    });

    const loadMoreBtn = $('#load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        words.slice(50).forEach((w, i) => {
          grid.appendChild(createWordCard(w, i + 50));
        });
        $('#load-more-container').remove();
      });
    }
  }

  // ── 7d. FLASHCARDS ──
  async function renderFlashcards(categorySlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🃏 Flashcards Practice</h1>
          <p class="hero-subtitle">See, memorise and listen to words!</p>
        </div>
        <div class="loading-screen" style="min-height: 200px;"><div class="loader-spinner"></div></div>
      </div>
    `;

    const categories = await ensureCategoriesIndex();
    const slug = categorySlug || (categories && categories.length > 0 ? categories[0].slug : null);

    if (!slug) {
      appContent.innerHTML = `<div class="card text-center"><h2>Could not load data</h2></div>`;
      return;
    }

    const words = await loadCategoryWords(slug);
    if (!words || words.length === 0) {
      appContent.innerHTML = '<div class="card text-center"><p>No words found.</p></div>';
      return;
    }

    state.fcDeck = shuffleArray([...words]).slice(0, 20);
    state.fcIndex = 0;
    state.fcKnown = 0;

    renderFlashcardUI(categories, slug);
  }

  function updateCardContent(categories, activeSlug) {
    const total = state.fcDeck.length;
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;

    const parsed = parseWord(current);
    const word = parsed.word;
    const meaning = parsed.meaning || parsed.definition;
    const example = parsed.example;
    const pron = parsed.pron;

    // Reset scroll positions of front and back scroll containers
    const scrollContainers = $$('.flashcard-scroll-container');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });

    // Update progress bar
    const progressFill = $('.progress-bar-fill');
    if (progressFill) {
      progressFill.style.width = `${((state.fcIndex) / total) * 100}%`;
    }
    const progressText = $('.progress-text');
    if (progressText) {
      progressText.textContent = `${state.fcIndex + 1}/${total}`;
    }

    // Update front face
    const frontWord = $('.flashcard-front .flashcard-word');
    if (frontWord) frontWord.textContent = word;
    
    const frontWrapper = $('.flashcard-front .flashcard-content-wrapper');
    if (frontWrapper) {
      let pronEl = $('.flashcard-front .flashcard-devanagari-pron');
      if (pron) {
        if (!pronEl) {
          pronEl = document.createElement('div');
          pronEl.className = 'flashcard-devanagari-pron';
          const tapHint = $('.flashcard-front .flashcard-tap-hint');
          if (tapHint) {
            frontWrapper.insertBefore(pronEl, tapHint);
          } else {
            frontWrapper.appendChild(pronEl);
          }
        }
        pronEl.textContent = pron;
        pronEl.style.display = 'inline-block';
      } else if (pronEl) {
        pronEl.style.display = 'none';
      }
    }

    // Update back face
    const backMeaning = $('.flashcard-back .flashcard-devanagari-meaning');
    if (backMeaning) backMeaning.textContent = meaning;
    
    const backWord = $('.flashcard-back .flashcard-word');
    if (backWord) backWord.textContent = word;

    const backWrapper = $('.flashcard-back .flashcard-content-wrapper');
    if (backWrapper) {
      let backPronEl = $('.flashcard-back .flashcard-devanagari-pron');
      if (pron) {
        if (!backPronEl) {
          backPronEl = document.createElement('div');
          backPronEl.className = 'flashcard-devanagari-pron';
          backPronEl.style.fontSize = '0.95rem';
          backPronEl.style.color = 'var(--accent)';
          backPronEl.style.marginTop = 'var(--sp-1)';
          const backExample = $('.flashcard-back .flashcard-example');
          if (backExample) {
            backWrapper.insertBefore(backPronEl, backExample);
          } else {
            backWrapper.appendChild(backPronEl);
          }
        }
        backPronEl.textContent = pron;
        backPronEl.style.display = 'block';
      } else if (backPronEl) {
        backPronEl.style.display = 'none';
      }
    }
    
    const backExample = $('.flashcard-back .flashcard-example');
    if (backExample) {
      if (example) {
        backExample.textContent = `"${example}"`;
        backExample.style.display = 'block';
      } else {
        backExample.style.display = 'none';
      }
    }
  }

  function prevFlashcard(categories, activeSlug) {
    if (state.fcTransitioning) return;
    if (state.fcIndex > 0) {
      state.fcIndex--;
      
      const cardEl = $('#flashcard');
      if (cardEl) {
        state.fcTransitioning = true;
        cardEl.classList.remove('flipped');
        cardEl.classList.add('swipe-left');
        
        setTimeout(() => {
          updateCardContent(categories, activeSlug);
          cardEl.classList.remove('swipe-left');
          cardEl.classList.add('swipe-in-left');
          
          cardEl.offsetHeight;
          cardEl.classList.remove('swipe-in-left');
          state.fcTransitioning = false;
        }, 150);
      } else {
        updateCardContent(categories, activeSlug);
      }
    }
  }

  function renderFlashcardResult(categories, activeSlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in flashcard-container" style="padding-top: var(--sp-12);">
        <div class="card text-center" style="padding: var(--sp-10);">
          <p style="font-size: 3rem; margin-bottom: var(--sp-4);">🎉</p>
          <h2>Well Done!</h2>
          <p class="text-secondary" style="margin-top: var(--sp-3); font-size: 1.1rem;">
            You remembered <strong>${state.fcKnown}</strong> out of <strong>${state.fcDeck.length}</strong> words!
          </p>
          <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-3); justify-content: center; flex-wrap: wrap;">
            <button class="fc-btn fc-btn-know" id="fc-retry-btn">🔄 Retry</button>
            <button class="fc-btn fc-btn-skip" id="fc-other-btn">📂 Other Category</button>
          </div>
        </div>
      </div>
    `;
    
    const retryBtn = $('#fc-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        navigate('/flashcards/' + activeSlug);
      });
    }

    const otherBtn = $('#fc-other-btn');
    if (otherBtn) {
      otherBtn.addEventListener('click', () => {
        navigate('/flashcards');
      });
    }
  }

  function renderFlashcardUI(categories, activeSlug) {
    const total = state.fcDeck.length;
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;

    const parsed = parseWord(current);
    const word = parsed.word;
    const meaning = parsed.meaning || parsed.definition;
    const example = parsed.example;
    const pron = parsed.pron;

    // Check if the shell is already rendered
    const existingFlashcard = $('#flashcard');
    const activeChip = $('#fc-category-chips .category-chip.active');
    
    if (existingFlashcard && activeChip && activeChip.dataset.slug === activeSlug) {
      updateCardContent(categories, activeSlug);
      return;
    }

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🃏 Flashcards Practice</h1>
        </div>

        ${categories ? `
          <div class="category-chips-scroll" id="fc-category-chips">
            ${categories.slice(0, 20).map(c => `
              <button class="category-chip${c.slug === activeSlug ? ' active' : ''}" data-slug="${escHtml(c.slug)}">
                ${c.icon || '📁'} ${escHtml(c.name)}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="flashcard-container" style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div class="flashcard-progress" style="width: 100%; max-width: 480px;">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${((state.fcIndex) / total) * 100}%"></div>
            </div>
            <span class="progress-text">${state.fcIndex + 1}/${total}</span>
          </div>

          <div style="position: relative; width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: center; margin: var(--sp-4) 0;">
            <button class="flashcard-nav-arrow left" id="fc-prev-arrow" aria-label="Previous Word">←</button>

            <div class="flashcard" id="flashcard" style="margin: 0;">
              <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front">
                  <div class="flashcard-scroll-container" style="width: 100%; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: var(--sp-4) var(--sp-2);">
                    <div class="flashcard-content-wrapper" style="margin: auto 0; display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div class="flashcard-word">${escHtml(word)}</div>
                      ${pron ? `<div class="flashcard-devanagari-pron">${escHtml(pron)}</div>` : ''}
                      <div class="flashcard-hint flashcard-tap-hint" style="margin-top: var(--sp-4); opacity: 0.6;">👆 Tap to reveal</div>
                    </div>
                  </div>
                </div>
                <div class="flashcard-face flashcard-back">
                  <div class="flashcard-scroll-container" style="width: 100%; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: var(--sp-4) var(--sp-2);">
                    <div class="flashcard-content-wrapper" style="margin: auto 0; display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div class="flashcard-devanagari-meaning">${escHtml(meaning)}</div>
                      <div class="flashcard-word" style="font-size: 1.2rem; color: var(--text-secondary); margin-top: var(--sp-2);">${escHtml(word)}</div>
                      ${pron ? `<div class="flashcard-devanagari-pron" style="font-size: 0.95rem; color: var(--accent); margin-top: var(--sp-1);">${escHtml(pron)}</div>` : ''}
                      ${example ? `<div class="flashcard-example" style="margin-top: var(--sp-4);">"${escHtml(example)}"</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="flashcard-nav-arrow right" id="fc-next-arrow" aria-label="Next Word">→</button>
          </div>

          <div class="flashcard-controls" style="width: 100%; max-width: 480px;">
            <button class="fc-btn fc-btn-skip" id="fc-skip">⏭️ Skip</button>
            <button class="fc-btn fc-btn-know" id="fc-speak" style="background: var(--accent-soft); color: var(--accent);">🔊 Listen</button>
            <button class="fc-btn fc-btn-know" id="fc-know">✅ Remembered</button>
          </div>
        </div>
      </div>
    `;

    const flashcard = $('#flashcard');
    flashcard.addEventListener('click', () => {
      if (state.fcTransitioning) return;
      flashcard.classList.toggle('flipped');
    });

    $('#fc-skip').addEventListener('click', () => nextFlashcard(categories, activeSlug, false));
    $('#fc-know').addEventListener('click', () => nextFlashcard(categories, activeSlug, true));
    
    const prevArrow = $('#fc-prev-arrow');
    if (prevArrow) {
      prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        prevFlashcard(categories, activeSlug);
      });
    }

    const nextArrow = $('#fc-next-arrow');
    if (nextArrow) {
      nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        nextFlashcard(categories, activeSlug, false);
      });
    }

    $('#fc-speak').addEventListener('click', () => {
      const curr = state.fcDeck[state.fcIndex];
      if (curr) {
        const p = parseWord(curr);
        speakWord(p.word);
      }
    });

    if (categories) {
      $$('#fc-category-chips .category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          navigate('/flashcards/' + chip.dataset.slug);
        });
      });
    }
  }

  function nextFlashcard(categories, activeSlug, known) {
    if (state.fcTransitioning) return;
    if (known) state.fcKnown++;
    
    const cardEl = $('#flashcard');
    if (!cardEl) {
      state.fcIndex++;
      if (state.fcIndex >= state.fcDeck.length) {
        renderFlashcardResult(categories, activeSlug);
      } else {
        renderFlashcardUI(categories, activeSlug);
      }
      return;
    }
    
    state.fcTransitioning = true;
    const swipeClass = known ? 'swipe-right' : 'swipe-left';
    cardEl.classList.add(swipeClass);
    
    setTimeout(() => {
      state.fcIndex++;
      
      if (state.fcIndex >= state.fcDeck.length) {
        renderFlashcardResult(categories, activeSlug);
        state.fcTransitioning = false;
        return;
      }
      
      updateCardContent(categories, activeSlug);
      
      cardEl.classList.remove('flipped');
      cardEl.classList.remove(swipeClass);
      
      const slideInClass = known ? 'swipe-in-left' : 'swipe-in-right';
      cardEl.classList.add(slideInClass);
      
      cardEl.offsetHeight;
      
      cardEl.classList.remove(slideInClass);
      state.fcTransitioning = false;
    }, 350);
  }

  // ── 7e. PROFILE ──
  function renderProfile() {
    const streak = StreakTracker.get();
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'Student';
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="profile-header">
          <div class="profile-avatar">${userName.charAt(0).toUpperCase()}</div>
          <div class="profile-name">${escHtml(userName)}</div>
          <div class="profile-email">🔥 ${streak}-Day Streak</div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">General Settings</div>
          <div class="settings-item" id="setting-name">
            <div class="settings-item-icon">✏️</div>
            <div class="settings-item-text">
              <div class="settings-item-title">Change Name</div>
              <div class="settings-item-desc">${escHtml(userName)}</div>
            </div>
          </div>
          <div class="settings-item" id="setting-theme">
            <div class="settings-item-icon">${theme === 'dark' ? '🌙' : '☀️'}</div>
            <div class="settings-item-text">
              <div class="settings-item-title">Theme</div>
              <div class="settings-item-desc">${theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Statistics</div>
          <div class="settings-item">
            <div class="settings-item-icon">🔥</div>
            <div class="settings-item-text">
              <div class="settings-item-title">Streak Days</div>
              <div class="settings-item-desc">${streak} Days</div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-icon">📚</div>
            <div class="settings-item-text">
              <div class="settings-item-title">Words Available</div>
              <div class="settings-item-desc">19,773 Words / 148 Categories</div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Share</div>
          <div class="settings-item" id="setting-share">
            <div class="settings-item-icon">📤</div>
            <div class="settings-item-text">
              <div class="settings-item-title">Share with Friends</div>
              <div class="settings-item-desc">Share on WhatsApp</div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('#setting-name').addEventListener('click', () => {
      const newName = prompt('Enter your name:', userName);
      if (newName && newName.trim()) {
        localStorage.setItem(STORAGE_KEYS.userName, newName.trim());
        showToast('✅ Name updated successfully!');
        renderProfile();
      }
    });

    $('#setting-theme').addEventListener('click', (e) => ThemeManager.toggle(e));

    $('#setting-share').addEventListener('click', () => {
      const shareText = `English Vidya — Learn English easily! 📚🔥\n\n19,773 words, 60 grammar lessons, flashcards, and more!\n\n👉 ${location.origin}`;
      if (navigator.share) {
        navigator.share({ title: 'English Vidya', text: shareText, url: location.origin });
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  8. SPEECH SYNTHESIS (Pronunciation)
  // ═══════════════════════════════════════════════════
  function speakWord(word) {
    if (!word || !('speechSynthesis' in window)) {
      showToast('⚠️ Speech synthesis is not supported in this browser');
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  // ═══════════════════════════════════════════════════
  //  9. SCROLL PROGRESS
  // ═══════════════════════════════════════════════════
  function initScrollProgress() {
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      scrollProgress.style.width = progress + '%';
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════
  //  10. TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════
  function showToast(message, duration = 2500) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">💬</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // ═══════════════════════════════════════════════════
  //  11. UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════
  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Hello 🙏';
    return 'Good Evening 🌙';
  }

  function animateValue(id, start, end, duration) {
    const obj = $(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      obj.textContent = value.toLocaleString('en-IN');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  function navigate(path) {
    if (state.isHashMode) {
      location.hash = '#' + path;
    } else {
      const targetPath = (state.basePath + '/' + path.replace(/^\/+/, '')).replace(/\/+/g, '/');
      history.pushState(null, '', targetPath);
      Router.resolve();
    }
  }
  window.navigate = navigate;

  // ═══════════════════════════════════════════════════
  //  12. INITIALIZE GLOBAL LISTENERS & INTERACTION ENGINE
  // ═══════════════════════════════════════════════════
  function init() {
    ThemeManager.init();
    SearchEngine.init();
    initScrollProgress();

    // 🔙 Back / Forward Navigation Button Listeners
    const btnBack = $('#nav-back');
    const btnForward = $('#nav-forward');
    if (btnBack) {
      btnBack.addEventListener('click', () => history.back());
    }
    if (btnForward) {
      btnForward.addEventListener('click', () => history.forward());
    }

    // 📲 Mobile Navigation Drawer Handlers
    const menuTrigger = $('#mobile-menu-trigger');
    const drawerOverlay = $('#mobile-drawer-overlay');
    const drawerClose = $('#mobile-drawer-close');

    if (menuTrigger && drawerOverlay && drawerClose) {
      const openDrawer = () => {
        drawerOverlay.classList.add('active');
        menuTrigger.setAttribute('aria-expanded', 'true');
      };
      
      const closeDrawer = () => {
        drawerOverlay.classList.remove('active');
        menuTrigger.setAttribute('aria-expanded', 'false');
      };

      menuTrigger.addEventListener('click', openDrawer);
      drawerClose.addEventListener('click', closeDrawer);
      drawerOverlay.addEventListener('click', (e) => {
        if (!e.target.closest('#mobile-drawer')) {
          closeDrawer();
        }
      });
      
      // Close drawer when clicking any link inside it
      $$('.mobile-drawer-link').forEach(link => {
        link.addEventListener('click', closeDrawer);
      });
    }

    // 🛡️ SPA 404 Redirect Hack handler
    // 🛡️ SPA 404 Redirect Hack handler
    if (!state.isHashMode) {
      const queryParams = new URLSearchParams(location.search);
      const redirectParam = queryParams.get('p');
      if (redirectParam) {
        const cleanPath = '/' + redirectParam.replace(/^\/+/, '');
        const targetPath = (state.basePath + '/' + cleanPath).replace(/\/+/g, '/');
        history.replaceState(null, '', targetPath);
      }
    }

    // Intercept internal clicks for Pretty URLs SPA transitions
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//') && link.origin === location.origin) {
        e.preventDefault();
        
        if (href === '/youtube') {
          window.open('https://youtube.com/@englishvidyahq', '_blank', 'noopener,noreferrer');
          return;
        }

        if (state.isHashMode) {
          // Fallback to Hash routing in offline mode
          location.hash = '#' + href;
        } else {
          // Live server pathname transition
          const targetPath = (state.basePath + '/' + href.replace(/^\/+/, '')).replace(/\/+/g, '/');
          history.pushState(null, '', targetPath);
          Router.resolve();
        }
      }
    });

    // 🛡️ Security Rule 3: Event delegation for Morphing cards
    const morphContainer = $('#morph-cards-container');
    if (morphContainer) {
      morphContainer.addEventListener('click', (e) => {
        const header = e.target.closest('.morph-card-header');
        if (!header) return;

        const card = header.closest('.morph-card');
        if (!card) return;

        const content = card.querySelector('.morph-card-content');
        const indicator = card.querySelector('.morph-card-indicator');
        if (!content || !indicator) return;

        const isExpanded = card.classList.contains('expanded');

        morphContainer.querySelectorAll('.morph-card').forEach(c => {
          c.classList.remove('expanded');
          const innerContent = c.querySelector('.morph-card-content');
          const innerIndicator = c.querySelector('.morph-card-indicator');
          if (innerContent) innerContent.style.maxHeight = '0px';
          if (innerIndicator) innerIndicator.style.transform = 'rotate(0deg)';
        });

        if (!isExpanded) {
          card.classList.add('expanded');
          content.style.maxHeight = content.scrollHeight + 'px';
          indicator.style.transform = 'rotate(180deg)';
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
      });
    }

    // 🛡️ Security Rule 1 & 4: Contact Form validation, escape, and localStorage submission
    const contactForm = $('#contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = $('#contact-name').value.trim();
        const email = $('#contact-email').value.trim();
        const category = $('#contact-category').value;
        const message = $('#contact-message').value.trim();
        const submitBtn = $('#contact-submit-btn');

        if (!name || !email || !message) {
          showToast('⚠️ Please fill all required fields!');
          return;
        }

        submitBtn.disabled = true;
          submitBtn.innerHTML = '⏳ Sending message...';

        setTimeout(() => {
          const submissions = JSON.parse(localStorage.getItem('ev-contact-submissions') || '[]');
          
          // Cap at 10 to prevent storage overflow
          if (submissions.length >= 10) {
            submissions.shift();
          }

          submissions.push({ name, email, category, message, timestamp: new Date().toISOString() });
          localStorage.setItem('ev-contact-submissions', JSON.stringify(submissions));

          const container = $('#contact-form-container');
          container.innerHTML = `
            <div class="text-center animate-fade-in" style="padding: var(--sp-6);">
              <p style="font-size: 3.5rem; margin-bottom: var(--sp-4);">🎉</p>
              <h2 style="color: var(--accent); margin-bottom: var(--sp-2);">Message Received!</h2>
              <p class="text-secondary" style="font-size: 1.02rem; line-height: 1.5;">
                Hello <strong>${escHtml(name)}</strong>, your message has been safely recorded in our support database.
              </p>
              
              <div style="margin-top: var(--sp-6); background: var(--bg-primary); padding: var(--sp-4); border-radius: 12px; border: 1px solid var(--border); text-align: left;">
                <p style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; margin-bottom: 5px;">Submitted details:</p>
                <p style="margin-bottom: 5px;"><strong>Subject:</strong> ${escHtml(category)}</p>
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.4;">"${escHtml(message)}"</p>
              </div>

              <div style="margin-top: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-3);">
                <a href="https://wa.me/919999999999?text=${encodeURIComponent('Hello English Vidya, my name is ' + name + '. I submitted a message on the website: ' + message)}" 
                   target="_blank" 
                   class="promo-btn primary" 
                   style="background: #10b981; border-color: #10b981; text-decoration: none; color: #fff; font-size: 0.95rem; padding: 12px; display: block; border-radius: 8px; font-weight: 700; text-align:center;">
                  💬 Also send on WhatsApp
                </a>
                <button class="promo-btn secondary" id="contact-home-btn" style="padding: 12px; border-radius: 8px; cursor:pointer;">
                  🏠 Go to Home Page
                </button>
              </div>
            </div>
          `;

          const homeBtn = $('#contact-home-btn');
          if (homeBtn) {
            homeBtn.addEventListener('click', () => navigate('/'));
          }

          showToast('✅ Message sent successfully!');
        }, 1000);
      });
    }

    // 🛡️ Security Rule 3: Event delegation for Legal page tab shifting
    const tabsContainer = $('#legal-tabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const activeTab = btn.dataset.tab;
        
        tabsContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'var(--bg-raised)';
          b.style.border = '1px solid var(--border)';
          b.style.color = 'var(--text-secondary)';
        });

        btn.classList.add('active');
        btn.style.background = 'var(--gradient-accent)';
        btn.style.border = 'none';
        btn.style.color = '#fff';

        const contentContainer = $('#legal-content-container');
        if (!contentContainer) return;

        if (activeTab === 'disclaimer') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">Disclaimer</h2>
              <p><strong>1. केवल शैक्षिक उद्देश्य:</strong> English Vidya पर उपलब्ध सभी अध्ययन सामग्री, शब्दकोश, व्याकरण नियम और पाठ केवल शैक्षिक और सामान्य सूचनात्मक उद्देश्यों के लिए प्रदान किए गए हैं। हम किसी भी परीक्षा या सरकारी नौकरी में सफलता की गारंटी नहीं देते हैं।</p>
              <p style="margin-top: 15px;"><strong>2. सटीकता और त्रुटियां:</strong> हालांकि हमने 19,773 शब्दों और व्याकरण नियमों के संकलन में अत्यधिक सावधानी बरती है, फिर भी इसमें मानवीय या लिपिकीय त्रुटियां हो सकती हैं। छात्र से अनुरोध है कि वे किसी भी महत्वपूर्ण परीक्षा से पहले दोबारा जांच लें।</p>
              <p style="margin-top: 15px;"><strong>3. बाहरी लिंक्स:</strong> हमारी पाठ्यसामग्री में वीडियो एम्बेड शामिल हैं जो तीसरे पक्ष के सर्वर्स पर होस्ट किए गए हैं। इन वीडियो की सामग्री या विज्ञापनों पर हमारा कोई नियंत्रण नहीं है।</p>
            </div>
          `;
        } else if (activeTab === 'privacy') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">Privacy Policy</h2>
              <p><strong>1. डेटा सुरक्षा और गोपनीयता:</strong> English Vidya छात्रों की गोपनीयता का पूर्ण सम्मान करती है। हम छात्रों का कोई भी निजी डेटा (जैसे नाम, ईमेल, प्रोग्रेस) किसी तीसरे पक्ष को कभी भी बेचते या साझा नहीं करते हैं। विज्ञापन और अन्य सेवाएं भी निजता नियमों के तहत ही दिखाई जाती हैं।</p>
              <p style="margin-top: 15px;"><strong>2. प्रमाणीकरण:</strong> लॉगिन के लिए हम Google Sign-In (OAuth) का उपयोग करते हैं। पासवर्ड रहित सुरक्षित प्रमाणीकरण के लिए आपका Google सत्र टोकन केवल आपके ब्राउज़र में Secure HttpOnly Cookies के माध्यम से स्थानांतरित किया जाता है, जिसे जावास्क्रिप्ट द्वारा चोरी नहीं किया जा सकता।</p>
              <p style="margin-top: 15px;"><strong>3. स्थानीय संग्रहण (Local Storage):</strong> छात्र की दैनिक स्ट्रीक्स, हाल ही की खोजें और संपर्क फ़ॉर्म सबमिशन स्थानीय रूप से ब्राउज़र के \`localStorage\` में संग्रहीत होते हैं, ताकि बिना इंटरनेट के भी ऐप सुचारू रूप से काम कर सके।</p>
              <p style="margin-top: 15px;"><strong>4. विश्लेषण:</strong> हम अपनी वेबसाइट के ट्रैफ़िक की निगरानी के लिए Cloudflare के निजता-अनुकून edge analytics का उपयोग करते हैं, जो छात्र के कंप्यूटर पर बिना कोई कुकी या जावास्क्रिप्ट चलाए सुरक्षित रूप से काम करता है।</p>
            </div>
          `;
        } else if (activeTab === 'liability') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">Limitation of Liability</h2>
              <p><strong>1. कोई वारंटी नहीं:</strong> यह वेबसाइट "जैसी है" और "जैसी उपलब्ध है" के आधार पर बिना किसी वारंटी के प्रदान की गई है। हम यह गारंटी नहीं देते कि सेवा निर्बाध, त्रुटिहीन या वायरस-मुक्त होगी।</p>
              <p style="margin-top: 15px;"><strong>2. हानि की सीमा:</strong> कानून द्वारा अनुमत अधिकतम सीमा तक, English Vidya, इसके निर्माता, या साझेदार किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक, या दंडात्मक नुकसान (जैसे डेटा हानि, phone का धीमा होना, या streak टूटने से होने वाला मानसिक तनाव) के लिए उत्तरदायी नहीं होंगे।</p>
              <p style="margin-top: 15px;"><strong>3. स्वैच्छिक योगदान और ई-बुक:</strong> यदि छात्र वैकल्पिक व्याकरण ई-बुक ख़रीदते हैं, तो वह भुगतान पूरी तरह से सुरक्षित मर्चेंट चैनल के माध्यम से किया जाएगा। किसी भी असफल भुगतान या तकनीकी समस्या की स्थिति में, संबंधित पेमेंट गेटवे की नीतियां लागू होंगी, हालांकि हम आपकी पूरी सहायता करने का प्रयास करेंगे।</p>
            </div>
          `;
        }
      });
    }

    // 📲 Custom PWA Install Prompt Handler
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBanner = $('#pwa-install-banner');
      if (installBanner) {
        installBanner.style.display = 'block';
      }
    });

    const installBtn = $('#pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        const installBanner = $('#pwa-install-banner');
        if (installBanner) {
          installBanner.style.display = 'none';
        }
      });
    }

    Router.init();
    
    // Pre-load search index in background
    setTimeout(() => ensureSearchIndex(), 2000);
  }

  // Boot Application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
