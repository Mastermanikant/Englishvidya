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
            searchResults.innerHTML = '<div class="search-placeholder"><p>Loading dictionary...</p></div>';
            const response = await fetch('/search-index.json');
            if (!response.ok) throw new Error('Failed to load search index');
            searchData = await response.json();
            
            fuse = new Fuse(searchData, {
                keys: ['word', 'meaning', 'pron'],
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
            searchResults.innerHTML = '<div class="search-placeholder"><p>Failed to load dictionary. Please refresh.</p></div>';
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
            html += `
                <a href="/dictionary/${item.slug}/" class="search-result-item" role="option">
                    <div class="search-result-title">
                        <strong>${item.word}</strong>
                        <span class="search-result-pron">(${item.pron})</span>
                    </div>
                    <div class="search-result-meaning">${item.meaning}</div>
                    <div class="search-result-category">${item.category}</div>
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
