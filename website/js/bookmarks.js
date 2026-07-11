// Bookmarks logic using LocalStorage
function getBookmarks() {
    try {
        const saved = localStorage.getItem('ev-bookmarks');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error parsing bookmarks:', e);
        return [];
    }
}

function saveBookmarks(bookmarks) {
    localStorage.setItem('ev-bookmarks', JSON.stringify(bookmarks));
}

function isBookmarked(slug) {
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.slug === slug);
}

function toggleBookmark(slug, word, meaning, pron, category) {
    let bookmarks = getBookmarks();
    const index = bookmarks.findIndex(b => b.slug === slug);
    const btn = document.getElementById(`bookmark-btn-${slug}`);
    
    if (index > -1) {
        // Remove bookmark
        const removed = bookmarks.splice(index, 1)[0];
        if (removed && removed.synced) {
            let toRemove = [];
            try {
                toRemove = JSON.parse(localStorage.getItem('ev-bookmarks-to-remove') || '[]');
            } catch (e) {
                console.error('Error parsing bookmarks to remove:', e);
            }
            if (!toRemove.includes(slug)) {
                toRemove.push(slug);
                localStorage.setItem('ev-bookmarks-to-remove', JSON.stringify(toRemove));
            }
        }
        if (btn) btn.innerHTML = '🤍';
        showToast(`Removed "${word}" from Favorites`);
    } else {
        // Add bookmark
        bookmarks.unshift({ slug, word, meaning, pron, category, addedAt: new Date().toISOString(), synced: false });
        if (btn) btn.innerHTML = '❤️';
        showToast(`Added "${word}" to Favorites`);
    }
    
    // Create animation effect
    if (btn) {
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
    }
    
    saveBookmarks(bookmarks);
    
    // Dispatch event so favorites page can update if it's open
    window.dispatchEvent(new Event('bookmarksUpdated'));
}

// showToast is now provided by /js/toast.js (unified version)


// On page load, initialize bookmark buttons state
document.addEventListener('DOMContentLoaded', () => {
    const btns = document.querySelectorAll('.bookmark-btn');
    btns.forEach(btn => {
        const slug = btn.id.replace('bookmark-btn-', '');
        if (isBookmarked(slug)) {
            btn.innerHTML = '❤️';
        }
    });
});
