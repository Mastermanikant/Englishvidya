// Bookmarks logic using LocalStorage
function getBookmarks() {
    const saved = localStorage.getItem('ev-bookmarks');
    return saved ? JSON.parse(saved) : [];
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
        bookmarks.splice(index, 1);
        if (btn) btn.innerHTML = '🤍';
        showToast(`Removed "${word}" from Favorites`);
    } else {
        // Add bookmark
        bookmarks.unshift({ slug, word, meaning, pron, category, addedAt: new Date().toISOString() });
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

// Simple toast notification if no global toast system exists
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.style.background = 'var(--accent)';
    toast.style.color = '#fff';
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

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
