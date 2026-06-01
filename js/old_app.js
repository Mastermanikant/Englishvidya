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
        case 'about':
          renderAboutPage();
          break;
        case 'contact':
          renderContactPage();
          break;
        case 'legal':
          renderLegalPage();
          break;
        case 'youtube':
          window.location.replace('https://youtube.com/@englishvidyahq');
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
      $$('.desktop-nav-link').forEach(item => {
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
      <div class="animate-fade-in promo-home">
        <!-- Stunning Hero Section with Gradients -->
        <div class="hero-welcome promo-hero">
          <div class="promo-hero-badge">English Vidya • Launch Campaign</div>
          <p class="hero-greeting">${timeGreeting}, ${escHtml(userName)} 🙏</p>
          <h1 class="hero-title promo-hero-title">English सीखो, आगे बढ़ो!</h1>
          <p class="hero-subtitle promo-hero-subtitle">
            हिंदी माध्यम के छात्रों के लिए भारत का पहला distraction-free, super-fast और 100% मुफ़्त अंग्रेजी सीखने का मंच।
          </p>
          
          <div class="promo-hero-ctas">
            <a href="#/grammar" class="promo-btn primary">📖 पढ़ना शुरू करें (Start Learning)</a>
            <a href="#/about" class="promo-btn secondary">💡 हमारे बारे में जानें (About Us)</a>
          </div>

          <div class="live-badge-wrap">
            <span class="live-dot"></span>
            <span>Live Campaign Mode • ASOP Launch 2026</span>
          </div>
        </div>

        <!-- 3 Interactive Morphing Cards (Expand & Shrink by Default) -->
        <div class="promo-section" style="margin-top: var(--sp-6);">
          <h2 class="section-title text-center" style="margin-bottom: var(--sp-2);">✨ मुख्य विशेषताएं (Core Matrix)</h2>
          <p class="section-subtitle text-center" style="margin-bottom: var(--sp-6); color: var(--text-secondary); font-size: 0.95rem;">नीचे दिए गए कार्डों पर क्लिक करके विस्तार में देखें (Click to Expand)</p>
          
          <div class="morph-cards-container" id="morph-cards-container" style="display: flex; flex-direction: column; gap: var(--sp-4);">
            
            <!-- Card 1: What We Do -->
            <div class="morph-card" id="card-what-we-do">
              <div class="morph-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: var(--sp-4) var(--sp-5); cursor: pointer; background: var(--bg-raised); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: var(--sp-3);">
                  <span style="font-size: 1.5rem;">📖</span>
                  <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">01. हम क्या करते हैं (What We Do)</h3>
                </div>
                <span class="morph-card-indicator" style="font-weight: 600; color: var(--accent); transition: transform 0.3s;">↓</span>
              </div>
              <div class="morph-card-content" style="max-height: 0; overflow: hidden; transition: max-height 0.4s var(--ease-out); background: var(--bg-base);">
                <div style="padding: var(--sp-5); display: grid; grid-template-columns: 1fr; gap: var(--sp-4);">
                  <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; border-left: 3px solid var(--accent); padding-left: 10px;">
                    हम ग्रामीण भारत के उन होनहार छात्रों के लिए काम करते हैं जो अंग्रेजी न बोल पाने के कारण जीवन में पीछे रह जाते हैं। हमारा मंच रटने के बजाय व्यावहारिक अनुप्रयोग पर ध्यान केंद्रित करता है।
                  </p>
                  <div class="pillars-grid" style="display: grid; grid-template-columns: 1fr; gap: var(--sp-3);">
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">📚 द्विभाषी व्याकरण (Bilingual Grammar)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">सभी व्याकरण नियमों को रटने के बजाय, हम उन्हें हिंदी-अंग्रेजी (Hinglish) के आसान वाक्यों से मस्कुलर प्रैक्टिस द्वारा सीधे मस्तिष्क में उतारते हैं।</p>
                    </div>
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">🔤 19,773 शब्दों का खज़ाना (Dictionary)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">ग्रामीण छात्रों की सामान्य गलतियों और कन्फ़्यूजन को दूर करने के लिए विशेष देवनागरी उच्चारण और हिंदी अर्थ के साथ 148 श्रेणियों में विभाजित शब्दकोश।</p>
                    </div>
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">🃏 फ़्लैशकार्ड्स (Practice Deck)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">याददाश्त को बेहतर बनाने और उच्चारण का तुरंत वॉइस सुनने के लिए स्पेस-रेपेटिशन (Spaced Repetition) पर आधारित स्मार्ट कार्ड्स।</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Our Plans -->
            <div class="morph-card" id="card-our-plans">
              <div class="morph-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: var(--sp-4) var(--sp-5); cursor: pointer; background: var(--bg-raised); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: var(--sp-3);">
                  <span style="font-size: 1.5rem;">🚀</span>
                  <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">02. हमारी योजना (Our Plans & Vision)</h3>
                </div>
                <span class="morph-card-indicator" style="font-weight: 600; color: var(--accent); transition: transform 0.3s;">↓</span>
              </div>
              <div class="morph-card-content" style="max-height: 0; overflow: hidden; transition: max-height 0.4s var(--ease-out); background: var(--bg-base);">
                <div style="padding: var(--sp-5); display: grid; grid-template-columns: 1fr; gap: var(--sp-4);">
                  <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; border-left: 3px solid var(--accent); padding-left: 10px;">
                    हमारा उद्देश्य केवल ऑनलाइन वेबसाइट बनाना नहीं है, बल्कि ग्रामीण भारत के हर छात्र के हाथ में एक प्रीमियम और सुरक्षित शिक्षा पारिस्थितिकी तंत्र (Ecosystem) प्रदान करना है।
                  </p>
                  <div class="pillars-grid" style="display: grid; grid-template-columns: 1fr; gap: var(--sp-3);">
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">🔥 डेली स्ट्रीक और रिवार्ड्स (Gamification)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">छात्र रोज़ाना आकर 5 मिनट पढ़ेंगे और अपनी स्ट्रीक बनाए रखेंगे। लगातार 10 दिनों की स्ट्रीक पर ₹49 मूल्य की प्रीमियम पीडीएफ बुक बिल्कुल मुफ्त दी जाएगी।</p>
                    </div>
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">📊 साप्ताहिक लीडरबोर्ड (Peer Board)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">बिना किसी स्पैम या तनाव के, शीर्ष सक्रिय छात्रों की प्रशंसा बढ़ाने और उनका गौरव बढ़ाने के लिए हर सोमवार रीसेट होने वाला लीडरबोर्ड।</p>
                    </div>
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">📡 ऑफलाइन सपोर्ट PWA (Offline Study)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">इंटरनेट कनेक्टिविटी की समस्या को खत्म करने के लिए, लोड किए गए सभी व्याकरण नोट्स और शब्द ऑफलाइन रहने पर भी फोन में चलते रहेंगे।</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 3: Coming Next -->
            <div class="morph-card" id="card-coming-next">
              <div class="morph-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: var(--sp-4) var(--sp-5); cursor: pointer; background: var(--bg-raised); border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: var(--sp-3);">
                  <span style="font-size: 1.5rem;">🔮</span>
                  <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">03. आगामी बदलाव (What's Coming Next)</h3>
                </div>
                <span class="morph-card-indicator" style="font-weight: 600; color: var(--accent); transition: transform 0.3s;">↓</span>
              </div>
              <div class="morph-card-content" style="max-height: 0; overflow: hidden; transition: max-height 0.4s var(--ease-out); background: var(--bg-base);">
                <div style="padding: var(--sp-5); display: grid; grid-template-columns: 1fr; gap: var(--sp-4);">
                  <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; border-left: 3px solid var(--accent); padding-left: 10px;">
                    वेबसाइट को पूरी तरह मुफ़्त (Zero Cost) रखते हुए हम आर्टिफिशियल इंटेलिजेंस (AI) की सहायता से छात्रों के उच्चारण और बातचीत की झिझक दूर करने के फीचर्स जोड़ रहे हैं।
                  </p>
                  <div class="pillars-grid" style="display: grid; grid-template-columns: 1fr; gap: var(--sp-3);">
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">🗣️ Edge AI उच्चारण मूल्यांकन (Voice Assessor)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">महंगे एआई सर्वर्स के बजाय, हम ब्राउज़र के नेटिव वॉयस रिकग्निशन एपीआई से छात्र के उच्चारण का स्थानीय स्तर पर ₹0 लागत पर स्वचालित मूल्यांकन करेंगे।</p>
                    </div>
                    <div class="pillar-card" style="padding: var(--sp-4); background: var(--bg-raised); border-radius: 8px;">
                      <h4 style="color: var(--accent); font-weight: 700;">🤖 Edge AI द्विभाषी मेंटर (Bilingual Chatbot)</h4>
                      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">क्लाउडफ्लेयर के सर्वरलेस एआई नेटवर्क (Llama-3 Edge AI) पर चलने वाला रोबोट शिक्षक, जिससे छात्र सीधे Hinglish में अंग्रेजी के सवाल पूछ कर तुरंत समाधान पा सकेंगे।</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Streak Card -->
        <div class="streak-card promo-streak" style="margin-top: var(--sp-8);">
          <div class="streak-content">
            <div class="streak-number">🔥 ${streak} दिन की Streak</div>
            <div class="streak-label">लगातार सीखने की निरंतरता!</div>
            <div class="streak-message">${streak >= 7 ? '🎉 बहुत शानदार! आप असाधारण प्रयास कर रहे हैं!' : 'हर दिन वेबसाइट खोलें, 5 मिनट पढ़ें और अपनी स्ट्रीक बढ़ाएं!'}</div>
          </div>
        </div>

        <!-- Quick Start Navigation -->
        <div class="promo-section" style="margin-top: var(--sp-6);">
          <h2 class="section-title text-center" style="margin-bottom: var(--sp-6);">⚡ जल्दी शुरू करें (Quick Start)</h2>
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
        </div>

        <!-- Interactive Stats Summary -->
        <div class="promo-section">
          <h2 class="section-title text-center" style="margin-bottom: var(--sp-6);">📊 हमारे आँकड़े (Statistics)</h2>
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
        </div>

        <!-- 📲 हमसे सोशल मीडिया पर जुड़ें (Stay Connected) -->
        <div class="promo-section social-connect-section" style="margin-top: var(--sp-6);">
          <h2 class="section-title text-center" style="margin-bottom: var(--sp-2); font-size: 1.4rem;">📲 हमसे सोशल मीडिया पर जुड़ें (Stay Connected)</h2>
          <p class="section-subtitle text-center" style="margin-bottom: var(--sp-6); color: var(--text-secondary); font-size: 0.9rem;">
            रोज नए English Words, Spoken Sentences और Grammar Tricks बिल्कुल आसान भाषा में सीखने के लिए अभी हमसे जुड़ें!
          </p>
          
          <!-- Primary Highlight: WhatsApp Channel -->
          <div class="whatsapp-promo-banner" style="background: linear-gradient(135deg, #25d366, #128c7e); border-radius: var(--radius-lg); padding: var(--sp-6); color: #ffffff; margin-bottom: var(--sp-5); box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: var(--sp-3); align-items: center; text-align: center;">
            <div class="social-icon-wrapper" style="background: #ffffff; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#128c7e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </div>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; margin-bottom: 6px; color:#ffffff;">WhatsApp चैनल से जुड़ें (Daily Spoken Practice)</h3>
              <p style="font-size: 0.85rem; opacity: 0.95; line-height: 1.5; max-width: 480px; margin:0 auto;">
                ग्रामर नोट्स की पीडीएफ़, रोज बोले जाने वाले नए इंग्लिश वाक्य और स्पेलिंग शीट्स सीधे अपने व्हाट्सएप पर मुफ्त में पाएं!
              </p>
            </div>
            <a href="https://whatsapp.com/channel/0029VbCnmPe0VycPXCmBBH43" 
               target="_blank" 
               rel="noopener noreferrer"
               class="promo-btn primary" 
               style="background: #ffffff; color: #128c7e; font-weight:800; border: none; font-size: 0.9rem; padding: 10px 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); width: 100%; max-width: 260px; text-decoration:none; border-radius:8px;">
              🟢 WhatsApp चैनल पर जुड़ें (Join Free)
            </a>
          </div>

          <!-- Social Media Grid with Premium SVG Icons (YouTube, Instagram, Telegram, Facebook, Pinterest, LinkedIn, X) -->
          <div class="social-links-grid">
            
            <!-- 1. YouTube -->
            <a href="#/youtube" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: #FF0000;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">YouTube</span>
                <span class="social-card-username">@englishvidyahq</span>
              </div>
            </a>

            <!-- 2. Instagram -->
            <a href="https://instagram.com/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">Instagram</span>
                <span class="social-card-username">@englishvidyahq</span>
              </div>
            </a>

            <!-- 3. Telegram -->
            <a href="https://t.me/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: #0088cc;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">Telegram</span>
                <span class="social-card-username">t.me/englishvidyahq</span>
              </div>
            </a>

            <!-- 4. Facebook -->
            <a href="https://facebook.com/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: #1877F2;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">Facebook</span>
                <span class="social-card-username">englishvidyahq</span>
              </div>
            </a>

            <!-- 5. Pinterest -->
            <a href="https://pinterest.com/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: #BD081C;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8c-2.2 0-4 1.8-4 4 0 1.5 1 2.8 2.5 3.5-.1-.3-.2-.7-.2-1.1v-2.2c0-.4.3-.8.8-.8s.8.3.8.8v2.2c0 .4-.1.8-.2 1.1 1.5-.7 2.5-2 2.5-3.5 0-2.2-1.8-4-4-4z"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">Pinterest</span>
                <span class="social-card-username">englishvidyahq</span>
              </div>
            </a>

            <!-- 6. LinkedIn -->
            <a href="https://linkedin.com/company/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card">
              <div class="social-icon-wrapper" style="background: #0A66C2;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">LinkedIn</span>
                <span class="social-card-username">englishvidyahq</span>
              </div>
            </a>

            <!-- 7. X (Twitter) -->
            <a href="https://x.com/englishvidyahq" target="_blank" rel="noopener noreferrer" class="social-link-card" style="grid-column: span 2;">
              <div class="social-icon-wrapper" style="background: #000000; border: 1px solid rgba(255,255,255,0.15);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="20" y2="4"/><line x1="4" y1="4" x2="20" y2="20"/></svg>
              </div>
              <div class="social-card-text">
                <span class="social-card-name">X (Twitter)</span>
                <span class="social-card-username">@englishvidyahq</span>
              </div>
            </a>

          </div>
        </div>

        <!-- Tip of the Day -->
        <div class="card card-gradient promo-tip" style="margin-top: var(--sp-8);">
          <span class="badge">💡 आज का टिप</span>
          <h3 style="margin-top: var(--sp-3); color: var(--text-primary);">रोज़ 10 नए शब्द सीखें</h3>
          <p class="text-secondary" style="margin-top: var(--sp-2); margin-bottom: 0;">
            अगर आप रोज़ सिर्फ 10 शब्द सीखते हैं, तो 1 साल में आप <strong>3,650 शब्द</strong> जान जाएंगे — यह किसी भी अंग्रेजी exam के लिए काफ़ी से ज़्यादा है!
          </p>
        </div>
      </div>
    `;

    // 🛡️ Security Rule 3: Event Delegation to prevent duplicate event listeners and memory leaks on low-end devices
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

        // Close all other cards first
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
          // Smooth view align
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        }
      });
    }

    renderFooter(appContent);
  }

  function renderFooter(container) {
    if (!container) return;
    // Prevent duplicate footers
    const existing = container.querySelector('.app-footer');
    if (existing) existing.remove();

    const footerHtml = `
      <footer class="app-footer">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="#/" class="logo">
              <span class="logo-mark">🎓</span>
              <span class="logo-text">English <span class="logo-accent">Vidya</span></span>
            </a>
            <p class="footer-desc">हिंदी माध्यम के छात्रों के लिए भारत का सबसे बेहतरीन, तेज और पूर्णतः निःशुल्क अंग्रेजी सीखने का डिजिटल मंच।</p>
          </div>
          <div class="footer-links-col">
            <h4>त्वरित लिंक (Quick Links)</h4>
            <ul class="footer-links">
              <li><a href="#/">होम (Home)</a></li>
              <li><a href="#/grammar">ग्रामर पाठ (Grammar)</a></li>
              <li><a href="#/dictionary">शब्दकोश (Dictionary)</a></li>
              <li><a href="#/flashcards">फ्लैशकार्ड्स (Flashcards)</a></li>
            </ul>
          </div>
          <div class="footer-links-col">
            <h4>कंपनी और सपोर्ट (Company & Support)</h4>
            <ul class="footer-links">
              <li><a href="#/about">हमारे बारे में (About Us)</a></li>
              <li><a href="#/contact">संपर्क करें (Contact Us)</a></li>
              <li><a href="#/legal">नीतियां (Legal Policies)</a></li>
            </ul>
          </div>
          <div class="footer-links-col">
            <h4>हमसे जुड़ें (Follow Us)</h4>
            <ul class="footer-links" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; min-width: 250px;">
              <li><a href="https://whatsapp.com/channel/0029VbCnmPe0VycPXCmBBH43" target="_blank" rel="noopener noreferrer">🟢 WhatsApp</a></li>
              <li><a href="#/youtube" target="_blank" rel="noopener noreferrer">🔴 YouTube</a></li>
              <li><a href="https://instagram.com/englishvidyahq" target="_blank" rel="noopener noreferrer">📸 Instagram</a></li>
              <li><a href="https://t.me/englishvidyahq" target="_blank" rel="noopener noreferrer">✈️ Telegram</a></li>
              <li><a href="https://facebook.com/englishvidyahq" target="_blank" rel="noopener noreferrer">🔵 Facebook</a></li>
              <li><a href="https://pinterest.com/englishvidyahq" target="_blank" rel="noopener noreferrer">📌 Pinterest</a></li>
              <li><a href="https://linkedin.com/company/englishvidyahq" target="_blank" rel="noopener noreferrer">💼 LinkedIn</a></li>
              <li><a href="https://x.com/englishvidyahq" target="_blank" rel="noopener noreferrer">🐦 X (Twitter)</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 English Vidya. सर्वाधिकार सुरक्षित। | Designed for rural and Hindi-medium students in India 🇮🇳</p>
        </div>
      </footer>
    `;
    container.insertAdjacentHTML('beforeend', footerHtml);
  }

  function renderAboutPage() {
    appContent.innerHTML = `
      <div class="animate-fade-in about-page">
        <div class="hero-welcome promo-hero">
          <span class="badge">हमारे बारे में (About Us)</span>
          <h1 class="hero-title promo-hero-title">हमारा मिशन और टीम</h1>
          <p class="hero-subtitle promo-hero-subtitle">
            ग्रामीण भारत और हिंदी-माध्यम के छात्रों के बीच अंग्रेजी के डर को खत्म कर उन्हें रोजगार और डिजिटल अवसरों के लिए सशक्त बनाना।
          </p>
        </div>

        <div class="promo-section">
          <div class="card about-card" style="padding: var(--sp-6); margin-bottom: var(--sp-6);">
            <h2>🎯 हमारा उद्देश्य (Our Vision & Mission)</h2>
            <p style="font-size: 1.1rem; line-height: 1.6; margin-top: var(--sp-4);">
              भारत में अंग्रेजी केवल एक विषय नहीं है, बल्कि यह रोजगार, सामाजिक गतिशीलता और वैश्विक सूचनाओं का प्रवेश द्वार है। दुर्भाग्य से, पारंपरिक शिक्षा प्रणाली अंग्रेजी को रटने वाले नियमों के रूप में पढ़ाती है। 
            </p>
            <p style="font-size: 1.1rem; line-height: 1.6; margin-top: var(--sp-4);">
              <strong>English Vidya</strong> का लक्ष्य इस खाई को पाटना है। हम भारत के कोने-कोने में रहने वाले छात्रों को एक अत्यंत तीव्र गति से चलने वाला, ध्यान न भटकाने वाला, और आधुनिक वैज्ञानिक पद्धतियों पर आधारित अंग्रेजी शिक्षा का मंच बिना किसी शुल्क के प्रदान कर रहे हैं।
            </p>
          </div>
        </div>

        <div class="promo-section card-gradient" style="border-radius: 20px; padding: var(--sp-8) var(--sp-6); margin-bottom: var(--sp-6);">
          <h2 style="color: var(--text-primary); margin-bottom: var(--sp-6);">👨‍🏫 शिक्षण दर्शन (Educational Philosophy)</h2>
          <div class="pillars-grid" style="display: grid; grid-template-columns: 1fr; gap: var(--sp-4);">
            <div class="pillar-card" style="padding: var(--sp-5); background: var(--bg-raised); border-radius: 12px; border: 1px solid var(--border);">
              <div class="pillar-icon">📚</div>
              <h4 style="font-weight: 700; margin-bottom: 5px;">भाषा का अर्जन (Acquisition)</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0;">जैसे बच्चा अपनी मातृभाषा व्याकरण रटे बिना सुनकर सीखता है, वैसे ही हम छात्रों को सेंटेंस पैटर्न से वाक्य प्रयोग सिखाते हैं।</p>
            </div>
            <div class="pillar-card" style="padding: var(--sp-5); background: var(--bg-raised); border-radius: 12px; border: 1px solid var(--border);">
              <div class="pillar-icon">🔄</div>
              <h4 style="font-weight: 700; margin-bottom: 5px;">द्विभाषी हाइब्रिड (Hybrid Hinglish)</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0;">ग्रामीण छात्रों के मनोविज्ञान को ध्यान में रखकर हिंदी-मिश्रित-अंग्रेजी (Hinglish) में सहज और आनंददायक संवाद शैली का उपयोग किया जाता है।</p>
            </div>
            <div class="pillar-card" style="padding: var(--sp-5); background: var(--bg-raised); border-radius: 12px; border: 1px solid var(--border);">
              <div class="pillar-icon">🗣️</div>
              <h4 style="font-weight: 700; margin-bottom: 5px;">आत्मविश्वास निर्माण (Confidence)</h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0;">Devanagari उच्चारण गाइड और वॉयस इंजन की सहायता से छात्र शब्दों का सटीक उच्चारण सुनकर झिझक मिटाना सीखते हैं।</p>
            </div>
          </div>
        </div>

        <div class="promo-section">
          <div class="card about-card" style="padding: var(--sp-6); margin-bottom: var(--sp-6);">
            <h2>🛡️ सुरक्षा और डेटा गोपनीयता (Security & Reliability)</h2>
            <p style="line-height: 1.6; margin-top: var(--sp-3);">
              हमारी पूरी प्रणाली **Cloudflare Web Edge Application** पर सर्वरलेस आर्किटेक्चर के साथ सुरक्षित रूप से होस्ट की गई है। यह ग्रामीण भारत के बहुत धीमे नेटवर्क (2G/3G) पर भी लैग-फ्री और पूरी तरह सुरक्षित अनुभव सुनिश्चित करता है।
            </p>
            <p style="line-height: 1.6; margin-top: var(--sp-3);">
              <strong>English Vidya</strong> छात्रों के लिए हमेशा 100% मुफ़्त और पूरी तरह से विज्ञापन-मुक्त (Ad-free) रहेगी। हम किसी भी प्रकार का गुप्त शुल्क या सब्सक्रिप्शन नहीं लेते हैं। भविष्य में इस मुफ़्त सेवा के संचालन और सर्वर लागत की भरपाई करने के लिए, हम छात्रों को पूरी तरह से वैकल्पिक (Optional) और बहुत ही कम मूल्य पर डाउनलोड करने योग्य **प्रीमियम व्याकरण ई-बुक (Bilingual Workbook PDF)** प्रदान करेंगे, जिसे छात्र चाहें तो अपनी स्वेच्छा से ख़रीद सकते हैं या लगातार 10 दिनों की दैनिक स्ट्रीक पूरी करके बिल्कुल मुफ्त प्राप्त कर सकते हैं।
            </p>
            <div style="margin-top: var(--sp-4); display: flex; gap: 10px; align-items: center;">
              <span style="background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">🔒 Secure by Cloudflare</span>
              <span style="background: rgba(6, 182, 212, 0.1); color: var(--accent-secondary); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✅ SSL Verified</span>
            </div>
          </div>
        </div>
      </div>
    `;

    renderFooter(appContent);
  }

  function renderContactPage() {
    appContent.innerHTML = `
      <div class="animate-fade-in contact-page">
        <div class="hero-welcome promo-hero">
          <span class="badge">संपर्क करें (Contact Us)</span>
          <h1 class="hero-title promo-hero-title">हमसे जुड़ें</h1>
          <p class="hero-subtitle promo-hero-subtitle">
            यदि आपके पास कोई प्रश्न, सुझाव या तकनीकी समस्या है, तो नीचे दिए गए फॉर्म का उपयोग करें। हम 24 घंटे के भीतर आपसे संपर्क करेंगे।
          </p>
        </div>

        <div class="promo-section" style="max-width: 650px; margin: 0 auto var(--sp-8) auto;">
          <div class="card contact-form-card" id="contact-form-container" style="padding: var(--sp-6);">
            <h2>✉️ संदेश भेजें (Send Message)</h2>
            <form id="contact-form" style="margin-top: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4);">
              <div class="form-group" style="display:flex; flex-direction:column; gap:5px;">
                <label for="contact-name" style="font-weight:500; font-size:0.9rem;">आपका नाम (Full Name) <span style="color: var(--color-success);">*</span></label>
                <input type="text" id="contact-name" placeholder="अपना नाम लिखें..." required style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px; border-radius: 8px;">
              </div>
              
              <div class="form-group" style="display:flex; flex-direction:column; gap:5px;">
                <label for="contact-email" style="font-weight:500; font-size:0.9rem;">ईमेल या मोबाइल नंबर (Email / Mobile) <span style="color: var(--color-success);">*</span></label>
                <input type="text" id="contact-email" placeholder="example@gmail.com या मोबाइल नंबर..." required style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px; border-radius: 8px;">
              </div>

              <div class="form-group" style="display:flex; flex-direction:column; gap:5px;">
                <label for="contact-category" style="font-weight:500; font-size:0.9rem;">विषय (Subject)</label>
                <select id="contact-category" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px; border-radius: 8px;">
                  <option value="Question">प्रश्न (General Question)</option>
                  <option value="Feedback">सुझाव (Feedback / Suggestion)</option>
                  <option value="Technical Issue">तकनीकी समस्या (Technical Issue)</option>
                  <option value="Business">व्यावसायिक सहयोग (Partnership)</option>
                </select>
              </div>

              <div class="form-group" style="display:flex; flex-direction:column; gap:5px;">
                <label for="contact-message" style="font-weight:500; font-size:0.9rem;">आपका संदेश (Your Message) <span style="color: var(--color-success);">*</span></label>
                <textarea id="contact-message" rows="5" placeholder="अपना संदेश या प्रश्न विस्तार से लिखें..." required style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px; border-radius: 8px; font-family:inherit; resize:vertical;"></textarea>
              </div>

              <button type="submit" class="promo-btn primary" style="width: 100%; border: none; font-size: 1rem; padding: 12px; cursor:pointer;" id="contact-submit-btn">
                🚀 संदेश भेजें (Send Message)
              </button>
            </form>
          </div>
        </div>

        <div class="promo-section text-center" style="margin-top: var(--sp-6); margin-bottom: var(--sp-8);">
          <h3>📍 अन्य संपर्क माध्यम</h3>
          <p class="text-secondary" style="margin-top: var(--sp-2);">आप हमें सीधे ईमेल या व्हाट्सएप पर भी संपर्क कर सकते हैं:</p>
          <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-4); justify-content: center; flex-wrap: wrap;">
            <div class="card" style="min-width: 250px; padding: var(--sp-6); border: 1px solid var(--border-color);">
              <h4>📧 ईमेल करें</h4>
              <p style="color: var(--accent-secondary); font-weight: 600; margin-top: 10px; font-size: 1.05rem;">support@englishvidya.com</p>
            </div>
            <div class="card" style="min-width: 250px; padding: var(--sp-6); border: 1px solid var(--border-color);">
              <h4>💬 व्हाट्सएप सहायता</h4>
              <p style="color: var(--accent-primary); font-weight: 600; margin-top: 10px; font-size: 1.05rem;">+91 99999-99999</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // 🛡️ Security Rule 1 & 4: Contact Form Validation, HTML sanitization, and 10 submission cap
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
          // Save submission in localStorage
          const submissions = JSON.parse(localStorage.getItem('ev-contact-submissions') || '[]');
          submissions.push({ name, email, category, message, timestamp: new Date().toISOString() });
          localStorage.setItem('ev-contact-submissions', JSON.stringify(submissions));

          // Render Success Screen inside Card
          const container = $('#contact-form-container');
          container.innerHTML = `
            <div class="text-center animate-fade-in" style="padding: var(--sp-6);">
              <p style="font-size: 3.5rem; margin-bottom: var(--sp-4);">🎉</p>
              <h2 style="color: var(--accent-primary); margin-bottom: var(--sp-2);">संदेश सफलतापूर्वक दर्ज!</h2>
              <p class="text-secondary" style="font-size: 1.05rem; line-height: 1.5;">
                नमस्ते <strong>${escHtml(name)}</strong>, आपका संदेश हमारे सपोर्ट डेटाबेस में सुरक्षित रूप से दर्ज कर लिया गया है।
              </p>
              
              <div style="margin-top: var(--sp-6); background: var(--bg-primary); padding: var(--sp-4); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
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
                <button class="promo-btn secondary" onclick="location.hash='#/'" style="padding: 12px; border-radius: 8px; cursor:pointer;">
                  🏠 होम पेज पर वापस जाएँ
                </button>
              </div>
            </div>
          `;

          showToast('✅ संदेश सुरक्षित रूप से भेजा गया!');
        }, 1000);
      });
    }

    renderFooter(appContent);
  }

  function renderLegalPage() {
    appContent.innerHTML = `
      <div class="animate-fade-in legal-page" style="padding-bottom: var(--sp-12);">
        <div class="hero-welcome promo-hero">
          <span class="badge">कानूनी नीतियां (Legal Policies)</span>
          <h1 class="hero-title promo-hero-title">नीतियां और अस्वीकरण</h1>
          <p class="hero-subtitle promo-hero-subtitle">
            हमारी सेवाओं का उपयोग करने से पहले कृपया अस्वीकरण, गोपनीयता नीति और सीमित दायित्व की शर्तों को ध्यानपूर्वक पढ़ें।
          </p>
        </div>

        <div class="promo-section" style="max-width: 800px; margin: 0 auto;">
          <!-- Tab Buttons -->
          <div class="legal-tabs" id="legal-tabs" style="display: flex; gap: 10px; border-bottom: 2px solid var(--border); padding-bottom: 10px; margin-bottom: var(--sp-6); justify-content: center; flex-wrap: wrap;">
            <button class="promo-btn active" data-tab="disclaimer" style="padding: 8px 16px; font-size: 0.9rem; border-radius: 20px; background: var(--gradient-accent); border: none; color: #fff;">⚠️ अस्वीकरण (Disclaimer)</button>
            <button class="promo-btn" data-tab="privacy" style="padding: 8px 16px; font-size: 0.9rem; border-radius: 20px; background: var(--bg-raised); border: 1px solid var(--border); color: var(--text-secondary);">🔒 गोपनीयता नीति (Privacy)</button>
            <button class="promo-btn" data-tab="liability" style="padding: 8px 16px; font-size: 0.9rem; border-radius: 20px; background: var(--bg-raised); border: 1px solid var(--border); color: var(--text-secondary);">⚖️ सीमित दायित्व (Liability)</button>
          </div>

          <!-- Tab Contents -->
          <div class="legal-content-card card" id="legal-content-container" style="padding: var(--sp-6); min-height: 300px; line-height: 1.7;">
            <!-- Disclaimer (Active by default) -->
            <div class="legal-tab-pane" id="pane-disclaimer">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">अस्वीकरण (Disclaimer)</h2>
              <p><strong>1. केवल शैक्षिक उद्देश्य:</strong> English Vidya पर उपलब्ध सभी अध्ययन सामग्री, शब्दकोश, व्याकरण नियम और पाठ केवल शैक्षिक और सामान्य सूचनात्मक उद्देश्यों के लिए प्रदान किए गए हैं। हम किसी भी प्रकार की सरकारी नौकरी या शैक्षणिक परीक्षा में 100% सफलता की गारंटी नहीं देते हैं।</p>
              <p style="margin-top: 15px;"><strong>2. सटीकता और त्रुटियां:</strong> हालांकि हमने 19,773 शब्दों और व्याकरण नियमों के संकलन में अत्यधिक सावधानी बरती है, फिर भी इसमें मानवीय या लिपिकीय त्रुटियां (typographical errors) हो सकती हैं। छात्र से अनुरोध है कि वे किसी भी महत्वपूर्ण परीक्षा या व्यावसायिक उपयोग से पहले तथ्यों को दोबारा जांच लें।</p>
              <p style="margin-top: 15px;"><strong>3. बाहरी लिंक्स:</strong> हमारी पाठ्यसामग्री में वीडियो एम्बेड (जैसे YouTube embeds) शामिल हैं जो तीसरे पक्ष के सर्वर्स पर होस्ट किए गए हैं। इन वीडियो की सामग्री या उन पर दिखाई देने वाले विज्ञापनों पर हमारा कोई नियंत्रण या स्वामित्व नहीं है।</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // 🛡️ Security Rule 3: Event delegation for Legal page tab shifting
    const tabsContainer = $('#legal-tabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const activeTab = btn.dataset.tab;
        
        // Remove active class from other buttons
        tabsContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'var(--bg-raised)';
          b.style.border = '1px solid var(--border)';
          b.style.color = 'var(--text-secondary)';
        });

        // Highlight clicked button
        btn.classList.add('active');
        btn.style.background = 'var(--gradient-accent)';
        btn.style.border = 'none';
        btn.style.color = '#fff';

        const contentContainer = $('#legal-content-container');
        if (!contentContainer) return;

        // Render tab contents dynamically
        if (activeTab === 'disclaimer') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">अस्वीकरण (Disclaimer)</h2>
              <p><strong>1. केवल शैक्षिक उद्देश्य:</strong> English Vidya पर उपलब्ध सभी अध्ययन सामग्री, शब्दकोश, व्याकरण नियम और पाठ केवल शैक्षिक और सामान्य सूचनात्मक उद्देश्यों के लिए प्रदान किए गए हैं। हम किसी भी प्रकार की सरकारी नौकरी या परीक्षा में 100% सफलता की गारंटी नहीं देते हैं।</p>
              <p style="margin-top: 15px;"><strong>2. सटीकता और त्रुटियां:</strong> हालांकि हमने 19,773 शब्दों और व्याकरण नियमों के संकलन में अत्यधिक सावधानी बरती है, फिर भी इसमें मानवीय या लिपिकीय त्रुटियां हो सकती हैं। छात्र से अनुरोध है कि वे किसी भी महत्वपूर्ण परीक्षा से पहले दोबारा जांच लें।</p>
              <p style="margin-top: 15px;"><strong>3. बाहरी लिंक्स:</strong> हमारी पाठ्यसामग्री में वीडियो एम्बेड (जैसे YouTube embeds) शामिल हैं जो तीसरे पक्ष के सर्वर्स पर होस्ट किए गए हैं। इन वीडियो की सामग्री या विज्ञापनों पर हमारा कोई नियंत्रण नहीं है।</p>
            </div>
          `;
        } else if (activeTab === 'privacy') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">गोपनीयता नीति (Privacy Policy)</h2>
              <p><strong>1. 100% विज्ञापन-मुक्त और सुरक्षित:</strong> English Vidya छात्रों की गोपनीयता का पूर्ण सम्मान करती है। हम छात्रों का कोई भी निजी डेटा (जैसे नाम, ईमेल, प्रोग्रेस) किसी तीसरे पक्ष या विज्ञापन नेटवर्क को कभी भी बेचते या साझा नहीं करते हैं।</p>
              <p style="margin-top: 15px;"><strong>2. प्रमाणीकरण (Authentication):</strong> लॉगिन के लिए हम Google Sign-In (OAuth) का उपयोग करते हैं। पासवर्ड रहित सुरक्षित प्रमाणीकरण के लिए आपका Google सत्र टोकन केवल आपके ब्राउज़र में Secure HttpOnly Cookies के माध्यम से स्थानांतरित किया जाता है, जिसे जावास्क्रिप्ट द्वारा चोरी नहीं किया जा सकता।</p>
              <p style="margin-top: 15px;"><strong>3. स्थानीय संग्रहण (Local Storage):</strong> छात्र की दैनिक स्ट्रीक्स, हाल ही की खोजें और संपर्क फ़ॉर्म सबमिशन स्थानीय रूप से ब्राउज़र के \`localStorage\` में संग्रहीत होते हैं, ताकि बिना इंटरनेट के भी ऐप सुचारू रूप से काम कर सके।</p>
              <p style="margin-top: 15px;"><strong>4. विश्लेषण (Analytics):</strong> हम अपनी वेबसाइट के ट्रैफ़िक की निगरानी के लिए Cloudflare के निजता-अनुकूल edge analytics का उपयोग करते हैं, जो छात्र के कंप्यूटर पर बिना कोई कुकी या जावास्क्रिप्ट चलाए सुरक्षित रूप से काम करता है।</p>
            </div>
          `;
        } else if (activeTab === 'liability') {
          contentContainer.innerHTML = `
            <div class="legal-tab-pane animate-fade-in">
              <h2 style="color: var(--accent); margin-bottom: var(--sp-4);">सीमित दायित्व (Limited Liability)</h2>
              <p><strong>1. कोई वारंटी नहीं:</strong> यह वेबसाइट "जैसी है" (As-Is) और "जैसी उपलब्ध है" (As-Available) के आधार पर बिना किसी वारंटी के प्रदान की गई है। हम यह गारंटी नहीं देते कि सेवा निर्बाध, त्रुटिहीन या वायरस-मुक्त होगी।</p>
              <p style="margin-top: 15px;"><strong>2. हानि की सीमा:</strong> कानून द्वारा अनुमत अधिकतम सीमा तक, English Vidya, इसके निर्माता, या साझेदार किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक, या दंडात्मक नुकसान (जैसे डेटा हानि, फोन का धीमा होना, या स्ट्रीक टूटने से होने वाला मानसिक तनाव) के लिए उत्तरदायी नहीं होंगे।</p>
              <p style="margin-top: 15px;"><strong>3. स्वैच्छिक योगदान और ई-बुक:</strong> यदि छात्र वैकल्पिक व्याकरण ई-बुक ख़रीदते हैं, तो वह भुगतान पूरी तरह से सुरक्षित मर्चेंट चैनल के माध्यम से किया जाएगा। किसी भी असफल भुगतान या तकनीकी समस्या की स्थिति में, संबंधित पेमेंट गेटवे की नीतियां लागू होंगी, हालांकि हम आपकी पूरी सहायता करने का प्रयास करेंगे।</p>
            </div>
          `;
        }
      });
    }

    renderFooter(appContent);
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
              <a href="#/grammar/${escHtml(l.slug)}" class="chapter-item">
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
  async function renderLesson(lessonSlug) {
    // Show skeleton while loading
    appContent.innerHTML = `
      <div class="animate-fade-in">
        <a href="#/grammar" class="lesson-back-btn">← सभी पाठ देखें</a>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;

    const lessonData = await loadJSON(`${DATA_BASE}/grammar/lessons/${lessonSlug}.json`);

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
