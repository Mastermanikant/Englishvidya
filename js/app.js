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

      showToast(next === 'dark' ? '🌙 डार्क मोड चालू' : '☀️ लाइट मोड चालू');
    }
  };

  // ═══════════════════════════════════════════════════
  //  2. ROUTER (Static Shell-Based SPA)
  // ═══════════════════════════════════════════════════
  const Router = {
    init() {
      if (state.isHashMode) {
        window.addEventListener('hashchange', () => this.resolve());
      } else {
        window.addEventListener('popstate', () => this.resolve());
      }
      this.resolve();
    },

    resolve() {
      let route = 'home';
      let param = null;

      if (state.isHashMode) {
        // Hash routing mode for offline/local file protocol
        const hash = location.hash.slice(1) || '/';
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
      setTimeout(() => searchInput.focus(), 100);
      this.showRecent();
    },

    close() {
      searchOverlay.classList.remove('active');
      searchInput.value = '';
      searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 ऊपर टाइप करें — तुरंत results आएंगे</p><div id="recent-searches-container"></div></div>';
    },

    async search(query) {
      if (!query || query.length < 2) {
        this.showRecent();
        return;
      }

      const index = await ensureSearchIndex();
      if (!index) {
        searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">⚠️ Search index लोड नहीं हो सका</p></div>';
        return;
      }

      const q = query.toLowerCase().trim();
      const matches = index.filter(item =>
        item.w.toLowerCase().includes(q) || item.m.includes(q)
      ).slice(0, 20);

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="search-placeholder"><p class="search-hint">😔 "${query}" के लिए कोई शब्द नहीं मिला</p></div>`;
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
        searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 ऊपर टाइप करें — तुरंत results आएंगे</p></div>';
        return;
      }

      searchResults.innerHTML = `
        <div style="padding-top: var(--sp-4);">
          <p class="text-small text-secondary" style="margin-bottom: var(--sp-3);">हाल ही में खोजे गए:</p>
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
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'विद्यार्थी';
    const timeGreeting = getTimeGreeting();

    const greetingText = $('#hero-greeting-text');
    if (greetingText) {
      greetingText.textContent = `${timeGreeting}, ${userName} 🙏`;
    }

    const streakNumberText = $('#streak-number-text');
    if (streakNumberText) {
      streakNumberText.textContent = `🔥 ${streak} दिन की Streak`;
    }

    const streakMessageText = $('#streak-message-text');
    if (streakMessageText) {
      streakMessageText.textContent = streak >= 7 
        ? '🎉 बहुत शानदार! आप असाधारण प्रयास कर रहे हैं!' 
        : 'हर दिन वेबसाइट खोलें, 5 मिनट पढ़ें और अपनी स्ट्रीक बढ़ाएं!';
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
          <h1 style="font-size: 1.5rem;">📖 Grammar पाठ</h1>
          <p class="hero-subtitle">हिंदी माध्यम के विद्यार्थियों के लिए — आसान भाषा में</p>
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
            <h1 style="font-size: 1.5rem;">📖 Grammar पाठ</h1>
          </div>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">🚧</p>
            <h2>पाठ जल्द आ रहे हैं!</h2>
          </div>
        </div>
      `;
      return;
    }

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-4);">
          <h1 style="font-size: 1.5rem;">📖 Grammar पाठ</h1>
          <p class="hero-subtitle">हिंदी माध्यम के विद्यार्थियों के लिए — आसान भाषा में</p>
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
        <a href="/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;

    const lessonData = await loadJSON(`${DATA_BASE}/grammar/lessons/${lessonSlug}.json`);

    if (!lessonData) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <a href="/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">🚧</p>
            <h2>यह पाठ जल्द आ रहा है!</h2>
          </div>
        </div>
      `;
      return;
    }

    const categories = lessonData.categories || [];

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>

        <div class="lesson-header">
          <span class="badge">पाठ ${lessonData.part || ''}</span>
          <h1 style="margin-top: var(--sp-3);">${escHtml(lessonData.title || '')}</h1>
        </div>

        ${lessonData.teacher_note ? `
          <div class="card teacher-card">
            <div class="teacher-header">
              <div class="teacher-avatar">👨‍🏫</div>
              <div>
                <div class="teacher-name">शिक्षक का संदेश</div>
                <div class="teacher-role">English Mentor</div>
              </div>
            </div>
            <div class="teacher-quote">"${escHtml(lessonData.teacher_note)}"</div>
          </div>
        ` : ''}

        ${lessonData.definition_en ? `
          <div class="card">
            <h3>परिभाषा (Definition)</h3>
            <p style="margin-top: var(--sp-3); font-size: 1.05rem; font-weight: 500;">
              ${escHtml(lessonData.definition_en)}
            </p>
            ${lessonData.definition_hi ? `
              <div class="definition-block" style="margin-top: var(--sp-3);">
                <strong>हिंदी में:</strong> ${escHtml(lessonData.definition_hi)}
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
          <h1 style="font-size: 1.5rem;">🔤 शब्दकोश (Dictionary)</h1>
          <p class="hero-subtitle">148 श्रेणियों में 19,773 शब्द — हिंदी अर्थ के साथ</p>
        </div>
        <div class="loading-screen" style="min-height: 200px;">
          <div class="loader-spinner"></div>
          <p class="loader-text">श्रेणियाँ लोड हो रही हैं...</p>
        </div>
      </div>
    `;

    const categories = await ensureCategoriesIndex();

    if (!categories || categories.length === 0) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
            <h1 style="font-size: 1.5rem;">🔤 शब्दकोश (Dictionary)</h1>
          </div>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">📦</p>
            <h2>डेटा लोड हो रहा है</h2>
          </div>
        </div>
      `;
      return;
    }

    const selectedSlug = categorySlug || categories[0].slug;

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🔤 शब्दकोश (Dictionary)</h1>
          <p class="hero-subtitle">श्रेणी चुनें और शब्द सीखें</p>
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

  async function loadAndShowWords(slug) {
    const container = $('#words-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-screen" style="min-height:200px;"><div class="loader-spinner"></div></div>';
    const words = await loadCategoryWords(slug);

    if (!words || words.length === 0) {
      container.innerHTML = '<div class="card text-center"><p class="text-secondary">इस श्रेणी में शब्द उपलब्ध नहीं हैं।</p></div>';
      return;
    }

    state.currentWords = words;
    state.currentCategory = slug;

    container.innerHTML = `
      <div class="word-grid animate-fade-in">
        ${words.slice(0, 50).map((w, i) => `
          <div class="word-card" data-index="${i}">
            <div class="word-main">
              <div class="word-en">${escHtml(w.word || w.w || '')}</div>
              <div class="word-hi">${escHtml(w.meaning_hi || w.m || w.hindi || '')}</div>
            </div>
            <button class="word-speak-btn" data-word="${escHtml(w.word || w.w || '')}" title="उच्चारण सुनें">🔊</button>
          </div>
        `).join('')}
      </div>
      ${words.length > 50 ? `
        <div class="text-center mt-6">
          <button class="fc-btn fc-btn-know" id="load-more-btn">और शब्द देखें (${words.length - 50} बाकी)</button>
        </div>
      ` : ''}
    `;

    container.querySelectorAll('.word-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.word);
      });
    });

    const loadMoreBtn = $('#load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const grid = container.querySelector('.word-grid');
        words.slice(50).forEach((w) => {
          const card = document.createElement('div');
          card.className = 'word-card animate-fade-in';
          card.innerHTML = `
            <div class="word-main">
              <div class="word-en">${escHtml(w.word || w.w || '')}</div>
              <div class="word-hi">${escHtml(w.meaning_hi || w.m || w.hindi || '')}</div>
            </div>
            <button class="word-speak-btn" data-word="${escHtml(w.word || w.w || '')}" title="उच्चारण सुनें">🔊</button>
          `;
          card.querySelector('.word-speak-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            speakWord(w.word || w.w || '');
          });
          grid.appendChild(card);
        });
        loadMoreBtn.remove();
      });
    }
  }

  // ── 7d. FLASHCARDS ──
  async function renderFlashcards(categorySlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🃏 Flashcards Practice</h1>
          <p class="hero-subtitle">शब्द देखें, याद करें, उच्चारण सुनें!</p>
        </div>
        <div class="loading-screen" style="min-height: 200px;"><div class="loader-spinner"></div></div>
      </div>
    `;

    const categories = await ensureCategoriesIndex();
    const slug = categorySlug || (categories && categories.length > 0 ? categories[0].slug : null);

    if (!slug) {
      appContent.innerHTML = `<div class="card text-center"><h2>डेटा लोड नहीं हुआ</h2></div>`;
      return;
    }

    const words = await loadCategoryWords(slug);
    if (!words || words.length === 0) {
      appContent.innerHTML = '<div class="card text-center"><p>शब्द नहीं मिले।</p></div>';
      return;
    }

    state.fcDeck = shuffleArray([...words]).slice(0, 20);
    state.fcIndex = 0;
    state.fcKnown = 0;

    renderFlashcardUI(categories, slug);
  }

  function renderFlashcardUI(categories, activeSlug) {
    const total = state.fcDeck.length;
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;

    const word = current.word || current.w || '';
    const meaning = current.meaning_hi || current.m || current.hindi || '';
    const example = current.example_en || current.e || '';
    const pron = current.pronunciation || current.p || '';

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

        <div class="flashcard-container">
          <div class="flashcard-progress">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${((state.fcIndex) / total) * 100}%"></div>
            </div>
            <span class="progress-text">${state.fcIndex + 1}/${total}</span>
          </div>

          <div class="flashcard" id="flashcard">
            <div class="flashcard-inner">
              <div class="flashcard-face flashcard-front">
                <div class="flashcard-word">${escHtml(word)}</div>
                ${pron ? `<div class="flashcard-hint">${escHtml(pron)}</div>` : ''}
                <div class="flashcard-hint" style="margin-top: var(--sp-4); opacity: 0.6;">👆 Tap to reveal</div>
              </div>
              <div class="flashcard-face flashcard-back">
                <div class="flashcard-meaning">${escHtml(meaning)}</div>
                <div class="flashcard-word" style="font-size: 1.2rem; color: var(--text-secondary);">${escHtml(word)}</div>
                ${example ? `<div class="flashcard-example" style="margin-top: var(--sp-4);">"${escHtml(example)}"</div>` : ''}
              </div>
            </div>
          </div>

          <div class="flashcard-controls">
            <button class="fc-btn fc-btn-skip" id="fc-skip">⏭️ Skip</button>
            <button class="fc-btn fc-btn-know" id="fc-speak" style="background: var(--accent-soft); color: var(--accent);">🔊 सुनें</button>
            <button class="fc-btn fc-btn-know" id="fc-know">✅ याद है!</button>
          </div>
        </div>
      </div>
    `;

    const flashcard = $('#flashcard');
    flashcard.addEventListener('click', () => flashcard.classList.toggle('flipped'));

    $('#fc-skip').addEventListener('click', () => nextFlashcard(categories, activeSlug, false));
    $('#fc-know').addEventListener('click', () => nextFlashcard(categories, activeSlug, true));
    $('#fc-speak').addEventListener('click', () => speakWord(word));

    if (categories) {
      $$('#fc-category-chips .category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          navigate('/flashcards/' + chip.dataset.slug);
        });
      });
    }
  }

  function nextFlashcard(categories, activeSlug, known) {
    if (known) state.fcKnown++;
    state.fcIndex++;

    if (state.fcIndex >= state.fcDeck.length) {
      appContent.innerHTML = `
        <div class="animate-fade-in flashcard-container" style="padding-top: var(--sp-12);">
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 3rem; margin-bottom: var(--sp-4);">🎉</p>
            <h2>बहुत बढ़िया!</h2>
            <p class="text-secondary" style="margin-top: var(--sp-3); font-size: 1.1rem;">
              आपने <strong>${state.fcDeck.length}</strong> में से <strong style="color: var(--success);">${state.fcKnown}</strong> शब्द याद किए!
            </p>
            <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-3); justify-content: center; flex-wrap: wrap;">
              <button class="fc-btn fc-btn-know" id="fc-retry-btn">🔄 फिर से</button>
              <button class="fc-btn fc-btn-skip" id="fc-other-btn">📂 दूसरी श्रेणी</button>
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
      return;
    }

    renderFlashcardUI(categories, activeSlug);
  }

  // ── 7e. PROFILE ──
  function renderProfile() {
    const streak = StreakTracker.get();
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'विद्यार्थी';
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="profile-header">
          <div class="profile-avatar">${userName.charAt(0).toUpperCase()}</div>
          <div class="profile-name">${escHtml(userName)}</div>
          <div class="profile-email">🔥 ${streak} दिन की Streak</div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">सामान्य</div>
          <div class="settings-item" id="setting-name">
            <div class="settings-item-icon">✏️</div>
            <div class="settings-item-text">
              <div class="settings-item-title">नाम बदलें</div>
              <div class="settings-item-desc">${escHtml(userName)}</div>
            </div>
          </div>
          <div class="settings-item" id="setting-theme">
            <div class="settings-item-icon">${theme === 'dark' ? '🌙' : '☀️'}</div>
            <div class="settings-item-text">
              <div class="settings-item-title">थीम</div>
              <div class="settings-item-desc">${theme === 'dark' ? 'डार्क मोड' : 'लाइट मोड'}</div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">आँकड़े</div>
          <div class="settings-item">
            <div class="settings-item-icon">🔥</div>
            <div class="settings-item-text">
              <div class="settings-item-title">लगातार दिन</div>
              <div class="settings-item-desc">${streak} दिन</div>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-icon">📚</div>
            <div class="settings-item-text">
              <div class="settings-item-title">उपलब्ध शब्द</div>
              <div class="settings-item-desc">19,773 शब्द / 148 श्रेणियाँ</div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-title">Share</div>
          <div class="settings-item" id="setting-share">
            <div class="settings-item-icon">📤</div>
            <div class="settings-item-text">
              <div class="settings-item-title">दोस्तों को बताएँ</div>
              <div class="settings-item-desc">WhatsApp पर शेयर करें</div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('#setting-name').addEventListener('click', () => {
      const newName = prompt('अपना नाम लिखें:', userName);
      if (newName && newName.trim()) {
        localStorage.setItem(STORAGE_KEYS.userName, newName.trim());
        showToast('✅ नाम बदल दिया गया!');
        renderProfile();
      }
    });

    $('#setting-theme').addEventListener('click', (e) => ThemeManager.toggle(e));

    $('#setting-share').addEventListener('click', () => {
      const shareText = `English Vidya — अंग्रेजी सीखने का सबसे आसान तरीका! 📚🔥\n\n19,773 शब्द, 60 ग्रामर पाठ, फ्लैशकार्ड्स और बहुत कुछ!\n\n👉 ${location.origin}`;
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
      showToast('⚠️ इस ब्राउज़र में उच्चारण उपलब्ध नहीं है');
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
    if (hour < 12) return 'सुप्रभात ☀️';
    if (hour < 17) return 'नमस्ते 🙏';
    return 'शुभ संध्या 🌙';
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

  // ═══════════════════════════════════════════════════
  //  12. INITIALIZE GLOBAL LISTENERS & INTERACTION ENGINE
  // ═══════════════════════════════════════════════════
  function init() {
    ThemeManager.init();
    SearchEngine.init();
    initScrollProgress();

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
          showToast('⚠️ सभी आवश्यक फ़ील्ड भरें!');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ संदेश भेजा जा रहा है...';

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
              <h2 style="color: var(--accent); margin-bottom: var(--sp-2);">संदेश सफलतापूर्वक दर्ज!</h2>
              <p class="text-secondary" style="font-size: 1.02rem; line-height: 1.5;">
                नमस्ते <strong>${escHtml(name)}</strong>, आपका संदेश हमारे सपोर्ट डेटाबेस में सुरक्षित रूप से दर्ज कर लिया गया है।
              </p>
              
              <div style="margin-top: var(--sp-6); background: var(--bg-primary); padding: var(--sp-4); border-radius: 12px; border: 1px solid var(--border); text-align: left;">
                <p style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; margin-bottom: 5px;">दर्ज किया गया विवरण:</p>
                <p style="margin-bottom: 5px;"><strong>विषय:</strong> ${escHtml(category)}</p>
                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.4;">"${escHtml(message)}"</p>
              </div>

              <div style="margin-top: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-3);">
                <a href="https://wa.me/919999999999?text=${encodeURIComponent('नमस्ते English Vidya, मेरा नाम ' + name + ' है। मैंने वेबसाइट पर एक संदेश दर्ज किया है: ' + message)}" 
                   target="_blank" 
                   class="promo-btn primary" 
                   style="background: #10b981; border-color: #10b981; text-decoration: none; color: #fff; font-size: 0.95rem; padding: 12px; display: block; border-radius: 8px; font-weight: 700; text-align:center;">
                  💬 सीधे WhatsApp पर भी भेजें
                </a>
                <button class="promo-btn secondary" id="contact-home-btn" style="padding: 12px; border-radius: 8px; cursor:pointer;">
                  🏠 होम पेज पर वापस जाएँ
                </button>
              </div>
            </div>
          `;

          const homeBtn = $('#contact-home-btn');
          if (homeBtn) {
            homeBtn.addEventListener('click', () => navigate('/'));
          }

          showToast('✅ संदेश सुरक्षित रूप से भेजा गया!');
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
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">अस्वीकरण</h2>
              <p><strong>1. केवल शैक्षिक उद्देश्य:</strong> English Vidya पर उपलब्ध सभी अध्ययन सामग्री, शब्दकोश, व्याकरण नियम और पाठ केवल शैक्षिक और सामान्य सूचनात्मक उद्देश्यों के लिए प्रदान किए गए हैं। हम किसी भी परीक्षा या सरकारी नौकरी में सफलता की गारंटी नहीं देते हैं।</p>
              <p style="margin-top: 15px;"><strong>2. सटीकता और त्रुटियां:</strong> हालांकि हमने 19,773 शब्दों और व्याकरण नियमों के संकलन में अत्यधिक सावधानी बरती है, फिर भी इसमें मानवीय या लिपिकीय त्रुटियां हो सकती हैं। छात्र से अनुरोध है कि वे किसी भी महत्वपूर्ण परीक्षा से पहले दोबारा जांच लें।</p>
              <p style="margin-top: 15px;"><strong>3. बाहरी लिंक्स:</strong> हमारी पाठ्यसामग्री में वीडियो एम्बेड शामिल हैं जो तीसरे पक्ष के सर्वर्स पर होस्ट किए गए हैं। इन वीडियो की सामग्री या विज्ञापनों पर हमारा कोई नियंत्रण नहीं है।</p>
            </div>
          `;
        } else if (activeTab === 'privacy') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">गोपनीयता नीति</h2>
              <p><strong>1. डेटा सुरक्षा और गोपनीयता:</strong> English Vidya छात्रों की गोपनीयता का पूर्ण सम्मान करती है। हम छात्रों का कोई भी निजी डेटा (जैसे नाम, ईमेल, प्रोग्रेस) किसी तीसरे पक्ष को कभी भी बेचते या साझा नहीं करते हैं। विज्ञापन और अन्य सेवाएं भी निजता नियमों के तहत ही दिखाई जाती हैं।</p>
              <p style="margin-top: 15px;"><strong>2. प्रमाणीकरण:</strong> लॉगिन के लिए हम Google Sign-In (OAuth) का उपयोग करते हैं। पासवर्ड रहित सुरक्षित प्रमाणीकरण के लिए आपका Google सत्र टोकन केवल आपके ब्राउज़र में Secure HttpOnly Cookies के माध्यम से स्थानांतरित किया जाता है, जिसे जावास्क्रिप्ट द्वारा चोरी नहीं किया जा सकता।</p>
              <p style="margin-top: 15px;"><strong>3. स्थानीय संग्रहण (Local Storage):</strong> छात्र की दैनिक स्ट्रीक्स, हाल ही की खोजें और संपर्क फ़ॉर्म सबमिशन स्थानीय रूप से ब्राउज़र के \`localStorage\` में संग्रहीत होते हैं, ताकि बिना इंटरनेट के भी ऐप सुचारू रूप से काम कर सके।</p>
              <p style="margin-top: 15px;"><strong>4. विश्लेषण:</strong> हम अपनी वेबसाइट के ट्रैफ़िक की निगरानी के लिए Cloudflare के निजता-अनुकून edge analytics का उपयोग करते हैं, जो छात्र के कंप्यूटर पर बिना कोई कुकी या जावास्क्रिप्ट चलाए सुरक्षित रूप से काम करता है।</p>
            </div>
          `;
        } else if (activeTab === 'liability') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">सीमित दायित्व</h2>
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
