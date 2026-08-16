# 🎨 EnglishVidya — Frontend UI/UX & WCAG 2.1 AA/AAA Master Blueprint

> **Platform:** EnglishVidya (`https://englishvidya.com`)  
> **Audience:** Hindi-Medium Students (BSEB 12th, 10th, Grammar & Competitive Aspirants)  
> **Founder / Lead Educator:** Master Manikant  
> **Engineering Standard:** WCAG 2.1 AA/AAA Compliant, Mobile-First (Budget 4G Devices), Zero-Lag

---

## 📑 1. Core WCAG 2.1 Compliance Rules (Web Accessibility Standard)

### A. Perceivable (बोधगम्य)
1. **Color Contrast Ratios (WCAG AA & AAA):**
   * **Normal Text (Body & Explanations):** Minimum contrast ratio of `4.5:1` (Light: `#0f172a` on `#ffffff` = `16.1:1`; Dark: `#f8fafc` on `#0f172a` = `15.8:1`).
   * **Large Text & Headings:** Minimum contrast ratio of `3:1`.
   * **Muted / Secondary Text:** `#5a6a7d` (minimum `4.6:1` on light background).
2. **Text Resizing & Scalability:**
   * Support up to `200%` zoom without layout breaking or horizontal scrolling.
   * Native Font Resizer `[ A- | A+ ]` available on all study pages.
3. **Alternative Text & Media:**
   * All meaningful images have descriptive `alt` text.
   * All decorative SVGs/icons have `aria-hidden="true"`.

### B. Operable (संचालन योग्य)
1. **Full Keyboard Navigation:**
   * Every link, button, accordion, and interactive element is reachable via `Tab` / `Shift+Tab` and triggerable via `Enter` or `Space`.
   * **Skip to Main Content:** First interactive element on every page (`.skip-to-content`).
2. **Visible Focus Rings:**
   * High-contrast `:focus-visible` outline (`2px solid #0ea5e9` with `2px offset`) on all interactive controls.
3. **Touch Targets (Mobile Friendly):**
   * Minimum `44px × 44px` touch target size for all buttons, links, search triggers, and alphabet filters.

### C. Understandable (सुबोध व स्पष्ट)
1. **Language Specification:**
   * Root HTML tag specifies `lang="hi"` with font fallbacks for Devanagari (`Noto Sans Devanagari`) and English (`Inter`).
2. **Consistent Navigation & Predictable UI:**
   * Global Header, Sidebar, Breadcrumbs, and 4-Column Footer maintain identical positioning across all 614 pages.
3. **Error Identification & Input Labels:**
   * Search inputs and forms have explicit `<label>` or `aria-label`.

### D. Robust (सुदृढ़)
1. **Clean Semantic HTML5 Elements:**
   * Use of `<header>`, `<nav>`, `<main id="app-content">`, `<section>`, `<article>`, `<aside>`, and `<footer>`.
2. **Live Feedback:**
   * Dynamic notifications and sync toasts use `role="status"` or `aria-live="polite"`.

---

## 🏛️ 2. Comprehensive Frontend Page Architecture

```
                               ┌────────────────────────────────┐
                               │  Global Sticky Header (Blur)   │
                               │  Logo | Nav | Search | Auth    │
                               └──────────────┬─────────────────┘
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         │                                    │                                    │
         ▼                                    ▼                                    ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  Academic Hubs   │               │ Chapter Reader   │               │ Student Tools    │
│  - BSEB 12th     │               │ - Sticky Bar     │               │ - My Diary       │
│  - BSEB 10th     │               │ - Audio (3-speed)│               │ - Word of Day    │
│  - Grammar L1-L5 │               │ - Word Tooltips  │               │ - Flashcards     │
│  - A-Z Dictionary│               │ - 10-MCQ Quiz    │               │ - Dashboard      │
└──────────────────┘               └──────────────────┘               └──────────────────┘
                                              │
                               ┌──────────────┴─────────────────┐
                               │  WordPress 4-Column Footer     │
                               │  Brand | Portals | Tools | Law │
                               └────────────────────────────────┘
```

---

## 🎨 3. Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --slate: #0f172a;       /* Base dark & text */
  --slate2: #172033;      /* Dark raised card */
  --blue: #0ea5e9;        /* Sky Blue Accent */
  --blue2: #38bdf8;       /* Highlight Accent */
  --white: #ffffff;       /* Pure White base */
  --muted: #5a6a7d;       /* High-contrast muted text */
  --line: #e2e8f0;        /* Subtle crisp borders */
  --bg: #f8fafc;          /* Warm Slate Light Background */
  --green: #10b981;       /* Academic Success / Progress */
  --amber: #f59e0b;       /* Warning / Guest sync status */

  /* Typography */
  --font-en: 'Inter', -apple-system, sans-serif;
  --font-hi: 'Noto Sans Devanagari', sans-serif;
  --line-height-reading: 1.8;
}
```

---

## 🚀 4. Step-by-Step Implementation Matrix

| Module | Component | WCAG Status | Implementation Plan |
|---|---|---|---|
| **Header** | Skip-to-content link | ✅ Applied | Keyboard accessible on Tab press. |
| **Header** | Focus visible rings | ✅ Applied | 2px Sky Blue outline on all buttons. |
| **Homepage** | Clean Editorial Layout | ✅ Applied | Exact prototype with SVO card, stats, hubs & A-Z bar. |
| **Footer** | 4-Column Legal & Links | ✅ Applied | Accessible semantic list navigation. |
| **Reader** | Reading Progress Bar | ✅ Applied | Passive scroll tracker. |
| **Reader** | 10-MCQ Chapter Quizzes | 🔄 Phase 4 | High-contrast instant self-test at bottom of chapters. |
| **Dictionary** | 19,000 Words Tooltips | 🔄 Phase 4 | Clickable word popup without server calls. |

---
*Created and maintained autonomously under Master Manikant Central Command.*
