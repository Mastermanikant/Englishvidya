import os

app_path = r"D:\EnglishVidya Website\Englishvidya\website\js\app.js"

with open(app_path, 'r', encoding='utf-8') as f:
    app_js = f.read()

# Replace open() and close() in SearchEngine
old_search = """    open() {
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
    },"""

new_search = """    open() {
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
    },"""

app_js = app_js.replace(old_search, new_search)

# Replace toggle in createWordCard
old_toggle = """    card.addEventListener('click', (e) => {
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
    });"""

new_toggle = """    card.addEventListener('click', (e) => {
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
    });"""

app_js = app_js.replace(old_toggle, new_toggle)
app_js = app_js.replace("card.dataset.index = i;", "card.dataset.index = i;\n    card.setAttribute('aria-expanded', 'false');")

# Because we don't have the exact text for initMobileDrawer from app.js, let's write it via regex or simply append it.
# Actually, let's just write the modified app_js back for now, and check if we need to replace initMobileDrawer.
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_js)
print("Updated app.js")
