/**
 * English Vidya — Home Page Premium Interactions v3
 * Expand/Collapse · WOTD Swipe · Quiz · Bookmark · Speech · Nav Highlight
 */

document.addEventListener('DOMContentLoaded', () => {
    initSectionToggles();
    initWotdBookmark();
    initWotdSpeech();
    initWotdNavigation();
    initQuickQuiz();
    initBottomNavHighlight();
    initProgressDisplay();
});

// ─── 0. Section Expand/Collapse ───────────────────────────────────────────
function initSectionToggles() {
    const togglePairs = [
        { btn: 'toggle-progress', content: 'progress-content' },
        { btn: 'toggle-wotd',     content: 'wotd-content' },
        { btn: 'toggle-modules',  content: 'modules-content' }
    ];

    togglePairs.forEach(({ btn, content }) => {
        const toggleBtn = document.getElementById(btn);
        const contentEl = document.getElementById(content);
        if (!toggleBtn || !contentEl) return;

        // Restore saved state from localStorage
        const savedState = localStorage.getItem('ev-section-' + btn);
        if (savedState === 'collapsed') {
            contentEl.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
        }

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = contentEl.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed', isCollapsed);
            localStorage.setItem('ev-section-' + btn, isCollapsed ? 'collapsed' : 'expanded');
        });
    });
}

// ─── 0b. Progress Display — "Not Started" → Number ───────────────────────
function initProgressDisplay() {
    // If user has actual progress stored, replace "Not Started" with numbers
    const lessons = parseInt(localStorage.getItem('ev-stat-lessons') || '0');
    const words   = parseInt(localStorage.getItem('ev-stat-words') || '0');
    const xp      = parseInt(localStorage.getItem('ev-stat-xp') || '0');

    if (lessons > 0) updateStat('stat-lessons', lessons);
    if (words > 0)   updateStat('stat-words', words);
    if (xp > 0)      updateStat('stat-xp', xp);
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ─── 1. Word of the Day Bookmark ──────────────────────────────────────────
function initWotdBookmark() {
    const bookmarkBtn = document.getElementById('wotd-bookmark-btn');
    if (!bookmarkBtn) return;

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
            showToast('शब्द हटा दिया गया');
        } else {
            words.push(currentWord);
            bookmarkBtn.classList.add('saved');
            showToast('शब्द सहेज लिया गया! ✅');
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
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    });
}

// ─── 2b. Word of the Day Navigation (Previous Words) ─────────────────────
const pastWords = [
    {
        word: 'Resilient', phonetic: '/rɪˈzɪl.i.ənt/', pos: 'adjective',
        def: 'Able to recover quickly from difficulties; tough and adaptable.',
        hi: 'लचीला — कठिनाइयों से जल्दी उबरने वाला',
        example: '"She showed a <em>resilient</em> spirit even after many setbacks."'
    },
    {
        word: 'Gratitude', phonetic: '/ˈɡræt.ɪ.tjuːd/', pos: 'noun',
        def: 'The quality of being thankful; readiness to show appreciation.',
        hi: 'कृतज्ञता — आभार प्रकट करने का भाव',
        example: '"He expressed deep <em>gratitude</em> for their help."'
    },
    {
        word: 'Diligent', phonetic: '/ˈdɪl.ɪ.dʒənt/', pos: 'adjective',
        def: 'Having or showing care and effort in one\'s work or duties.',
        hi: 'परिश्रमी — अपने काम में मेहनती और ध्यान देने वाला',
        example: '"A <em>diligent</em> student always completes homework on time."'
    },
    {
        word: 'Ambiguous', phonetic: '/æmˈbɪɡ.ju.əs/', pos: 'adjective',
        def: 'Open to more than one interpretation; not having one obvious meaning.',
        hi: 'अस्पष्ट — जिसका एक से अधिक अर्थ निकल सके',
        example: '"The instructions were <em>ambiguous</em> and confused everyone."'
    },
    {
        word: 'Endeavor', phonetic: '/ɪnˈdev.ər/', pos: 'noun / verb',
        def: 'An attempt to achieve a goal; to try hard to do or achieve something.',
        hi: 'प्रयास — किसी लक्ष्य को पाने की कोशिश',
        example: '"She will <em>endeavor</em> to improve her English every day."'
    }
];

let wotdOffset = 0; // 0 = today, -1 = yesterday, etc.

