/**
 * English Vidya - Home Page Redesign Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initWotdBookmark();
    initWotdSpeech();
    initQuickQuiz();
    initBottomNavHighlight();
});

// ─── 1. Word of the Day Bookmark ──────────────────────────────────────────
function initWotdBookmark() {
    const bookmarkBtn = document.getElementById('wotd-bookmark-btn');
    if (!bookmarkBtn) return;

    // Check saved state on load
    const savedWords = JSON.parse(localStorage.getItem('ev-saved-words') || '[]');
    const currentWord = document.getElementById('wotd-word-text')?.textContent.trim();
    
    if (currentWord && savedWords.includes(currentWord)) {
        bookmarkBtn.classList.add('saved');
    }

    bookmarkBtn.addEventListener('click', () => {
        if (!currentWord) return;
        let words = JSON.parse(localStorage.getItem('ev-saved-words') || '[]');
        
        if (words.includes(currentWord)) {
            words = words.filter(w => w !== currentWord);
            bookmarkBtn.classList.remove('saved');
            showToast('Word removed from saved list');
        } else {
            words.push(currentWord);
            bookmarkBtn.classList.add('saved');
            showToast('Word saved successfully!');
        }
        localStorage.setItem('ev-saved-words', JSON.stringify(words));
    });
}

// ─── 2. Word of the Day Speech ────────────────────────────────────────────
function initWotdSpeech() {
    const speakBtn = document.getElementById('wotd-speak-btn');
    const wordText = document.getElementById('wotd-word-text');
    if (!speakBtn || !wordText) return;

    speakBtn.addEventListener('click', () => {
        const text = wordText.textContent.trim();
        if (!text || !window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for clear pronunciation
        window.speechSynthesis.speak(utterance);
    });
}

// ─── 3. Quick Quiz ────────────────────────────────────────────────────────
const quizQuestions = [
    {
        q: "She <em>___</em> to the market yesterday.",
        options: [
            { text: "go", correct: false },
            { text: "went", correct: true },
            { text: "goes", correct: false },
            { text: "going", correct: false }
        ],
        hint: "💡 Past tense ka sochein — 'yesterday' ka hint hai!"
    },
    {
        q: "I have been living here <em>___</em> 2020.",
        options: [
            { text: "for", correct: false },
            { text: "from", correct: false },
            { text: "since", correct: true },
            { text: "in", correct: false }
        ],
        hint: "💡 Fixed starting point ke liye 'since' use hota hai."
    },
    {
        q: "He is good <em>___</em> English.",
        options: [
            { text: "in", correct: false },
            { text: "at", correct: true },
            { text: "with", correct: false },
            { text: "for", correct: false }
        ],
        hint: "💡 Kisi skill me achha hone ke liye 'good at' bolte hain."
    },
    {
        q: "Neither of the boys <em>___</em> present.",
        options: [
            { text: "was", correct: true },
            { text: "were", correct: false },
            { text: "have", correct: false },
            { text: "are", correct: false }
        ],
        hint: "💡 'Neither of' ke baad singular verb lagti hai."
    },
    {
        q: "Please turn <em>___</em> the lights before sleeping.",
        options: [
            { text: "out", correct: false },
            { text: "down", correct: false },
            { text: "off", correct: true },
            { text: "over", correct: false }
        ],
        hint: "💡 Lights band karne ke liye 'turn off' use karte hain."
    }
];

let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function initQuickQuiz() {
    renderQuiz();
}

function renderQuiz() {
    const qLabel = document.getElementById('quiz-counter');
    const qText = document.getElementById('quiz-question-text');
    const qOpts = document.getElementById('quiz-opts');
    const qHint = document.getElementById('quiz-hint-text');
    
    if (!qLabel || !qText || !qOpts || !qHint) return;
    
    const data = quizQuestions[currentQuizIndex];
    quizAnswered = false;
    
    qLabel.textContent = `${currentQuizIndex + 1}/${quizQuestions.length}`;
    qText.innerHTML = data.q;
    qHint.innerHTML = data.hint;
    qHint.style.opacity = '1';
    
    qOpts.innerHTML = '';
    data.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt.text;
        btn.onclick = () => handleQuizAnswer(btn, opt.correct);
        qOpts.appendChild(btn);
    });
}

function handleQuizAnswer(btn, isCorrect) {
    if (quizAnswered) return;
    quizAnswered = true;
    
    const qOpts = document.getElementById('quiz-opts');
    const buttons = qOpts.querySelectorAll('.quiz-opt');
    
    buttons.forEach(b => {
        b.style.pointerEvents = 'none'; // Disable all buttons
    });
    
    if (isCorrect) {
        btn.classList.add('correct');
        quizScore++;
        document.getElementById('quiz-score-display').textContent = `Score: ${quizScore}`;
        document.getElementById('quiz-hint-text').innerHTML = "✅ Bilkul Sahi!";
    } else {
        btn.classList.add('wrong');
        // Find and highlight correct answer
        const correctIndex = quizQuestions[currentQuizIndex].options.findIndex(o => o.correct);
        buttons[correctIndex].classList.add('correct');
        document.getElementById('quiz-hint-text').innerHTML = "❌ Galat Jawab!";
    }
    
    // Move to next question after delay
    setTimeout(() => {
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
            renderQuiz();
        } else {
            // Quiz finished
            document.getElementById('quiz-question-text').innerHTML = `Quiz Complete! You scored ${quizScore}/${quizQuestions.length}. 🎉`;
            document.getElementById('quiz-opts').innerHTML = '<button class="quiz-opt" style="grid-column: span 2; text-align: center;" onclick="resetQuiz()">Play Again</button>';
            document.getElementById('quiz-hint-text').innerHTML = "";
            document.getElementById('quiz-counter').textContent = "Done";
        }
    }, 1500);
}

window.resetQuiz = function() {
    currentQuizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-score-display').textContent = `Score: 0`;
    renderQuiz();
};

// ─── 4. Bottom Nav Highlight ──────────────────────────────────────────────
function initBottomNavHighlight() {
    // This assumes the bottom nav exists in index.html (which is likely part of app shell)
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;
    
    let highlight = document.querySelector('.nav-highlight');
    if (!highlight) {
        highlight = document.createElement('div');
        highlight.className = 'nav-highlight';
        bottomNav.appendChild(highlight);
    }
    
    const updateHighlight = () => {
        const activeItem = bottomNav.querySelector('.nav-item.active');
        if (activeItem) {
            const rect = activeItem.getBoundingClientRect();
            const navRect = bottomNav.getBoundingClientRect();
            highlight.style.width = `${rect.width * 0.8}px`;
            highlight.style.left = `${rect.left - navRect.left + (rect.width * 0.1)}px`;
            highlight.style.opacity = '1';
        } else {
            highlight.style.opacity = '0';
        }
    };
    
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    
    // Listen for SPA route changes to update highlight
    // Using MutationObserver on the nav items to detect class changes
    const observer = new MutationObserver(updateHighlight);
    bottomNav.querySelectorAll('.nav-item').forEach(item => {
        observer.observe(item, { attributes: true, attributeFilter: ['class'] });
    });
}

// ─── Utility ──────────────────────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
