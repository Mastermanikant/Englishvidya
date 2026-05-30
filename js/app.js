/* ══════════════════════════════════════════════════════════════
   ENGLISH VIDYA — Core Application Engine (app.js)
   Pure Vanilla JS | Client-Side Router | Zero-Backend Search
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
    route: ''
  };

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const appContent = $('#app-content');
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
      $('#theme-toggle-btn').addEventListener('click', () => this.toggle());
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.content = theme === 'dark' ? '#0c1222' : '#f8fafc';
      }
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.apply(next);
      showToast(next === 'dark' ? '🌙 डार्क मोड चालू' : '☀️ लाइट मोड चालू');
    }
  };

  // ═══════════════════════════════════════════════════
  //  2. ROUTER (Hash-Based SPA)
  // ═══════════════════════════════════════════════════
  const Router = {
    init() {
      window.addEventListener('hashchange', () => this.resolve());
      this.resolve();
    },

    resolve() {
      const hash = location.hash.slice(1) || '/';
      const parts = hash.split('/').filter(Boolean);
      const route = parts[0] || 'home';
      const param = parts[1] || null;

      state.route = route;
      this.updateNav(route);

      switch (route) {
        case 'home':
          renderDashboard();
          break;
        case 'grammar':
          if (param) {
            renderLesson(param);
          } else {
            renderGrammarList();
          }
          break;
        case 'dictionary':
          renderDictionary(param);
          break;
        case 'flashcards':
          renderFlashcards(param);
          break;
        case 'profile':
          renderProfile();
          break;
        default:
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
          location.hash = `#/dictionary/${slug}`;
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
  //  6. SCREEN RENDERERS
  // ═══════════════════════════════════════════════════

  // ── 6a. DASHBOARD ──
  function renderDashboard() {
    const streak = StreakTracker.get();
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'विद्यार्थी';
    const timeGreeting = getTimeGreeting();

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <!-- Hero Welcome -->
        <div class="hero-welcome">
          <p class="hero-greeting">${timeGreeting} 🙏</p>
          <h1 class="hero-title">English सीखो, आगे बढ़ो!</h1>
          <p class="hero-subtitle">हर दिन कुछ नया सीखो — Grammar, Vocabulary और Practice सब एक जगह।</p>
        </div>

        <!-- Streak Card -->
        <div class="streak-card">
          <div class="streak-content">
            <div class="streak-number">🔥 ${streak} दिन</div>
            <div class="streak-label">लगातार सीखने का रिकॉर्ड!</div>
            <div class="streak-message">${streak >= 7 ? '🎉 शानदार! एक हफ़्ते से ज़्यादा लगातार!' : 'हर दिन आओ, streak बढ़ाओ!'}</div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">19,773</div>
            <div class="stat-label">शब्द (Words)</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-value">60</div>
            <div class="stat-label">Grammar पाठ</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📂</div>
            <div class="stat-value">148</div>
            <div class="stat-label">श्रेणियाँ</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🃏</div>
            <div class="stat-value">∞</div>
            <div class="stat-label">Flashcards</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <h2 class="section-title">⚡ जल्दी शुरू करें</h2>
        <div class="action-grid">
          <a href="#/grammar" class="action-card">
            <div class="action-icon">📖</div>
            <div class="action-title">Grammar सीखें</div>
            <div class="action-desc">Noun, Verb, Tense — हिंदी में समझें</div>
          </a>
          <a href="#/dictionary" class="action-card">
            <div class="action-icon">🔤</div>
            <div class="action-title">शब्दकोश खोलें</div>
            <div class="action-desc">19,773 शब्दों का खज़ाना</div>
          </a>
          <a href="#/flashcards" class="action-card">
            <div class="action-icon">🃏</div>
            <div class="action-title">Flashcards Practice</div>
            <div class="action-desc">याद करें, उच्चारण सुनें</div>
          </a>
          <a href="#/profile" class="action-card">
            <div class="action-icon">👤</div>
            <div class="action-title">प्रोफ़ाइल</div>
            <div class="action-desc">सेटिंग्स और प्रगति</div>
          </a>
        </div>

        <!-- Tip of the Day -->
        <div class="card card-gradient">
          <span class="badge">💡 आज का टिप</span>
          <h3 style="margin-top: var(--sp-3); color: var(--text-primary);">रोज़ 10 नए शब्द सीखें</h3>
          <p class="text-secondary" style="margin-top: var(--sp-2); margin-bottom: 0;">
            अगर आप रोज़ सिर्फ 10 शब्द सीखते हैं, तो 1 साल में आप <strong>3,650 शब्द</strong> जान जाएंगे — यह किसी भी अंग्रेजी exam के लिए काफ़ी से ज़्यादा है!
          </p>
        </div>
      </div>
    `;
  }

  // ── 6b. GRAMMAR LIST ──
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

    // Deduplicate: keep only the FIRST (best) title per part number
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
            // Strip Hindi in parens from title to use as subtitle
            const titleMatch = l.title.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
            const titleEn = titleMatch ? titleMatch[1].trim().replace(/[✅⏳❌]/g, '').trim() : l.title;
            const titleHi = titleMatch && titleMatch[2] ? titleMatch[2].trim() : '';
            return `
              <a href="#/grammar/${l.part}" class="chapter-item">
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


  // ── 6c. LESSON READER ──
  async function renderLesson(lessonId) {
    // Show skeleton while loading
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="#/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;

    const lessonData = await loadJSON(`${DATA_BASE}/grammar/lessons/part_${lessonId}.json`);

    if (!lessonData) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <a href="#/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem; margin-bottom: var(--sp-4);">🚧</p>
            <h2>यह पाठ जल्द आ रहा है!</h2>
            <p class="text-secondary" style="margin-top: var(--sp-3);">पाठ ${lessonId} अभी तैयार हो रहा है। कृपया दूसरे पाठ पढ़ें।</p>
          </div>
        </div>
      `;
      return;
    }

    const categories = lessonData.categories || [];

    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="#/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>

        <div class="lesson-header">
          <span class="badge">पाठ ${lessonData.part || lessonId}</span>
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
                  <span>${escHtml(cat.name || '')} ${cat.intro ? '— ' + escHtml(cat.intro) : ''}</span>
                  <span class="accordion-arrow">→</span>
                </button>
                <div class="accordion-content">
                  <div class="accordion-body">
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

  // ── 6d. DICTIONARY ──
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
            <p class="text-secondary" style="margin-top: var(--sp-3);">श्रेणी सूची अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।</p>
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

        <!-- Category Chips -->
        <div class="category-chips-scroll" id="category-chips">
          ${categories.map(c => `
            <button class="category-chip${c.slug === selectedSlug ? ' active' : ''}" 
                    data-slug="${escHtml(c.slug)}">
              ${c.icon || '📁'} ${escHtml(c.name)} (${c.count})
            </button>
          `).join('')}
        </div>

        <!-- Words Container -->
        <div id="words-container">
          <div class="loading-screen" style="min-height: 200px;">
            <div class="loader-spinner"></div>
          </div>
        </div>
      </div>
    `;

    // Bind chip clicks
    $$('#category-chips .category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('#category-chips .category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        loadAndShowWords(chip.dataset.slug);
        // Scroll chip into view
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    // Load initial category
    loadAndShowWords(selectedSlug);
  }

  async function loadAndShowWords(slug) {
    const container = $('#words-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-screen" style="min-height:200px;"><div class="loader-spinner"></div></div>';

    const words = await loadCategoryWords(slug);

    if (!words || words.length === 0) {
      container.innerHTML = '<div class="card text-center"><p class="text-secondary">इस श्रेणी में अभी शब्द उपलब्ध नहीं हैं।</p></div>';
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
            <button class="word-speak-btn" data-word="${escHtml(w.word || w.w || '')}" title="उच्चारण सुनें">
              🔊
            </button>
          </div>
        `).join('')}
      </div>
      ${words.length > 50 ? `
        <div class="text-center mt-6">
          <button class="fc-btn fc-btn-know" id="load-more-btn">और शब्द देखें (${words.length - 50} बाकी)</button>
        </div>
      ` : ''}
    `;

    // Bind speak buttons
    container.querySelectorAll('.word-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.word);
      });
    });

    // Bind load more
    const loadMoreBtn = $('#load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const grid = container.querySelector('.word-grid');
        words.slice(50).forEach((w, i) => {
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

  // ── 6e. FLASHCARDS ──
  async function renderFlashcards(categorySlug) {
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <div class="hero-welcome" style="padding-bottom: var(--sp-3);">
          <h1 style="font-size: 1.5rem;">🃏 Flashcards Practice</h1>
          <p class="hero-subtitle">शब्द देखें, याद करें, उच्चारण सुनें!</p>
        </div>
        <div class="loading-screen" style="min-height: 200px;">
          <div class="loader-spinner"></div>
          <p class="loader-text">शब्द तैयार हो रहे हैं...</p>
        </div>
      </div>
    `;

    // Load categories for selection
    const categories = await ensureCategoriesIndex();
    const slug = categorySlug || (categories && categories.length > 0 ? categories[0].slug : null);

    if (!slug) {
      appContent.innerHTML = `
        <div class="animate-fade-in">
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 2rem;">📦</p>
            <h2 style="margin-top: var(--sp-3);">डेटा लोड नहीं हुआ</h2>
          </div>
        </div>
      `;
      return;
    }

    const words = await loadCategoryWords(slug);
    if (!words || words.length === 0) {
      appContent.innerHTML = '<div class="card text-center"><p>इस श्रेणी में शब्द नहीं मिले।</p></div>';
      return;
    }

    // Shuffle and prepare deck
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
          <!-- Progress -->
          <div class="flashcard-progress">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${((state.fcIndex) / total) * 100}%"></div>
            </div>
            <span class="progress-text">${state.fcIndex + 1}/${total}</span>
          </div>

          <!-- Flashcard -->
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

          <!-- Controls -->
          <div class="flashcard-controls">
            <button class="fc-btn fc-btn-skip" id="fc-skip">⏭️ Skip</button>
            <button class="fc-btn fc-btn-know" id="fc-speak" style="background: var(--accent-soft); color: var(--accent);">🔊 सुनें</button>
            <button class="fc-btn fc-btn-know" id="fc-know">✅ याद है!</button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    const flashcard = $('#flashcard');
    flashcard.addEventListener('click', () => flashcard.classList.toggle('flipped'));

    $('#fc-skip').addEventListener('click', () => nextFlashcard(categories, activeSlug, false));
    $('#fc-know').addEventListener('click', () => nextFlashcard(categories, activeSlug, true));
    $('#fc-speak').addEventListener('click', () => speakWord(word));

    // Bind category switching
    if (categories) {
      $$('#fc-category-chips .category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          location.hash = `#/flashcards/${chip.dataset.slug}`;
        });
      });
    }
  }

  function nextFlashcard(categories, activeSlug, known) {
    if (known) state.fcKnown++;
    state.fcIndex++;

    if (state.fcIndex >= state.fcDeck.length) {
      // Session complete
      appContent.innerHTML = `
        <div class="animate-fade-in flashcard-container" style="padding-top: var(--sp-12);">
          <div class="card text-center" style="padding: var(--sp-10);">
            <p style="font-size: 3rem; margin-bottom: var(--sp-4);">🎉</p>
            <h2>बहुत बढ़िया!</h2>
            <p class="text-secondary" style="margin-top: var(--sp-3); font-size: 1.1rem;">
              आपने <strong>${state.fcDeck.length}</strong> में से <strong style="color: var(--success);">${state.fcKnown}</strong> शब्द याद किए!
            </p>
            <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-3); justify-content: center; flex-wrap: wrap;">
              <button class="fc-btn fc-btn-know" onclick="location.hash='#/flashcards/${activeSlug}'">🔄 फिर से</button>
              <button class="fc-btn fc-btn-skip" onclick="location.hash='#/flashcards'">📂 दूसरी श्रेणी</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    renderFlashcardUI(categories, activeSlug);
  }

  // ── 6f. PROFILE ──
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
          <div class="settings-group-title">ऐप के बारे में</div>
          
          <div class="settings-item">
            <div class="settings-item-icon">ℹ️</div>
            <div class="settings-item-text">
              <div class="settings-item-title">English Vidya</div>
              <div class="settings-item-desc">Version 1.0 — हिंदी माध्यम के छात्रों के लिए</div>
            </div>
          </div>

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

    // Bind events
    $('#setting-name').addEventListener('click', () => {
      const newName = prompt('अपना नाम लिखें:', userName);
      if (newName && newName.trim()) {
        localStorage.setItem(STORAGE_KEYS.userName, newName.trim());
        showToast('✅ नाम बदल दिया गया!');
        renderProfile();
      }
    });

    $('#setting-theme').addEventListener('click', () => ThemeManager.toggle());

    $('#setting-share').addEventListener('click', () => {
      const shareText = `English Vidya — अंग्रेजी सीखने का सबसे आसान तरीका! 📚🔥\n\n19,773 शब्द, 60 Grammar पाठ, Flashcards — सब मुफ़्त!\n\n👉 ${location.origin}`;
      if (navigator.share) {
        navigator.share({ title: 'English Vidya', text: shareText, url: location.origin });
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  7. SPEECH SYNTHESIS (Pronunciation)
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
  //  8. SCROLL PROGRESS
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
  //  9. TOAST SYSTEM
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
  //  10. UTILITY FUNCTIONS
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

  // ═══════════════════════════════════════════════════
  //  11. INITIALIZE APPLICATION
  // ═══════════════════════════════════════════════════
  function init() {
    ThemeManager.init();
    SearchEngine.init();
    initScrollProgress();
    Router.init();

    // Pre-load search index in background
    setTimeout(() => ensureSearchIndex(), 2000);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