function initWotdNavigation() {
    const prevBtn = document.getElementById('wotd-prev-btn');
    const nextBtn = document.getElementById('wotd-next-btn');
    if (!prevBtn) return;

    // Store today's word data
    pastWords.unshift({
        word: document.getElementById('wotd-word-text')?.textContent.trim() || 'Eloquent',
        phonetic: document.getElementById('wotd-phonetic-text')?.textContent.trim() || '/ˈel.ə.kwənt/',
        pos: document.getElementById('wotd-pos-text')?.textContent.trim() || 'adjective',
        def: document.getElementById('wotd-def-text')?.textContent.trim() || '',
        hi: document.getElementById('wotd-hi-text')?.textContent.trim() || '',
        example: document.getElementById('wotd-ex-text')?.innerHTML || ''
    });

    prevBtn.addEventListener('click', () => navigateWotd(1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateWotd(-1));
}

function navigateWotd(direction) {
    wotdOffset += direction;
    const maxOffset = pastWords.length - 1;
    wotdOffset = Math.max(0, Math.min(maxOffset, wotdOffset));

    const data = pastWords[wotdOffset];
    if (!data) return;

    // Update DOM
    const wordEl = document.getElementById('wotd-word-text');
    const phoneticEl = document.getElementById('wotd-phonetic-text');
    const posEl = document.getElementById('wotd-pos-text');
    const defEl = document.getElementById('wotd-def-text');
    const hiEl = document.getElementById('wotd-hi-text');
    const exEl = document.getElementById('wotd-ex-text');
    const dayEl = document.getElementById('wotd-day-indicator');
    const prevBtn = document.getElementById('wotd-prev-btn');
    const nextBtn = document.getElementById('wotd-next-btn');

    if (wordEl) wordEl.textContent = data.word;
    if (phoneticEl) phoneticEl.textContent = data.phonetic;
    if (posEl) posEl.textContent = data.pos;
    if (defEl) defEl.textContent = data.def;
    if (hiEl) hiEl.textContent = data.hi;
    if (exEl) exEl.innerHTML = data.example;

    // Update day indicator
    if (dayEl) {
        if (wotdOffset === 0) dayEl.textContent = 'आज';
        else if (wotdOffset === 1) dayEl.textContent = 'कल';
        else dayEl.textContent = `${wotdOffset} दिन पहले`;
    }

    // Update button states
    if (prevBtn) {
        const canGoPrev = wotdOffset < maxOffset;
        prevBtn.style.opacity = canGoPrev ? '1' : '0.4';
        prevBtn.style.pointerEvents = canGoPrev ? 'auto' : 'none';
    }
    if (nextBtn) {
        const canGoNext = wotdOffset > 0;
        nextBtn.style.opacity = canGoNext ? '1' : '0.4';
        nextBtn.style.pointerEvents = canGoNext ? 'auto' : 'none';
    }

    // Update bookmark state for new word
    const bookmarkBtn = document.getElementById('wotd-bookmark-btn');
    if (bookmarkBtn) {
        const savedWords = JSON.parse(localStorage.getItem('ev-saved-words') || '[]');
        bookmarkBtn.classList.toggle('saved', savedWords.includes(data.word));
    }
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
        b.style.pointerEvents = 'none';
    });

    if (isCorrect) {
        btn.classList.add('correct');
        quizScore++;
        document.getElementById('quiz-score-display').textContent = `Score: ${quizScore}`;
        document.getElementById('quiz-hint-text').innerHTML = "✅ बिल्कुल सही!";
    } else {
        btn.classList.add('wrong');
        const correctIndex = quizQuestions[currentQuizIndex].options.findIndex(o => o.correct);
        buttons[correctIndex].classList.add('correct');
        document.getElementById('quiz-hint-text').innerHTML = "❌ ग़लत जवाब!";
    }

    setTimeout(() => {
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
            renderQuiz();
        } else {
            document.getElementById('quiz-question-text').innerHTML =
                `Quiz पूरी! आपका स्कोर: ${quizScore}/${quizQuestions.length} 🎉`;
            document.getElementById('quiz-opts').innerHTML =
                '<button class="quiz-opt" style="grid-column: span 2; text-align: center;" onclick="resetQuiz()">🔄 फिर से खेलें</button>';
            document.getElementById('quiz-hint-text').innerHTML = "";
            document.getElementById('quiz-counter').textContent = "Done";
        }
    }, 1400);
}

window.resetQuiz = function() {
    currentQuizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-score-display').textContent = 'Score: 0';
    renderQuiz();
};

// ─── 4. Bottom Nav Highlight ──────────────────────────────────────────────
function initBottomNavHighlight() {
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

    const observer = new MutationObserver(updateHighlight);
    bottomNav.querySelectorAll('.nav-item').forEach(item => {
        observer.observe(item, { attributes: true, attributeFilter: ['class'] });
    });
}

// ─── Utility: Toast ───────────────────────────────────────────────────────
function showToast(msg) {
    // Try using existing toast container first
    const container = document.getElementById('toast-container');
    if (container) {
        const toast = document.createElement('div');
        toast.className = 'toast-item';
        toast.textContent = msg;
        toast.style.cssText = `
            background: var(--bg-raised);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 10px 18px;
            border-radius: var(--radius-lg);
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            animation: fade-up 0.3s var(--ease-out);
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
        return;
    }

    // Fallback
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
