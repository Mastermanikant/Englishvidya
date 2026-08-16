/* ══════════════════════════════════════════════════════════════
   ENGLISH VIDYA — Core Application Engine (app.js) v3.0
   Pure Vanilla JS | MPA Utility Library | Zero-Backend Search
   
   ARCHITECTURE: This file provides interactive features for
   Eleventy-generated static HTML pages. It does NOT handle routing.
   Navigation is handled by real HTML page links.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Constants ──
  const DATA_BASE = '/data';
  const VOCAB_PATH = `${DATA_BASE}/vocabulary/categories`;
  const SEARCH_INDEX_PATH = `${DATA_BASE}/site/search-index.json`;
  const ARTICLES_INDEX_PATH = `${DATA_BASE}/site/articles-search-index.json`;
  const CATEGORIES_INDEX_PATH = `${DATA_BASE}/site/categories-index.json`;
  const WHATSAPP_NUMBER = '917070133396';
  const STORAGE_KEYS = {
    theme: 'ev-theme',
    recent: 'ev-recent-searches',
    streak: 'ev-streak',
    lastVisit: 'ev-last-visit',
    fcProgress: 'ev-fc-progress',
    userName: 'ev-user-name',
    fcSettings: 'ev-fc-settings'
  };
  const MAX_RECENT = 8;

  // ── State ──
  const state = {
    searchIndex: null,
    articlesIndex: null,
    categoriesIndex: null,
    currentCategory: null,
    currentWords: [],
    fcDeck: [],
    fcIndex: 0,
    fcKnown: 0,
    fcTransitioning: false,
    fcAutoPlayTimer: null,
    fcSettings: {
      frontPron: false,
      frontMeaning: false,
      backAdvanced: true,
      backSynonyms: true,
      backAntonyms: true,
      backCollocations: true,
      autoPlay: false,
      timerX: 3,
      timerY: 4,
      customSRS: true,
      intervalHard: 0,
      intervalGood: 1,
      intervalEasy: 4
    },
    fcTimerXId: null,
    fcTimerYId: null
  };

  // ── DOM References (null-safe) ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ═══════════════════════════════════════════════════
  //  1. THEME MANAGER
  // ═══════════════════════════════════════════════════
  const ThemeManager = {
    init() {
      // System theme detection on first visit (no saved preference)
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      const systemPrefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = saved || systemPrefers;
      this.apply(theme);
      this.updateDrawerLabel(theme);

      // Desktop toggle button
      const btn = $('#theme-toggle-btn');
      if (btn) btn.addEventListener('click', (e) => this.toggle(e));

      // Mobile drawer toggle button (Bug Fix: was missing)
      const drawerBtn = $('#theme-toggle-drawer-btn');
      if (drawerBtn) drawerBtn.addEventListener('click', (e) => this.toggle(e));
    },

    updateDrawerLabel(theme) {
      const moonLabel = document.querySelector('#theme-toggle-drawer-btn .theme-label-moon');
      const sunLabel = document.querySelector('#theme-toggle-drawer-btn .theme-label-sun');
      if (!moonLabel || !sunLabel) return;
      if (theme === 'dark') {
        moonLabel.style.display = 'none';
        sunLabel.style.display = 'inline';
      } else {
        moonLabel.style.display = 'inline';
        sunLabel.style.display = 'none';
      }
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.content = theme === 'dark' ? '#0c1222' : '#f8fafc';
      }
      
      // Desktop toggle icon manual update for 100% reliability
      const sunIcon = document.querySelector('#theme-toggle-btn .icon-sun');
      const moonIcon = document.querySelector('#theme-toggle-btn .icon-moon');
      if (sunIcon && moonIcon) {
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }
    },

    toggle(event) {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      // Reduced-motion: skip wave animation (Bug Fix)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        this.apply(next);
        this.updateDrawerLabel(next);
        showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
        return;
      }

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

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const wave = document.createElement('div');
      wave.className = 'theme-transition-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.backgroundColor = next === 'dark' ? '#0c1222' : '#f8fafc';
      document.body.appendChild(wave);

      wave.offsetHeight;

      wave.style.width = `${endRadius * 2}px`;
      wave.style.height = `${endRadius * 2}px`;
      wave.style.transform = 'translate(-50%, -50%) scale(1)';
      wave.style.opacity = '1';

      setTimeout(() => {
        this.apply(next);
        this.updateDrawerLabel(next);
        wave.style.transition = 'opacity 0.25s ease';
        wave.style.opacity = '0';
        setTimeout(() => wave.remove(), 250);
      }, 450);

      showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
    }
  };

  // ═══════════════════════════════════════════════════
  //  2. DATA LOADER (Lazy, Cached)
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

  async function ensureArticlesIndex() {
    if (!state.articlesIndex) {
      state.articlesIndex = await loadJSON(ARTICLES_INDEX_PATH);
    }
    return state.articlesIndex;
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
  //  3. STREAK TRACKER
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

      localStorage.setItem(STORAGE_KEYS.streak, '1');
      localStorage.setItem(STORAGE_KEYS.lastVisit, today);
      return 1;
    }
  };

  // ═══════════════════════════════════════════════════
  //  4. SEARCH ENGINE (Zero-Cost Client-Side)
  // ═══════════════════════════════════════════════════
  const SearchEngine = {
    init() {
      const triggerBtn = $('#search-trigger-btn');
      const closeBtn = $('#search-close-btn');
      const searchInput = $('#search-input');
      const searchOverlay = $('#search-overlay');

      if (!triggerBtn || !searchOverlay || !searchInput) return;

      triggerBtn.addEventListener('click', () => this.open());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      searchInput.addEventListener('input', debounce(() => this.search(searchInput.value), 150));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    },

    open() {
      const searchOverlay = $('#search-overlay');
      const searchInput = $('#search-input');
      const triggerBtn = $('#search-trigger-btn');
      if (!searchOverlay) return;
      searchOverlay.classList.add('active');
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
      window.lockScroll();
      setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
      this.showRecent();
    },

    close() {
      const searchOverlay = $('#search-overlay');
      const searchInput = $('#search-input');
      const searchResults = $('#search-results');
      const triggerBtn = $('#search-trigger-btn');
      if (!searchOverlay) return;
      searchOverlay.classList.remove('active');
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
      window.unlockScroll();
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 Type above — results appear instantly</p><div id="recent-searches-container"></div></div>';
    },

    async search(query) {
      const searchResults = $('#search-results');
      if (!searchResults) return;

      if (!query || query.length < 2) {
        this.showRecent();
        return;
      }

      const [dictIndex, articlesIndex] = await Promise.all([
        ensureSearchIndex(),
        ensureArticlesIndex()
      ]);

      if (!dictIndex && !articlesIndex) {
        searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">⚠️ Search index could not be loaded</p></div>';
        return;
      }

      const q = query.toLowerCase().trim();

      // Search articles/chapters
      const articleMatches = articlesIndex ? articlesIndex.filter(item =>
        item.t.toLowerCase().includes(q) || (item.d && item.d.toLowerCase().includes(q))
      ) : [];

      // Search dictionary words (Bug Fix: case-insensitive meaning match)
      const dictMatches = dictIndex ? dictIndex.filter(item =>
        item.w.toLowerCase().includes(q) || (item.m && item.m.toLowerCase().includes(q))
      ) : [];

      // Combine matches: articles first, then dictionary words
      const matches = [...articleMatches.slice(0, 10), ...dictMatches.slice(0, 15)];

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="search-placeholder"><p class="search-hint">😔 No results found for "${escHtml(query)}"</p></div>`;
        return;
      }

      searchResults.innerHTML = matches.map(item => {
        const isArticle = !!item.u;
        const linkHref = isArticle ? item.u : `/dictionary/?cat=${encodeURIComponent(item.s)}`;
        const displayName = isArticle ? item.t : item.w;
        const displayMeaning = isArticle ? (item.d || 'Chapter Notes & Summary') : item.m;
        const displayCategory = isArticle ? item.c : item.s.replace(/_/g, ' ');
        const badgeClass = isArticle ? 'search-result-category article-badge' : 'search-result-category';

        return `
          <a href="${linkHref}" class="search-result-item" style="text-decoration:none; color:inherit;">
            <div>
              <div class="search-result-word">${escHtml(displayName)}</div>
              <div class="search-result-meaning">${escHtml(displayMeaning)}</div>
            </div>
            <span class="${badgeClass}">${escHtml(displayCategory)}</span>
          </a>
        `;
      }).join('');

      searchResults.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const word = el.querySelector('.search-result-word')?.textContent;
          if (word) this.addToRecent(word);
          this.close();
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
      const searchResults = $('#search-results');
      if (!searchResults) return;
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

      const searchInput = $('#search-input');
      searchResults.querySelectorAll('.recent-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          if (searchInput) searchInput.value = tag.dataset.word;
          this.search(tag.dataset.word);
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════
  //  5. HOME PAGE FEATURES
  // ═══════════════════════════════════════════════════
  function initHomePage() {
    const streak = StreakTracker.get();
    const userName = localStorage.getItem(STORAGE_KEYS.userName) || 'Student';
    const timeGreeting = getTimeGreeting();

    const greetingText = $('#hero-greeting-text');
    if (greetingText) {
      greetingText.textContent = `${timeGreeting}, ${userName} 🙏`;
    }
  }

  // ═══════════════════════════════════════════════════
  //  6. DICTIONARY PAGE
  // ═══════════════════════════════════════════════════
  async function initDictionaryPage() {
    const container = $('#dict-app');
    if (!container) return;

    // Get category from URL query param if present
    const urlParams = new URLSearchParams(window.location.search);
    const requestedCategory = urlParams.get('cat');

    container.innerHTML = `
      <div class="loading-screen" style="min-height: 200px;">
        <div class="loader-spinner"></div>
        <p class="loader-text">Loading categories...</p>
      </div>
    `;

    const categories = await ensureCategoriesIndex();

    if (!categories || categories.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: var(--sp-10);">
          <p style="font-size: 2rem; margin-bottom: var(--sp-4);">📦</p>
          <h2>Loading data...</h2>
          <p class="text-secondary" style="margin-top: var(--sp-3);">Categories could not be loaded. Please check your internet connection.</p>
        </div>
      `;
      return;
    }

    const selectedSlug = requestedCategory || categories[0].slug;

    container.innerHTML = `
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
    `;

    $$('#category-chips .category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const slug = chip.dataset.slug;
        $$('#category-chips .category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Update URL without reload
        const newUrl = `/dictionary/?cat=${encodeURIComponent(slug)}`;
        history.replaceState(null, '', newUrl);
        
        loadAndShowWords(slug);
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    loadAndShowWords(selectedSlug);
  }

  // ═══════════════════════════════════════════════════
  //  7. DICTIONARY WORD RENDERING
  // ═══════════════════════════════════════════════════
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

  function parseWord(w) {
    const word = fixMojibake(w.word || w.w || '');
    let rawPron = fixMojibake(w.pronunciation || w.pron || w.p || '');
    const example = fixMojibake(w.example || w.example_en || w.e || w.ex || '');
    const exampleHindi = fixMojibake(w.exampleHindi || w.example_hi || w.ex_hi || '');

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

    return {
      word,
      pron: rawPron,
      meaning: hindiMeaning,
      definition: englishDef,
      example,
      exampleHindi,
      usages: w.usages || null,
      synonyms: w.synonyms || null,
      antonyms: w.antonyms || null,
      collocations: w.collocations || null,
      slug: w.slug || null
    };
  }

  function createWordCard(w, i) {
    const parsed = parseWord(w);
    const card = document.createElement('div');
    card.className = 'word-card';
    card.dataset.index = i;
    
    const meaningPreview = parsed.meaning || (parsed.definition ? parsed.definition.slice(0, 60) + (parsed.definition.length > 60 ? '...' : '') : '');
    
    card.innerHTML = `
      <div class="word-header">
        <div class="word-main">
          <div class="word-en-row">
            <span class="word-en">${escHtml(parsed.word)}</span>
            ${parsed.pron ? `<span class="word-pron">[${escHtml(parsed.pron)}]</span>` : ''}
          </div>
          <div class="word-hi">${escHtml(meaningPreview)}</div>
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

    card.querySelector('.word-speak-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      speakWord(parsed.word);
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.word-speak-btn')) return;
      const isExpanded = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', isExpanded);
      const drawer = card.querySelector('.word-details-drawer');
      if (drawer) {
        if (isExpanded) {
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
        const loadMoreContainer = $('#load-more-container');
        if (loadMoreContainer) loadMoreContainer.remove();
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  8. FLASHCARDS PAGE
  // ═══════════════════════════════════════════════════
  
  function loadFCSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.fcSettings);
      if (saved) {
        state.fcSettings = { ...state.fcSettings, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }
  function saveFCSettings() {
    localStorage.setItem(STORAGE_KEYS.fcSettings, JSON.stringify(state.fcSettings));
  }

  function stopFCAutoPlay() {
    clearTimeout(state.fcTimerXId);
    clearTimeout(state.fcTimerYId);
  }

  function runFCAutoPlay(container, categories, activeSlug) {
    stopFCAutoPlay();
    if (!state.fcSettings.autoPlay) return;

    const flashcard = $('#flashcard');
    if (!flashcard) return;

    // We are on the front face. Wait timerX seconds.
    state.fcTimerXId = setTimeout(() => {
      if (!state.fcSettings.autoPlay) return;
      
      // If user wants to skip flip (fast revision), just go next
      if (state.fcSettings.frontMeaning && state.fcSettings.frontPron) {
         nextFlashcard(container, categories, activeSlug);
      } else {
         // Standard: flip card
         if (!flashcard.classList.contains('flipped')) {
           flashcard.classList.add('flipped');
         }
         // Wait timerY seconds, then go next
         state.fcTimerYId = setTimeout(() => {
            if (!state.fcSettings.autoPlay) return;
            nextFlashcard(container, categories, activeSlug);
         }, state.fcSettings.timerY * 1000);
      }
    }, state.fcSettings.timerX * 1000);
  }

  async function initFlashcardsPage() {
    const container = $('#flashcards-app');
    loadFCSettings();
    if (!container) return;

    // Get category from dataset (pagination) or URL query param if present
    const urlParams = new URLSearchParams(window.location.search);
    const requestedCategory = container.dataset.categorySlug || urlParams.get('cat');

    container.innerHTML = `
      <div class="loading-screen" style="min-height: 200px;">
        <div class="loader-spinner"></div>
      </div>
    `;

    const categories = await ensureCategoriesIndex();
    const slug = requestedCategory || (categories && categories.length > 0 ? categories[0].slug : null);

    if (!slug) {
      container.innerHTML = `<div class="card text-center"><h2>Could not load data</h2></div>`;
      return;
    }

    const words = await loadCategoryWords(slug);
    if (!words || words.length === 0) {
      container.innerHTML = '<div class="card text-center"><p>No words found.</p></div>';
      return;
    }

    const progressData = JSON.parse(localStorage.getItem(STORAGE_KEYS.fcProgress) || '{}');
    const now = Date.now();

    const sortedWords = [...words].sort((a, b) => {
      const pA = progressData[a.word || a.w] || { nextReviewDate: 0 };
      const pB = progressData[b.word || b.w] || { nextReviewDate: 0 };
      const dueA = pA.nextReviewDate <= now ? 0 : pA.nextReviewDate;
      const dueB = pB.nextReviewDate <= now ? 0 : pB.nextReviewDate;
      return dueA - dueB;
    });

    state.fcDeck = shuffleArray(sortedWords);
    state.fcIndex = 0;
    state.fcKnown = 0;

    renderFlashcardUI(container, categories, slug);
  }

  function renderFlashcardUI(container, categories, activeSlug) {
    const total = state.fcDeck.length;
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;

    const parsed = parseWord(current);
    const word = parsed.word;
    const meaning = parsed.meaning;
    const definition = parsed.definition;
    const example = parsed.example;
    const pron = parsed.pron;
    const itemSlug = parsed.slug || word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const imageHtml = `<img src="/assets/images/flashcards/${itemSlug}.webp" alt="${escHtml(word)}" class="flashcard-image" onerror="this.style.display='none'" style="max-width: 140px; max-height: 140px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); object-fit: cover;">`;

    const timerOptions = (val) => Array.from({length: 30}, (_, i) => i + 1).map(n => `<option value="${n}" ${val == n ? 'selected' : ''}>${n}s</option>`).join('');

    const settingsModalHtml = `
      <div id="fc-settings-modal" class="modal" style="display:none; position:absolute; top:40px; right:0; background:var(--bg-card); border:1px solid var(--border); padding:var(--sp-4); border-radius:8px; z-index:100; box-shadow:0 10px 25px rgba(0,0,0,0.2); width:280px; text-align:left;">
        <h3 style="margin-top:0; margin-bottom:12px; font-size:1.1rem; display:flex; justify-content:space-between; color:var(--text-main);">Flashcard Settings <button id="fc-close-settings" style="background:none; border:none; cursor:pointer; color:var(--text-main);">✕</button></h3>
        <div style="display:flex; flex-direction:column; gap:12px; color:var(--text-main);">
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Pronunciation (Front)
            <input type="checkbox" id="set-front-pron" ${state.fcSettings.frontPron ? 'checked' : ''}>
          </label>
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Hindi Meaning (Front)
            <input type="checkbox" id="set-front-meaning" ${state.fcSettings.frontMeaning ? 'checked' : ''}>
          </label>
          <hr style="border:none; border-top:1px solid var(--border); margin:0;">
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Extra Details (Back)
            <input type="checkbox" id="set-back-advanced" ${state.fcSettings.backAdvanced !== false ? 'checked' : ''}>
          </label>
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Synonyms (Back)
            <input type="checkbox" id="set-back-synonyms" ${state.fcSettings.backSynonyms !== false ? 'checked' : ''}>
          </label>
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Antonyms (Back)
            <input type="checkbox" id="set-back-antonyms" ${state.fcSettings.backAntonyms !== false ? 'checked' : ''}>
          </label>
          <label style="display:flex; justify-content:space-between; align-items:center;">
            Show Collocations (Back)
            <input type="checkbox" id="set-back-collocations" ${state.fcSettings.backCollocations !== false ? 'checked' : ''}>
          </label>
          <hr style="border:none; border-top:1px solid var(--border); margin:0;">
          <label style="display:flex; justify-content:space-between; align-items:center;">
            <strong>Use Custom Intervals</strong>
            <input type="checkbox" id="set-custom-srs" ${state.fcSettings.customSRS ? 'checked' : ''}>
          </label>
          <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center; text-align: center;">
            <label style="display:flex; flex-direction:column; font-size: 0.85rem;">Hard (days)<input type="number" id="set-interval-hard" value="${state.fcSettings.intervalHard}" style="width:50px; text-align:center; border:1px solid var(--border); background:var(--bg-footer); color:var(--text-main); border-radius:4px; margin-top: 4px;"></label>
            <label style="display:flex; flex-direction:column; font-size: 0.85rem;">Good (days)<input type="number" id="set-interval-good" value="${state.fcSettings.intervalGood}" style="width:50px; text-align:center; border:1px solid var(--border); background:var(--bg-footer); color:var(--text-main); border-radius:4px; margin-top: 4px;"></label>
            <label style="display:flex; flex-direction:column; font-size: 0.85rem;">Easy (days)<input type="number" id="set-interval-easy" value="${state.fcSettings.intervalEasy}" style="width:50px; text-align:center; border:1px solid var(--border); background:var(--bg-footer); color:var(--text-main); border-radius:4px; margin-top: 4px;"></label>
          </div>
          <hr style="border:none; border-top:1px solid var(--border); margin:0;">
          <div>
            <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              AutoPlay Timer (Front)
              <select id="set-timer-x" style="width:70px; text-align:center; padding:2px; border:1px solid var(--border); background:var(--bg-footer); color:var(--text-main); border-radius:4px; cursor:pointer;">
                ${timerOptions(state.fcSettings.timerX)}
              </select>
            </label>
          </div>
          <div>
            <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              AutoPlay Timer (Back)
              <input type="number" id="set-timer-y" value="${state.fcSettings.timerY}" style="width:50px; text-align:center; border:1px solid var(--border); background:var(--bg-footer); color:var(--text-main); border-radius:4px;">
            </label>
            <div style="font-size:0.8rem; color:var(--text-secondary); text-align:right;">seconds</div>
          </div>
          <button id="fc-save-settings" class="fc-btn" style="background:var(--accent); color:white; margin-top:8px;">Save Settings</button>
        </div>
      </div>
    `;

    let categoriesHtml = '';
    if (categories) {
      const mainGroups = {};
      categories.forEach(c => {
        const main = c.mainCategory || 'Other Categories';
        const sub = c.subCategory || 'General';
        if (!mainGroups[main]) mainGroups[main] = {};
        if (!mainGroups[main][sub]) mainGroups[main][sub] = [];
        mainGroups[main][sub].push(c);
      });
      
      const activeCat = categories.find(c => c.slug === activeSlug);
      const activeName = activeCat ? activeCat.name : activeSlug;

      categoriesHtml += `<div class="fc-category-accordion" id="fc-category-chips" style="margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">`;
      categoriesHtml += `<details style="background: var(--bg-card);">
        <summary style="padding: 12px; font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none;">
          <span>📚 Category: <span style="color:var(--accent);">${escHtml(activeName)}</span></span>
          <span style="font-size: 0.9rem; color: var(--text-secondary);">Change ▼</span>
        </summary>
        <div style="max-height: 350px; overflow-y: auto; background: var(--bg-body); border-top: 1px solid var(--border);">`;

      for (const mainName in mainGroups) {
        categoriesHtml += `<details style="border-bottom: 1px solid var(--border);">
          <summary style="padding: 10px 16px; font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); user-select: none;">
            <span>📁 ${mainName}</span>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">▼</span>
          </summary>
          <div style="padding: 0; background: var(--bg-footer);">`;
          
        for (const subName in mainGroups[mainName]) {
          categoriesHtml += `<details style="border-top: 1px solid var(--border);">
            <summary style="padding: 8px 16px 8px 24px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none;">
              <span>📂 ${subName}</span>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">▼</span>
            </summary>
            <div style="padding: 12px 16px 12px 24px; display: flex; flex-wrap: wrap; gap: 8px; background: var(--bg-card); border-top: 1px solid var(--border);">`;
            
          mainGroups[mainName][subName].forEach(c => {
            const isActive = c.slug === activeSlug;
            categoriesHtml += `<button class="category-chip${isActive ? ' active' : ''}" data-slug="${escHtml(c.slug)}" style="margin: 0;">
              ${c.icon || '📄'} ${escHtml(c.name)}
            </button>`;
          });
          
          categoriesHtml += `</div></details>`;
        }
        categoriesHtml += `</div></details>`;
      }
      categoriesHtml += `</div></details></div>
      <style>
        .fc-category-accordion details > summary::-webkit-details-marker { display: none; }
        .fc-category-accordion details[open] > summary > span:last-child { transform: rotate(180deg); }
        .fc-category-accordion details summary span { transition: transform 0.3s ease; }
      </style>`;
    }

    container.innerHTML = `
      <div class="animate-fade-in">
        ${categoriesHtml}

        <div class="flashcard-container" style="position: relative; display: flex; flex-direction: column; align-items: center;">
          ${settingsModalHtml}
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 480px; margin-bottom: 8px;">
            <div class="flashcard-progress" style="flex: 1; margin: 0; padding-right: 12px;">
              <div class="progress-bar-track" style="margin-bottom: 0;">
                <div class="progress-bar-fill" style="width: ${((state.fcIndex) / total) * 100}%"></div>
              </div>
            </div>
            <span class="progress-text" style="margin-right: 12px; font-size: 0.9rem;">${state.fcIndex + 1}/${total}</span>
            <div style="display: flex; gap: 12px; align-items: center;">
              <label style="display: flex; align-items: center; gap: 4px; font-size: 0.9rem; cursor: pointer;">
                <input type="checkbox" id="fc-autoplay-toggle" ${state.fcSettings.autoPlay ? 'checked' : ''}>
                Auto
              </label>
              <button id="fc-settings-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;" aria-label="Settings">⚙️</button>
            </div>
          </div>
          <div style="display:none;" class="flashcard-progress" style="width: 100%; max-width: 480px;">
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
                      ${imageHtml}
                      <div class="flashcard-word">${escHtml(word)}</div>
                      
   <div class="flashcard-devanagari-pron" style="display: ${state.fcSettings.frontPron && pron ? 'block' : 'none'};">${pron ? escHtml(pron) : ''}</div>
   <div class="flashcard-devanagari-meaning" style="font-size: 1.2rem; color: var(--accent); margin-top: var(--sp-2); font-weight: bold; display: ${state.fcSettings.frontMeaning && meaning ? 'block' : 'none'};">${meaning ? escHtml(meaning) : ''}</div>

                      <div class="flashcard-hint flashcard-tap-hint" style="margin-top: var(--sp-4); opacity: 0.6;">👆 Tap to reveal</div>
                    </div>
                  </div>
                </div>
                <div class="flashcard-face flashcard-back">
                  <div class="flashcard-scroll-container" style="width: 100%; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: var(--sp-4) var(--sp-2);">
                    <div class="flashcard-content-wrapper" style="margin: auto 0; display: flex; flex-direction: column; align-items: center; width: 100%; text-align: center;">
                      ${definition ? `<div class="flashcard-definition" style="font-size: 1.05rem; font-weight: 500; color: var(--text-color); margin-bottom: var(--sp-4);">${escHtml(definition)}</div>` : ''}
                      
                      <div class="flashcard-word" style="font-size: 1.8rem; font-weight: 800; color: var(--text-color);">${escHtml(word)}</div>
                      ${pron ? `<div class="flashcard-devanagari-pron" style="font-size: 1.1rem; color: var(--text-secondary); margin-top: var(--sp-1);">${escHtml(pron)}</div>` : ''}
                      ${meaning ? `<div class="flashcard-devanagari-meaning" style="font-size: 1.2rem; color: var(--accent); margin-top: var(--sp-2); font-weight: bold;">${escHtml(meaning)}</div>` : ''}
                      
                      ${example ? `<div class="flashcard-example" style="font-size: 1rem; font-style: italic; color: var(--text-secondary); margin-top: var(--sp-5); padding-left: 12px; border-left: 3px solid var(--accent-soft);">"${escHtml(example)}"</div>` : ''}
                      ${parsed.exampleHindi ? `<div class="flashcard-example-hi" style="font-size: 0.95rem; font-style: normal; color: var(--text-secondary); margin-top: var(--sp-2); padding-left: 12px; border-left: 3px solid var(--accent-soft); opacity: 0.8;">${escHtml(parsed.exampleHindi)}</div>` : ''}
                      
                      <div class="flashcard-advanced-info" style="width:100%; text-align:left; margin-top:var(--sp-4); display:none;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="flashcard-nav-arrow right" id="fc-next-arrow" aria-label="Next Word">→</button>
          </div>

          <div class="flashcard-controls" style="width: 100%; max-width: 480px; gap: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr;">
            <button class="fc-btn" id="fc-hard" style="background: var(--bg-card); color: #ef4444; border: 1px solid #ef4444; font-size: 0.9rem; padding: 8px 4px;">🔴 याद नहीं है<br><span style="font-size: 0.75rem; opacity: 0.8;">(${state.fcSettings.customSRS ? (state.fcSettings.intervalHard === 0 ? 'Today' : state.fcSettings.intervalHard + 'd') : 'Again'})</span></button>
            <button class="fc-btn" id="fc-good" style="background: var(--bg-card); color: #eab308; border: 1px solid #eab308; font-size: 0.9rem; padding: 8px 4px;">🟡 थोड़ा याद है<br><span style="font-size: 0.75rem; opacity: 0.8;">(${state.fcSettings.customSRS ? (state.fcSettings.intervalGood === 0 ? 'Today' : state.fcSettings.intervalGood + 'd') : 'Soon'})</span></button>
            <button class="fc-btn" id="fc-easy" style="background: var(--bg-card); color: #22c55e; border: 1px solid #22c55e; font-size: 0.9rem; padding: 8px 4px;">🟢 याद हो गया<br><span style="font-size: 0.75rem; opacity: 0.8;">(${state.fcSettings.customSRS ? (state.fcSettings.intervalEasy === 0 ? 'Today' : state.fcSettings.intervalEasy + 'd') : 'Later'})</span></button>
          </div>
          <div style="width: 100%; max-width: 480px; margin-top: 8px;">
            <button class="fc-btn" id="fc-speak" style="background: var(--accent-soft); color: var(--accent); width: 100%;">🔊 Listen Pronunciation</button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    const settingsBtn = $('#fc-settings-btn');
    const settingsModal = $('#fc-settings-modal');
    const settingsCloseBtn = $('#fc-close-settings');
    const settingsSaveBtn = $('#fc-save-settings');
    const autoPlayToggle = $('#fc-autoplay-toggle');
    
    let lastSettingsFocus = null;
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => {
        lastSettingsFocus = document.activeElement;
        settingsModal.style.display = 'flex';
        stopFCAutoPlay();
      });
      const saveAndClose = () => {
        state.fcSettings.frontPron = $('#set-front-pron').checked;
        state.fcSettings.frontMeaning = $('#set-front-meaning').checked;
        state.fcSettings.backAdvanced = $('#set-back-advanced').checked;
        state.fcSettings.backSynonyms = $('#set-back-synonyms').checked;
        state.fcSettings.backAntonyms = $('#set-back-antonyms').checked;
        state.fcSettings.backCollocations = $('#set-back-collocations').checked;
        state.fcSettings.timerX = parseInt($('#set-timer-x').value) || 3;
        state.fcSettings.timerY = parseInt($('#set-timer-y').value) || 4;
        state.fcSettings.customSRS = $('#set-custom-srs').checked;
        state.fcSettings.intervalHard = parseInt($('#set-interval-hard').value) || 0;
        state.fcSettings.intervalGood = parseInt($('#set-interval-good').value) || 0;
        state.fcSettings.intervalEasy = parseInt($('#set-interval-easy').value) || 0;
        saveFCSettings();
        settingsModal.style.display = 'none';
        if (lastSettingsFocus) lastSettingsFocus.focus();
        renderFlashcardUI(container, categories, activeSlug); // Re-render to apply
      };
      if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', saveAndClose);
      if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', saveAndClose);
    }
    
    if (autoPlayToggle) {
      autoPlayToggle.addEventListener('change', (e) => {
        state.fcSettings.autoPlay = e.target.checked;
        saveFCSettings();
        if (state.fcSettings.autoPlay) {
          runFCAutoPlay(container, categories, activeSlug);
        } else {
          stopFCAutoPlay();
        }
      });
    }

    // Trigger AutoPlay if ON
    if (state.fcSettings.autoPlay) {
      runFCAutoPlay(container, categories, activeSlug);
    }

    const flashcard = $('#flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => {
        stopFCAutoPlay(); // Manual flip stops autoplay timer
        if (state.fcTransitioning) return;
        flashcard.classList.toggle('flipped');
      });
    }

    const hardBtn = $('#fc-hard');
    const goodBtn = $('#fc-good');
    const easyBtn = $('#fc-easy');
    const speakBtn = $('#fc-speak');
    const prevArrow = $('#fc-prev-arrow');
    const nextArrow = $('#fc-next-arrow');

    if (hardBtn) hardBtn.addEventListener('click', () => processFlashcardResponse(container, categories, activeSlug, 1));
    if (goodBtn) goodBtn.addEventListener('click', () => processFlashcardResponse(container, categories, activeSlug, 3));
    if (easyBtn) easyBtn.addEventListener('click', () => processFlashcardResponse(container, categories, activeSlug, 5));
    
    if (prevArrow) {
      prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        prevFlashcard(container, categories, activeSlug);
      });
    }

    if (nextArrow) {
      nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        nextFlashcard(container, categories, activeSlug, false);
      });
    }

    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const curr = state.fcDeck[state.fcIndex];
        if (curr) speakWord(parseWord(curr).word);
      });
    }

    if (categories) {
      $$('#fc-category-chips .category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          window.location.href = `/flashcards/${chip.dataset.slug}/`;
        });
      });
    }
  }

  function updateCardContent(container, categories, activeSlug) {
    const total = state.fcDeck.length;
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;

    const parsed = parseWord(current);

    const scrollContainers = $$('.flashcard-scroll-container');
    scrollContainers.forEach(c => { c.scrollTop = 0; });

    const progressFill = $('.progress-bar-fill');
    if (progressFill) progressFill.style.width = `${((state.fcIndex) / total) * 100}%`;

    const progressText = $('.progress-text');
    if (progressText) progressText.textContent = `${state.fcIndex + 1}/${total}`;

    const frontWord = $('.flashcard-front .flashcard-word');
    if (frontWord) frontWord.textContent = parsed.word;
    
        const frontPron = $('.flashcard-front .flashcard-devanagari-pron');
    if (frontPron) {
      if (parsed.pron) {
        frontPron.textContent = parsed.pron;
        frontPron.style.display = state.fcSettings.frontPron ? 'block' : 'none';
      } else {
        frontPron.style.display = 'none';
      }
    }
    const frontMeaning = $('.flashcard-front .flashcard-devanagari-meaning');
    if (frontMeaning) {
      if (parsed.meaning) {
        frontMeaning.textContent = parsed.meaning;
        frontMeaning.style.display = state.fcSettings.frontMeaning ? 'block' : 'none';
      } else {
        frontMeaning.style.display = 'none';
      }
    }
    
    // Also update image
    const frontImage = $('.flashcard-front .flashcard-image');
    if (frontImage) {
      const itemSlug = parsed.slug || parsed.word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      frontImage.src = `/assets/images/flashcards/${itemSlug}.webp`;
      frontImage.alt = parsed.word;
      frontImage.style.display = 'block'; // reset in case previous was hidden via onerror
    }


    const backDefinition = $('.flashcard-back .flashcard-definition');
    const backWord = $('.flashcard-back .flashcard-word');
    if (backWord) backWord.textContent = parsed.word;
    
    const backPron = $('.flashcard-back .flashcard-devanagari-pron');
    if (backPron) {
      if (parsed.pron) {
        backPron.textContent = parsed.pron;
        backPron.style.display = 'block';
      } else {
        backPron.style.display = 'none';
      }
    }

    const backMeaning = $('.flashcard-back .flashcard-devanagari-meaning');
    if (backMeaning) {
      if (parsed.meaning) {
        backMeaning.textContent = parsed.meaning;
        backMeaning.style.display = 'block';
      } else {
        backMeaning.style.display = 'none';
      }
    }

    const backExample = $('.flashcard-back .flashcard-example');
    const backExampleHi = $('.flashcard-back .flashcard-example-hi');

    const advancedInfo = $('.flashcard-back .flashcard-advanced-info');
    if (advancedInfo) {
      let advHtml = '';
      if (state.fcSettings.backAdvanced !== false && parsed.usages && parsed.usages.length > 0) {
        advHtml += parsed.usages.map(u => `
          <div style="margin-top:12px;">
            <div style="font-size:0.9rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase;"><span style="background:var(--bg-footer); padding:2px 6px; border-radius:4px;">${escHtml(u.partOfSpeech)}</span></div>
            <div style="font-size:1.05rem; margin-top:4px;">${escHtml(u.definition)}</div>
            ${u.examples ? `<div style="margin-top:6px;">${u.examples.map(ex => `
              <div style="font-style:italic; font-size:0.95rem; color:var(--text-secondary); border-left:2px solid var(--accent-soft); padding-left:8px; margin-bottom:4px;">"${escHtml(ex.en)}"<br><span style="font-style:normal; font-size:0.85rem; opacity:0.8;">${escHtml(ex.hi)}</span></div>
            `).join('')}</div>` : ''}
          </div>
        `).join('');
      }
      if (state.fcSettings.backSynonyms !== false && parsed.synonyms && parsed.synonyms.length > 0) {
        advHtml += `<div style="margin-top:12px; font-size:0.9rem;"><strong style="color:var(--text-secondary); text-transform:uppercase;">Synonyms:</strong><br>${escHtml(parsed.synonyms.join(', '))}</div>`;
      }
      if (state.fcSettings.backAntonyms !== false && parsed.antonyms && parsed.antonyms.length > 0) {
        advHtml += `<div style="margin-top:12px; font-size:0.9rem;"><strong style="color:var(--text-secondary); text-transform:uppercase;">Antonyms:</strong><br>${escHtml(parsed.antonyms.join(', '))}</div>`;
      }
      if (state.fcSettings.backCollocations !== false && parsed.collocations && parsed.collocations.length > 0) {
        advHtml += `<div style="margin-top:12px; font-size:0.9rem;"><strong style="color:var(--text-secondary); text-transform:uppercase;">Collocations:</strong><br>${escHtml(parsed.collocations.join(', '))}</div>`;
      }

      advancedInfo.innerHTML = advHtml;
      advancedInfo.style.display = advHtml ? 'block' : 'none';

      // Visibility toggles for older fallback format
      if (backDefinition) backDefinition.style.display = advHtml ? 'none' : (parsed.definition ? 'block' : 'none');
      if (backExample) backExample.style.display = advHtml ? 'none' : (parsed.example ? 'block' : 'none');
      if (backExampleHi) backExampleHi.style.display = advHtml ? 'none' : (parsed.exampleHindi ? 'block' : 'none');
      
      // Update text for older format
      if (!advHtml && backDefinition && parsed.definition) backDefinition.textContent = parsed.definition;
      if (!advHtml && backExample && parsed.example) backExample.textContent = `"${parsed.example}"`;
      if (!advHtml && backExampleHi && parsed.exampleHindi) backExampleHi.textContent = parsed.exampleHindi;
    } else {
      // Standard fallback behavior if container not present
      if (backDefinition) {
        if (parsed.definition) {
          backDefinition.textContent = parsed.definition;
          backDefinition.style.display = 'block';
        } else {
          backDefinition.style.display = 'none';
        }
      }
      if (backExample) {
        if (parsed.example) {
          backExample.textContent = `"${parsed.example}"`;
          backExample.style.display = 'block';
        } else {
          backExample.style.display = 'none';
        }
      }
    }
  }

  
  function prevFlashcard(container, categories, activeSlug) {
    stopFCAutoPlay();

    if (state.fcTransitioning || state.fcIndex <= 0) return;
    state.fcIndex--;
    const cardEl = $('#flashcard');
    if (cardEl) {
      state.fcTransitioning = true;
      cardEl.classList.remove('flipped');
      cardEl.classList.add('swipe-left');
      setTimeout(() => {
        updateCardContent(container, categories, activeSlug);
        cardEl.classList.remove('swipe-left');
        cardEl.classList.add('swipe-in-left');
        cardEl.offsetHeight;
        cardEl.classList.remove('swipe-in-left');
        state.fcTransitioning = false;
      }, 150);
    } else {
      updateCardContent(container, categories, activeSlug);
    }
  }

  function processFlashcardResponse(container, categories, activeSlug, quality) {
    if (state.fcTransitioning) return;
    
    const current = state.fcDeck[state.fcIndex];
    if (!current) return;
    
    const parsed = parseWord(current);
    const wordKey = parsed.word;
    
    const progressData = JSON.parse(localStorage.getItem(STORAGE_KEYS.fcProgress) || '{}');
    const p = progressData[wordKey] || { interval: 0, repetitions: 0, easeFactor: 2.5 };
    
    let easeFactor = p.easeFactor;
    let interval = 0;
    let repetitions = p.repetitions;
    
    if (state.fcSettings.customSRS) {
      if (quality === 1) interval = state.fcSettings.intervalHard;
      else if (quality === 3) interval = state.fcSettings.intervalGood;
      else if (quality === 5) interval = state.fcSettings.intervalEasy;
      
      // Update repetitions for general tracking
      if (quality < 3) repetitions = 0;
      else repetitions++;
      
    } else {
      easeFactor = p.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;
      
      if (quality < 3) {
        repetitions = 0;
        interval = 1;
      } else {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(p.interval * easeFactor);
        repetitions++;
      }
    }
    
    progressData[wordKey] = {
      interval,
      repetitions,
      easeFactor,
      nextReviewDate: interval === 0 ? 0 : (Date.now() + interval * 86400000)
    };
    
    localStorage.setItem(STORAGE_KEYS.fcProgress, JSON.stringify(progressData));
    
    // If interval is 0, add to end of deck so it repeats in this session
    if (interval === 0) {
      state.fcDeck.push(current);
    }
    
    nextFlashcard(container, categories, activeSlug, true);
  }

  function nextFlashcard(container, categories, activeSlug, known) {
    if (state.fcTransitioning) return;
    if (known) state.fcKnown++;
    
    const cardEl = $('#flashcard');
    if (!cardEl) {
      state.fcIndex++;
      if (state.fcIndex >= state.fcDeck.length) {
        renderFlashcardResult(container, categories, activeSlug);
      } else {
        renderFlashcardUI(container, categories, activeSlug);
      }
      return;
    }
    
    state.fcTransitioning = true;
    const swipeClass = known ? 'swipe-right' : 'swipe-left';
    cardEl.classList.add(swipeClass);
    
    setTimeout(() => {
      state.fcIndex++;
      if (state.fcIndex >= state.fcDeck.length) {
        renderFlashcardResult(container, categories, activeSlug);
        state.fcTransitioning = false;
        return;
      }
      
      updateCardContent(container, categories, activeSlug);
      cardEl.classList.remove('flipped');
      cardEl.classList.remove(swipeClass);
      
      const slideInClass = known ? 'swipe-in-left' : 'swipe-in-right';
      cardEl.classList.add(slideInClass);
      cardEl.offsetHeight;
      cardEl.classList.remove(slideInClass);
      state.fcTransitioning = false;
      
      if (state.fcSettings.autoPlay) {
        runFCAutoPlay(container, categories, activeSlug);
      }
    }, 350);
  }

  function renderFlashcardResult(container, categories, activeSlug) {
    container.innerHTML = `
      <div class="animate-fade-in flashcard-container" style="padding-top: var(--sp-12);">
        <div class="card text-center" style="padding: var(--sp-10);">
          <p style="font-size: 3rem; margin-bottom: var(--sp-4);">🎉</p>
          <h2>Well Done!</h2>
          <p class="text-secondary" style="margin-top: var(--sp-3); font-size: 1.1rem;">
            You remembered <strong>${state.fcKnown}</strong> out of <strong>${state.fcDeck.length}</strong> words!
          </p>
          <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-3); justify-content: center; flex-wrap: wrap;">
            <a href="/flashcards/?cat=${encodeURIComponent(activeSlug)}" class="fc-btn fc-btn-know" style="text-decoration:none;">🔄 Retry</a>
            <a href="/flashcards/" class="fc-btn fc-btn-skip" style="text-decoration:none;">📂 Other Category</a>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════
  //  9. CONTACT FORM → WHATSAPP
  // ═══════════════════════════════════════════════════
  function initContactForm() {
    const contactForm = $('#contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameEl = $('#contact-name');
      const emailEl = $('#contact-email');
      const categoryEl = $('#contact-category');
      const messageEl = $('#contact-message');

      const name = nameEl ? nameEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      const category = categoryEl ? categoryEl.value : 'General';
      const message = messageEl ? messageEl.value.trim() : '';

      if (!name || !message) {
        showToast('⚠️ कृपया नाम और संदेश भरें!');
        return;
      }

      // Build structured WhatsApp message (plain-text safe)
      const waMessage = [
        '*New Contact - EnglishVidya.com*',
        '----------------------------',
        '*Name:* ' + name,
        email ? '*Email:* ' + email : '',
        '*Subject:* ' + category,
        '',
        '*Message:*',
        message,
        '----------------------------',
        'Sent from EnglishVidya.com'
      ].filter(Boolean).join('\n');

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

      // Show success state
      const formContainer = contactForm.closest('.contact-form-section') || contactForm.parentElement;
      if (formContainer) {
        formContainer.innerHTML = `
          <div class="text-center animate-fade-in" style="padding: var(--sp-6);">
            <p style="font-size: 3.5rem; margin-bottom: var(--sp-4);">🎉</p>
            <h2 style="color: var(--accent); margin-bottom: var(--sp-2);">Message Ready!</h2>
            <p class="text-secondary" style="font-size: 1.02rem; line-height: 1.5;">
              Hello <strong>${escHtml(name)}</strong>, आपका संदेश तैयार है। WhatsApp पर भेजने के लिए नीचे बटन दबाएँ।
            </p>
            <div style="margin-top: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-3);">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
                 style="background: #25D366; color: #fff; font-size: 1rem; padding: 14px; display: block; border-radius: 12px; font-weight: 700; text-align:center; text-decoration:none;">
                💬 WhatsApp पर भेजें
              </a>
              <a href="/" style="padding: 12px; border-radius: 8px; text-align:center; text-decoration:none; color:var(--text-secondary); border:1px solid var(--border); display:block;">
                🏠 Home पर जाएँ
              </a>
            </div>
          </div>
        `;
      }

      showToast('✅ WhatsApp खुलने वाला है!');

      // Also open WhatsApp immediately
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 300);
    });
  }

  // ═══════════════════════════════════════════════════
  //  10. SPEECH SYNTHESIS (Pronunciation)
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
  //  11. SCROLL PROGRESS
  // ═══════════════════════════════════════════════════
  function initScrollProgress() {
    const scrollProgress = $('#scroll-progress');
    if (!scrollProgress) return;
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      scrollProgress.style.width = progress + '%';
    }, { passive: true });
  }

  // ═══════════════════════════════════════════════════
  //  12. TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════
  function showToast(message, duration = 2500) {
    const toastContainer = $('#toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">💬</span><span>${escHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // ═══════════════════════════════════════════════════
  //  13. UTILITY FUNCTIONS
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

  // ══════════════════════════════════════════════════════════════
  //  15. PWA INSTALL PROMPT
  // ══════════════════════════════════════════════════════════════
  function initPWA() {
    let deferredPrompt;
    const installBanner = $('#pwa-install-banner');
    const installBtn = $('#pwa-install-btn');
    const drawerAction = $('#drawer-pwa-action');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
      if (drawerAction) {
        drawerAction.style.display = 'block';
        drawerAction.innerHTML = '📱 App Installed ✓';
        drawerAction.style.color = 'var(--text-tertiary)';
        drawerAction.disabled = true;
      }
    } else {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show banner 
        if (installBanner) installBanner.style.display = 'flex'; // It's a flex container
        // Drawer action is already block by default, we can update text just in case
        if (drawerAction) drawerAction.innerHTML = '📱 Install App';
      });
    }

    const handleInstall = async () => {
      if (!deferredPrompt) {
        // Fallback if browser doesn't support or prompt isn't ready
        alert("App install is either not supported on this browser (like iOS/Safari), or it's already installed. On iPhone, use Share -> Add to Home Screen.");
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        if (installBanner) installBanner.style.display = 'none';
        if (drawerAction) {
          drawerAction.innerHTML = '📱 App Installed ✓';
          drawerAction.style.color = 'var(--text-tertiary)';
          drawerAction.disabled = true;
        }
      }
    };

    if (installBtn) installBtn.addEventListener('click', handleInstall);
    if (drawerAction) drawerAction.addEventListener('click', handleInstall);
  }

  // ═══════════════════════════════════════════════════
  //  14. MOBILE DRAWER
  // ═══════════════════════════════════════════════════
  function initMobileDrawer() {
    const menuTrigger = $('#mobile-menu-trigger');
    const drawerOverlay = $('#mobile-drawer-overlay');
    const drawerClose = $('#mobile-drawer-close');
    const drawer = $('#mobile-drawer');

    if (!menuTrigger || !drawerOverlay || !drawerClose || !drawer) return;

    // Accessibility focus trap setup
    const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    let focusableElements = [];
    let firstFocusableElement;
    let lastFocusableElement;
    let previousActiveElement;

    const trapTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            e.preventDefault();
            lastFocusableElement.focus();
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement) {
            e.preventDefault();
            firstFocusableElement.focus();
          }
        }
      } else if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    const openDrawer = () => {
      drawerOverlay.classList.remove('hidden');
      setTimeout(() => drawer.classList.remove('-translate-x-full'), 10);
      window.lockScroll();
      menuTrigger.setAttribute('aria-expanded', 'true');
      
      previousActiveElement = document.activeElement;
      focusableElements = Array.from(drawer.querySelectorAll(focusableElementsString));
      if (focusableElements.length > 0) {
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];
        setTimeout(() => firstFocusableElement.focus(), 100);
      }
      drawer.addEventListener('keydown', trapTabKey);
    };
    
    const closeDrawer = () => {
      drawer.classList.add('-translate-x-full');
      setTimeout(() => drawerOverlay.classList.add('hidden'), 300);
      window.unlockScroll();
      menuTrigger.setAttribute('aria-expanded', 'false');
      drawer.removeEventListener('keydown', trapTabKey);
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };

    menuTrigger.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', (e) => {
      if (!e.target.closest('#mobile-drawer')) {
        closeDrawer();
      }
    });
    
    $$('.mobile-drawer-link').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }



  function initExpandableSections() {
    $$('.section-toggle').forEach(toggle => {
      const isExpanded = toggle.classList.contains('expanded') || toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', isExpanded);
      toggle.addEventListener('click', () => {
        const currentlyExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !currentlyExpanded);
        const targetId = toggle.getAttribute('aria-controls');
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) target.classList.toggle('expanded', !currentlyExpanded);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  16. PAGE DETECTION & INITIALIZATION
  // ═══════════════════════════════════════════════════
  function detectAndInitPage() {
    const path = window.location.pathname;

    // Home page
    if (path === '/' || path === '/index.html') {
      initHomePage();
    }

    // Dictionary page
    if (path.startsWith('/dictionary')) {
      initDictionaryPage();
    }

    // Flashcards page
    if (path.startsWith('/flashcards')) {
      initFlashcardsPage();
    }

    // Contact page
    if (path.startsWith('/contact')) {
      initContactForm();
    }

    // Record activity on every page visit
    if (typeof window.recordActivity === 'function') {
      window.recordActivity(1);
    }
  }

  // ═══════════════════════════════════════════════════
  //  17. MAIN INIT
  // ═══════════════════════════════════════════════════
  function init() {
    // Global features (work on every page)
    ThemeManager.init();
    SearchEngine.init();
    initScrollProgress();
    initMobileDrawer();
    initExpandableSections();
    initPWA();

    // Page-specific features
    detectAndInitPage();

    // Pre-load search indices in background
    setTimeout(() => {
      ensureSearchIndex();
      ensureArticlesIndex();
    }, 2000);
  }

  // Boot Application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// --- Article Audio Player ---
(function initAudioPlayer() {
  const playBtn = document.getElementById('audio-play-btn');
  const stopBtn = document.getElementById('audio-stop-btn');
  const voiceSelect = document.getElementById('audio-voice-select');
  const speedSelect = document.getElementById('audio-speed-select');
  const statusText = document.getElementById('audio-status');
  
  if (!playBtn) return; // Not on an article page
  
  let synth = window.speechSynthesis;
  let voices = [];
  let isPlaying = false;
  let isPaused = false;
  
  function populateVoices() {
    voices = synth.getVoices();
    // Filter for English and Hindi if available
    let preferredVoices = voices.filter(v => v.lang.startsWith('hi') || v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
    if (preferredVoices.length === 0) preferredVoices = voices;
    
    voiceSelect.innerHTML = '';
    preferredVoices.forEach((voice, i) => {
      let option = document.createElement('option');
      option.textContent = `${voice.name} (${voice.lang})`;
      option.setAttribute('data-name', voice.name);
      voiceSelect.appendChild(option);
    });
  }
  
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoices;
  }
  populateVoices();
  
  function getTextToRead() {
    // We want to read the article content, avoiding code blocks or hidden stuff
    const contentDiv = document.querySelector('.markdown-content');
    if (!contentDiv) return '';
    
    // Create a clone to remove unwanted elements before reading
    const clone = contentDiv.cloneNode(true);
    
    // Remove the audio player UI itself and share section if inside
    const shareSec = clone.querySelector('.share-article-section');
    if (shareSec) shareSec.remove();
    const audioWrapper = clone.querySelector('.audio-player-wrapper');
    if(audioWrapper) audioWrapper.remove();
    
    return clone.innerText || clone.textContent;
  }
  
  function startPlaying() {
    synth.cancel(); // clear queue
    const text = getTextToRead();
    if (!text.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoiceName = voiceSelect.options[voiceSelect.selectedIndex]?.getAttribute('data-name');
    if (selectedVoiceName) {
      utterance.voice = voices.find(v => v.name === selectedVoiceName);
    }
    
    utterance.rate = parseFloat(speedSelect.value);
    
    utterance.onend = () => {
      isPlaying = false;
      isPaused = false;
      updateUI();
    };
    
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      isPlaying = false;
      isPaused = false;
      updateUI();
    };
    
    synth.speak(utterance);
    isPlaying = true;
    isPaused = false;
    updateUI();
  }
  
  function updateUI() {
    const iconPlay = playBtn.querySelector('.icon-play');
    const iconPause = playBtn.querySelector('.icon-pause');
    const btnText = playBtn.querySelector('.btn-text');
    
    if (isPlaying && !isPaused) {
      playBtn.classList.add('playing');
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      btnText.textContent = 'Pause';
      stopBtn.disabled = false;
      statusText.textContent = 'Playing article audio...';
      statusText.classList.add('active');
    } else if (isPlaying && isPaused) {
      playBtn.classList.remove('playing');
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      btnText.textContent = 'Resume';
      stopBtn.disabled = false;
      statusText.textContent = 'Audio paused.';
    } else {
      playBtn.classList.remove('playing');
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      btnText.textContent = 'Listen';
      stopBtn.disabled = true;
      statusText.textContent = '';
      statusText.classList.remove('active');
    }
  }
  
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        isPaused = false;
      } else {
        synth.pause();
        isPaused = true;
      }
      updateUI();
    } else {
      startPlaying();
    }
  });
  
  stopBtn.addEventListener('click', () => {
    synth.cancel();
    isPlaying = false;
    isPaused = false;
    updateUI();
  });
  
  speedSelect.addEventListener('change', () => {
    if (isPlaying && !isPaused) {
      // Need to restart to change speed reliably across browsers
      startPlaying();
    }
  });
  
  voiceSelect.addEventListener('change', () => {
    if (isPlaying && !isPaused) {
      startPlaying();
    }
  });
  
  // Handle page unload to stop audio
  window.addEventListener('beforeunload', () => {
    synth.cancel();
  });

  // ── 7. Interactive Sidebar Dropdowns ──
  document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = toggle.closest('.nav-dropdown-container');
        if (parent) {
          const menu = parent.querySelector('.nav-dropdown-menu');
          if (menu) {
            menu.classList.toggle('hidden');
            menu.classList.toggle('flex');
            const expanded = menu.classList.contains('flex');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          }
        }
      });
    });

    // ── 8. Chapter Reading Progress Bar ──
    const readingProgress = document.getElementById('reading-progress-bar');
    if (readingProgress) {
      window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const progress = (window.scrollY / totalHeight) * 100;
          readingProgress.style.width = Math.min(100, Math.max(0, progress)) + '%';
        }
      }, { passive: true });
    }
  });
})();
