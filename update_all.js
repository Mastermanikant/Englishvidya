const fs = require('fs');
const path = require('path');

const stylePath = "D:\\EnglishVidya Website\\Englishvidya\\website\\css\\style.css";
const homePath = "D:\\EnglishVidya Website\\Englishvidya\\website\\css\\home-redesign.css";
const njkPath = "D:\\EnglishVidya Website\\Englishvidya\\src\\_includes\\layouts\\grammar-lesson.njk";
const appPath = "D:\\EnglishVidya Website\\Englishvidya\\website\\js\\app.js";

// 1. CSS Merge & Token Extraction
let homeCss = fs.readFileSync(homePath, 'utf8');
let styleCss = fs.readFileSync(stylePath, 'utf8');

const rootMatch = homeCss.match(/:root\s*\{([^}]+)\}/);
const darkMatch = homeCss.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/);

const rootVars = rootMatch ? rootMatch[1].trim() : "";
const darkVars = darkMatch ? darkMatch[1].trim() : "";

if (rootVars) {
    styleCss = styleCss.replace(/(:root\s*\{)/, `$1\n  /* Premium UI Glassmorphic Tokens */\n  ${rootVars}\n`);
}
if (darkVars) {
    styleCss = styleCss.replace(/(\[data-theme="dark"\]\s*\{)/, `$1\n  /* Premium UI Glassmorphic Tokens */\n  ${darkVars}\n`);
}

let restHomeCss = homeCss;
if (rootMatch) restHomeCss = restHomeCss.replace(rootMatch[0], '');
if (darkMatch) restHomeCss = restHomeCss.replace(darkMatch[0], '');
restHomeCss = restHomeCss.replace(/\/\* ─── DESIGN TOKENS \(Home-Specific\) ─────────────────────────────── \*\//, '').trim();

const reducedMotionCss = `
/* Accessibility — Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
  }
}
`;

const mergedStyleCss = styleCss + "\n\n/* ==========================================================================\n   MERGED FROM HOME-REDESIGN.CSS\n   ========================================================================== */\n" + restHomeCss + "\n" + reducedMotionCss;

fs.writeFileSync(stylePath, mergedStyleCss, 'utf8');
fs.writeFileSync(homePath, '/* File merged into style.css and emptied */\n', 'utf8');

// 2. Grammar Lesson NJK Update
let njkContent = fs.readFileSync(njkPath, 'utf8');
njkContent = njkContent.replace('class="card markdown-content"', 'class="premium-card markdown-content"');
fs.writeFileSync(njkPath, njkContent, 'utf8');

// 3. app.js ARIA and Focus Trap
let appJs = fs.readFileSync(appPath, 'utf8');
const oldSearch = `    open() {
      const searchOverlay = $('#search-overlay');
      const searchInput = $('#search-input');
      if (!searchOverlay) return;
      searchOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
      this.showRecent();
    },

    close() {
      const searchOverlay = $('#search-overlay');
      const searchInput = $('#search-input');
      const searchResults = $('#search-results');
      if (!searchOverlay) return;
      searchOverlay.classList.remove('active');
      document.body.style.overflow = '';
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 Type above — results appear instantly</p><div id="recent-searches-container"></div></div>';
    },`;

const newSearch = `    open() {
      const searchOverlay = $('#search-overlay');
      const searchInput = $('#search-input');
      const triggerBtn = $('#search-trigger-btn');
      if (!searchOverlay) return;
      searchOverlay.classList.add('active');
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
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
      document.body.style.overflow = '';
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '<div class="search-placeholder"><p class="search-hint">🔍 Type above — results appear instantly</p><div id="recent-searches-container"></div></div>';
    },`;
appJs = appJs.replace(oldSearch, newSearch);

const oldToggle = `    card.addEventListener('click', (e) => {
      if (e.target.closest('.word-speak-btn')) return;
      card.classList.toggle('expanded');
      const drawer = card.querySelector('.word-details-drawer');
      if (drawer) {
        if (card.classList.contains('expanded')) {
          drawer.style.maxHeight = drawer.scrollHeight + 'px';
        } else {
          drawer.style.maxHeight = '0px';
        }
      }
    });`;
const newToggle = `    card.addEventListener('click', (e) => {
      if (e.target.closest('.word-speak-btn')) return;
      const isExpanded = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      const drawer = card.querySelector('.word-details-drawer');
      if (drawer) {
        if (card.classList.contains('expanded')) {
          drawer.style.maxHeight = drawer.scrollHeight + 'px';
        } else {
          drawer.style.maxHeight = '0px';
        }
      }
    });`;
appJs = appJs.replace(oldToggle, newToggle);
appJs = appJs.replace("card.dataset.index = i;", "card.dataset.index = i;\n    card.setAttribute('aria-expanded', 'false');");

// 4. Update base.njk to remove home-redesign.css link
const basePath = "D:\\EnglishVidya Website\\Englishvidya\\src\\_includes\\layouts\\base.njk";
let baseNjk = fs.readFileSync(basePath, 'utf8');
baseNjk = baseNjk.replace(/<link rel="stylesheet" href="\/css\/home-redesign\.css">\n?/g, '');
fs.writeFileSync(basePath, baseNjk, 'utf8');

fs.writeFileSync(appPath, appJs, 'utf8');
console.log("Success");
