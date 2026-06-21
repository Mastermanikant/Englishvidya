document.addEventListener('DOMContentLoaded', () => {
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchTriggerBtns = document.querySelectorAll('#search-trigger-btn');
    const searchCloseBtn = document.getElementById('search-close-btn');

    let fuse = null;
    let searchData = [];
    let isDataLoaded = false;

    // Open Search Overlay
    function openSearch() {
        searchOverlay.classList.add('active');
        searchInput.focus();
        if (!isDataLoaded) {
            loadSearchData();
        }
    }

    // Close Search Overlay
    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        renderPlaceholder();
    }

    searchTriggerBtns.forEach(btn => btn.addEventListener('click', openSearch));
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    // Escape key closes search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });

    // Load JSON data
    async function loadSearchData() {
        try {
            searchResults.innerHTML = '<div class="search-placeholder"><p>Loading search index... 🔄</p></div>';
            
            const [wordsRes, articlesRes] = await Promise.all([
                fetch('/search-index.json'),
                fetch('/data/site/articles-search-index.json')
            ]);
            
            if (!wordsRes.ok || !articlesRes.ok) throw new Error('Failed to load search indexes');
            
            const rawWords = await wordsRes.json();
            const rawArticles = await articlesRes.json();
            
            // Map to a unified structure
            const wordsMapped = rawWords.map(w => ({
                type: 'word',
                title: w.word,
                subtitle: w.pron ? `(${w.pron})` : '',
                desc: w.meaning,
                category: w.category || 'Vocabulary',
                url: `/dictionary/${w.slug}/`
            }));
            
            const articlesMapped = rawArticles.map(a => ({
                type: 'article',
                title: a.t,
                subtitle: '',
                desc: a.d,
                category: a.c || 'Lesson',
                url: a.u
            }));
            
            searchData = [...articlesMapped, ...wordsMapped];
            
            fuse = new Fuse(searchData, {
                keys: ['title', 'desc', 'category'],
                threshold: 0.3,
                includeScore: true,
                ignoreLocation: true
            });
            isDataLoaded = true;
            renderPlaceholder();
            
            // Re-trigger search if user typed while loading
            if (searchInput.value.trim().length > 0) {
                performSearch(searchInput.value.trim());
            }
        } catch (error) {
            console.error(error);
            searchResults.innerHTML = '<div class="search-placeholder"><p>Failed to load search data. Please refresh.</p></div>';
        }
    }

    function renderPlaceholder() {
        searchResults.innerHTML = `
            <div class="search-placeholder">
              <p class="search-hint">🔍 Type above — results will appear instantly</p>
            </div>
        `;
    }

    function performSearch(query) {
        if (!isDataLoaded || !fuse) return;
        
        if (query.trim() === '') {
            renderPlaceholder();
            return;
        }

        const results = fuse.search(query).slice(0, 50); // Limit to 50 results

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                  <p class="search-hint">No results found for "${query}"</p>
                </div>
            `;
            return;
        }

        let html = '<div class="search-results-list" role="listbox">';
        results.forEach(res => {
            const item = res.item;
            const badgeClass = item.type === 'article' ? 'badge-article' : 'badge-word';
            const badgeText = item.type === 'article' ? `📖 ${item.category}` : `🔤 ${item.category}`;
            
            html += `
                <a href="${item.url}" class="search-result-item" role="option" style="display: block; text-decoration: none; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.2s;">
                    <div class="search-result-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 1.1rem; color: var(--text-primary);">${item.title}</strong>
                        ${item.subtitle ? `<span class="search-result-pron" style="font-size: 0.85rem; color: var(--text-secondary);">${item.subtitle}</span>` : ''}
                        <span class="search-badge ${badgeClass}" style="
                          font-size: 0.7rem; 
                          padding: 2px 8px; 
                          border-radius: 20px; 
                          font-weight: 700; 
                          background: ${item.type === 'article' ? 'var(--accent-soft)' : 'rgba(16, 185, 129, 0.1)'};
                          color: ${item.type === 'article' ? 'var(--accent)' : '#10b981'};
                          border: 1px solid ${item.type === 'article' ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)'};
                        ">${badgeText}</span>
                    </div>
                    <div class="search-result-meaning" style="margin-top: 4px; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.4;">${item.desc}</div>
                </a>
            `;
        });
        html += '</div>';

        searchResults.innerHTML = html;
    }

    // Debounce search input
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 150);
    });
});
