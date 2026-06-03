# Module 6: UI/UX Blueprint & Mobile-First Design - English Vidya

## 1. Low-End Android Compatibility Principles
In rural India, budget smartphones (often priced sub-₹10,000 / $120, running older Android versions like 10, 11, or Go Editions) are the primary hardware access points. These devices suffer from:
* **Slow CPUs:** High JavaScript execution overhead freezes the browser UI thread (causing hydration delay and input lag).
* **Limited RAM (2GB - 3GB):** Large page sizes crash the browser tab or close background tabs.
* **Low-resolution screens:** Complex layouts with multiple sidebars break and create horizontal scrolling bugs.

### Performance Design Constraints
1. **Zero Render-Blocking JS:** Avoid heavy modern React/Vue frameworks. We use native **Vanilla HTML/CSS/TypeScript** to keep our static payload size under 50KB.
2. **Minimal DOM Nodes:** A maximum of 1,000 DOM nodes per page to ensure fast, low-memory scrolling.
3. **No Heavy Web Fonts:** Standard text defaults to native system font stacks (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Oxygen`, `Ubuntu`, `Cantarell`, `"Fira Sans"`, `"Droid Sans"`, `"Helvetica Neue"`, `sans-serif`) before falling back to Outfit/Inter, preventing visual layout shifts (FOUT) during slow 3G asset loading.

---

## 2. Premium Design System (HSL Color Palette)
We completely reject default primary colors (raw `#FF0000` red, `#0000FF` blue) and standard Bootstrap styles. English Vidya uses a highly polished, premium HSL-tailored dark and light palette designed to look professional, sleek, and reduce eye strain during long night reading sessions.

### Visual Palette Token Definitions

```css
/* Core Styling Variables inside d:\English Vidya\index.css */
:root {
  /* Premium Slate Dark Mode Palette (Default) */
  --bg-primary: hsl(222, 47%, 11%);       /* Rich Dark Blue-Slate */
  --bg-secondary: hsl(223, 47%, 16%);     /* Dark Slate Lighter */
  --accent-primary: hsl(142, 70%, 45%);    /* Premium Emerald Green */
  --accent-secondary: hsl(190, 90%, 45%);  /* Modern Electric Cyan */
  
  --text-primary: hsl(210, 40%, 96%);      /* Off-White text */
  --text-secondary: hsl(215, 20%, 65%);    /* Sleek muted grey-blue */
  
  --border-color: hsl(217, 32%, 22%);      /* Subtle border accent */
  
  /* HSL Soft Accent Highlights for study materials */
  --hi-grammar: hsl(142, 70%, 95%);
  --hi-vocab: hsl(190, 90%, 95%);
  
  --shadow-premium: 0 10px 30px -15px rgba(2, 6, 23, 0.7);
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}

/* Optional Class Light Mode Toggle */
.light-mode {
  --bg-primary: hsl(210, 40%, 98%);       /* Pure Soft White-Grey */
  --bg-secondary: hsl(0, 0%, 100%);       /* Crisp White Card */
  --accent-primary: hsl(142, 76%, 36%);    /* Deep Emerald Green */
  --accent-secondary: hsl(190, 95%, 39%);  /* Rich Blue-Cyan */
  
  --text-primary: hsl(222, 47%, 11%);      /* Rich Dark Slate Text */
  --text-secondary: hsl(215, 16%, 47%);    /* Muted Slate Grey */
  
  --border-color: hsl(214, 32%, 91%);      /* Subtle Light grey border */
}
```

---

## 3. UI Component Wireframe Specifications

### Component A: Distraction-Free Study View Layout
The lesson page is designed like a book, stripping away widgets, notifications, sidebars, and unrelated links to maximize retention.

```
+---------------------------------------------------------+
| [<- Back]              English Vidya       [Dark/Light] |
+---------------------------------------------------------+
|                                                         |
|  Topic 17: Noun System Deep Study (संज्ञा का गहरा अध्ययन)   |
|  [|||||||........ Progress 45% ]                       |
|                                                         |
|  +---------------------------------------------------+  |
|  |                  YouTube Lesson                   |  |
|  |                  [ Video Embed ]                  |  |
|  +---------------------------------------------------+  |
|                                                         |
|  बच्चों, आज हम Noun के आधुनिक प्रकारों को समझेंगे...  |
|                                                         |
|  Traditional classifications are:                       |
|  1. Proper Noun (व्यक्तिवाचक संज्ञा)                    |
|  2. Common Noun (जातिवाचक संज्ञा)                      |
|                                                         |
|  +---------------------------------------------------+  |
|  | Quick Check: Which one is a Proper Noun?          |  |
|  | (A) Boy    (B) Rahul    (C) Dog                   |  |
|  +---------------------------------------------------+  |
|                                                         |
|  [Bookmark Lesson]                 [Mark Completed]    |
+---------------------------------------------------------+
```

---

## 4. Interactive Bilingual widgets

### Component B: Dynamic Pronunciation Assistant Card
For rural learners, pronouncing English words correctly builds immediate confidence. We design an interactive, highly visual widget that combines the Devanagari guide with native audio playback.

```html
<div class="pronunciation-card">
  <div class="word-header">
    <h3>Beautiful</h3>
    <span class="pos-badge">Adjective</span>
  </div>
  
  <div class="devanagari-helper">
    <span class="label">Pronunciation (उच्चारण):</span>
    <span class="pronounce-text">ब्यूटिफुल /byoo-tee-ful/</span>
  </div>
  
  <div class="audio-action-row">
    <button class="btn-play" onclick="speakText('beautiful')" aria-label="Play Native Pronunciation">
      <svg class="icon-speaker" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
      Listen Pronunciation (उच्चारण सुनें)
    </button>
  </div>
</div>
```

```css
/* Card Styling */
.pronunciation-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-premium);
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.word-header h3 {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--accent-secondary);
  margin: 0;
}
.pos-badge {
  background: hsla(190, 90%, 45%, 0.15);
  color: var(--accent-secondary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.devanagari-helper .pronounce-text {
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--text-primary);
  margin-left: 8px;
}
.btn-play {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.btn-play:hover {
  transform: translateY(-2px);
}
```

### Component C: Sentence Drill Interaction Layer (muscular recall)
Allows students to practice translation patterns seamlessly with simple click-to-reveal cards:

```
+-----------------------------------------------------+
| Pattern: "I write" (मैं लिखता हूँ)                   |
+-----------------------------------------------------+
| Translate: "वह नहीं लिखती है"                       |
|                                                     |
| [ Tap to reveal English Answer / उत्तर देखने के लिए टैप करें ] |
|                                                     |
| +-------------------------------------------------+ |
| | Reveal: "She does not write."                   | |
| | Audio: [Play Pronunciation]                     | |
| +-------------------------------------------------+ |
+-----------------------------------------------------+
```

---

## 5. Premium Micro-Interactions & Transitions
A fluid interface keeps the student engaged and excited to study.
* **Ripple Click Effects:** Standard buttons trigger CSS scale transitions on active clicks: `transform: scale(0.97)` to mimic native Android UI clicks.
* **Progress Bar Transitions:** When a student checks a topic as completed, the top-mounted global progress bar transitions smoothly using CSS: `transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1)`.
* **Pulse Helper Hints:** When an interactive audio helper is available, a subtle green pulse effect guides the beginner student to press the speaker button.
```css
@keyframes pulse-emerald {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
.pulse-hint {
  animation: pulse-emerald 2s infinite;
}
```
* **Page Transitions:** Dynamic view switching triggers hardware-accelerated transforms: `transform: translate3d(0, 0, 0)` for zero layout stutter.
