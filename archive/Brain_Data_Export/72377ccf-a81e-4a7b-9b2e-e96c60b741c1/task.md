# English Vidya — Master TODO

## Quick Answers to Your Questions

### Q1: Devanagari Pronunciation?
✅ **YES** — Every English definition will have Devanagari pronunciation.
```
Grammar (ग्रैमर) = व्याकरण
Noun (नाउन) = संज्ञा
```
Already planned. Will add in every article + dictionary entry.

---

### Q2: Wikipedia-style Hover Tooltips?
✅ **YES** — Using `<span class="tooltip" data-word="noun">` + CSS/JS.
- **Hover** → Shows mini card: word, Hindi meaning, 1-line definition
- **Click** → Redirects to full article
- Data source: `search-index.json` (same file, no extra load)
- Works on mobile too (tap = show, double-tap = navigate)

---

### Q3: Clean URLs (no .html)?
✅ **YES** — Cloudflare Pages supports this natively.
**Method:** Folder-based routing.
```
INSTEAD OF:  /grammar/noun-system.html
WE USE:      /grammar/noun-system/index.html
SHOWS AS:    englishvidya.com/grammar/noun-system   ← Clean!
```
No server config needed. Cloudflare Pages auto-strips `/index.html`.

---

### Q4: JSON + SEO Impact?

> [!IMPORTANT]
> **Critical insight**: Google bot CANNOT read JS-loaded JSON content.

**Strategy: Hybrid Approach**
| Content Type | Where | SEO Impact |
|---|---|---|
| Definitions, headings, teacher intro, main content | **Static HTML** (in the `.html` file itself) | ✅ Full SEO — Google reads it |
| Collapsible examples (expandable 10-sentence sections) | **JSON → loaded by JS** | ⚠️ Neutral — supplementary content, Google doesn't need it |
| Dictionary data (A-Z word list) | **Static HTML** for first 20 words per letter + JSON for rest | ✅ Good SEO — key words visible to crawler |
| FAQ Schema, meta tags, breadcrumbs | **Static HTML** | ✅ Full SEO + AEO |

**AEO (Answer Engine Optimization) Strategy:**
- Your **definitions** = Static HTML → Google AI Overview picks them directly
- **FAQ Schema** (JSON-LD in `<script>` tag) = Google reads these even though they're JSON
- **Direct Answer Box** at top of each article = Voice search / ChatGPT / Perplexity picks this
- Collapsible JSON examples = NOT needed for AEO (they're for student learning, not bots)

**Result: JSON helps site speed + maintenance WITHOUT hurting SEO/AEO.**

---

### Q5: YouTube Video Teaching Plan?
✅ **Excellent idea.** Implementation plan:

**Now (Phase 1-6):**
- Every article page has an **empty video slot** ready at top
- HTML structure: `<div class="video-slot" data-video-id="">` 
- When you record a video → just add YouTube ID to the HTML

**Later (Phase 15):**
- Separate `/videos/` section with all videos organized by topic
- Video sitemap for YouTube SEO
- Lazy-load YouTube embeds (click-to-play for speed)

**Cost: ₹0** — YouTube hosts video, we just embed iframe.

---

### Q6: Quiz/Game/Exam + Mistake Tracking — When?
**Phase 16+ (After all content is live)**

Reason: Need content first, then interactive features.

**Implementation plan:**
1. **Phase 16**: Simple quiz at end of each article (MCQ from Tiny Practice)
2. **Phase 17**: Score tracking in `localStorage` (no server needed)
3. **Phase 18**: Mistake log → shows weak areas
4. **Phase 19**: Full game mode (fill-in-blank, drag-drop, timed quiz)
5. **Phase 20**: Leaderboard (needs Cloudflare D1 database)

---

## MASTER PROJECT PHASES

### Phase 0: Setup ← NEXT
- [ ] Create folder structure at `d:\English Vidya\website\`
- [ ] Setup clean URL folder pattern
- [ ] Create shared `_template.html` (header, nav, footer, tooltip, video slot)

### Phase 1: Design System
- [ ] `style.css` — dark premium theme, cards, collapsible, tooltip, responsive
- [ ] Google Fonts (Inter/Outfit)
- [ ] CSS variables for colors, spacing
- [ ] Print-friendly styles

### Phase 2: Core JavaScript
- [ ] `app.js` — navigation, breadcrumbs, search, progress bar, scroll-top
- [ ] `loader.js` — JSON fetcher, collapsible renderer, example injector
- [ ] `tooltip.js` — hover/tap word tooltip from search-index.json
- [ ] `dictionary.js` — A-Z filter, search, category switching

### Phase 3: Data Files
- [ ] `articles-index.json` — all 78 articles: slug, title, summary, phase, prev/next
- [ ] `search-index.json` — word → {meaning_hi, short_def, link} for tooltips
- [ ] `navigation.json` — breadcrumb paths

### Phase 4: Hub Article
- [ ] `index.html` — main landing page, all 78 links with summaries
- [ ] Internal search bar
- [ ] Phase-wise categorization

### Phase 5: Foundation Articles (Topics 1-6, Part 1)
- [ ] what-is-language/index.html
- [ ] types-of-language/index.html
- [ ] what-is-grammar/index.html
- [ ] what-is-english-grammar/index.html
- [ ] importance-of-grammar/index.html
- [ ] communication-basics/index.html
Source: part1.md lines 459–1109

### Phase 6: Sound Foundation (Topics 7-11, Part 2)
- [ ] alphabet-and-letters/index.html
- [ ] capital-small-letters/index.html
- [ ] vowels/index.html
- [ ] consonants/index.html
- [ ] basic-phonics/index.html
Source: part1.md lines 1109–2147

### Phase 7: Word & Sentence (Topics 12-16)
- [ ] what-is-word/index.html
- [ ] what-is-sentence/index.html
- [ ] sentence-structure/index.html
- [ ] word-order/index.html
- [ ] parts-of-speech-overview/index.html
Source: part1.md lines 2147–4530

### Phase 8: Core Grammar + JSON (Parts 17-22)
- [x] nouns.json + noun-system/index.html + common-noun-examples.json
- [x] pronouns.json + pronoun-system/index.html
- [x] adjectives.json + adjective-system/index.html
- [x] verbs.json + verb-system/index.html + verb-family/index.html
- [ ] Collapsible sections (3×10 examples each)
- [ ] Example collection pages
Source: part2.md lines 3–3455

### Phase 9: Core Grammar (Parts 23-28)
- [x] adverbs.json, prepositions.json, conjunctions.json, interjections.json
- [ ] adverb-system/index.html
- [ ] preposition-system/index.html
- [ ] conjunction-system/index.html
- [ ] interjection-system/index.html
- [x] number-person-agreement/index.html (sentence_construction.json)
- [x] sentence-construction-drill/index.html
Source: part2.md lines 3455–7055

### Phase 10: Tense System (Parts 29, 29L1-L4)
- [x] tenses.json (all 12 tenses data)
- [ ] tense-foundation/index.html
- [ ] simple-tenses/index.html
- [ ] continuous-perfect/index.html
- [ ] perfect-continuous/index.html
- [ ] tense-complex-patterns/index.html

### ⏳ Pending (To Be Executed by Gemini Subagents)
- [x] `foundation.json` (Topics 1-6: Language & Grammar Basics)
- [x] `phonics.json` (Topics 7-11: Sounds, Vowels, Consonants)
- [x] `word_sentence.json` (Topics 12-16: Word/Sentence structure)
- [x] `advanced_grammar_deep.json` (Part 30-31: Voice, Narration, Conditionals)
- [x] `mastery.json` (Part 32-70: Spoken, IELTS, Business, etc.)
- [x] `dictionary_full.json` (Massive A-Z AI Dictionary with Wikipedia Image URLs)

Source: part2.md lines 11283–end

### Phase 12: Smart Dictionary
- [x] dictionary.json (master A-Z, all words)
- [ ] vocab/dictionary/index.html (A-Z quick-look page)
- [ ] Category pages: family, emotions, food, actions, etc.
- [ ] Level pages: level-a, level-b, level-c
Source: word_meanings.md (research prompts → generate actual word data)

### Phase 13: Advanced Skills (Parts 32-48)
- [ ] 17 articles from part3.md
- [ ] Spoken, Vocabulary, Idioms, Competitive, Writing, AI, Teaching

### Phase 14: Professional & Mastery (Parts 49-70)
- [ ] 22 articles from part4.md + part5.md
- [ ] IELTS, Business, Content Creator, Linguistics, AI

### Phase 15: Video Integration
- [ ] YouTube embed slots activated on all articles
- [ ] /videos/ section page
- [ ] Video sitemap for SEO
- [ ] Lazy-load click-to-play

### Phase 16: SEO & Deploy
- [ ] sitemap.xml
- [ ] JSON-LD schema on all pages
- [x] llms.txt for AI Agent Readiness
- [ ] FAQ sections (long-tail keywords)
- [ ] robots.txt
- [ ] Deploy to Cloudflare Pages
- [ ] Upload large JSON to R2
- [ ] Connect englishvidya.com DNS
- [ ] PWA manifest + service worker

### Phase 17-20: Gamification (Future)
- [ ] MCQ quiz per article
- [ ] localStorage score tracking
- [ ] Mistake log + weak area analysis
- [ ] Game modes (fill-blank, drag-drop, timed)
- [ ] Leaderboard (Cloudflare D1)

---

## KEY ARCHITECTURE DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| Framework | None (Vanilla HTML/CSS/JS) | Fast on ₹5000 phones, zero build step |
| Data storage | JSON files | Reusable, single source of truth |
| Critical content | Static HTML | SEO/AEO friendly |
| Supplementary content | JSON+JS loaded | Fast page load, no SEO loss |
| URLs | Folder-based clean URLs | `/grammar/noun-system` not `.html` |
| Hosting | Cloudflare Pages | Free, global CDN |
| Large files | Cloudflare R2 | Zero egress cost |
| Videos | YouTube embed (lazy) | ₹0 hosting cost |
| Tooltips | CSS+JS hover cards | Wikipedia-style UX |
| Pronunciations | Devanagari in parentheses | (नाउन), (ग्रैमर) |
| User definitions | NEVER CHANGE | Sacred content |

---

## CURRENT STATUS
- [x] Raw data extracted (JSON → MD files)
- [x] Duplicate analysis done
- [x] Article breakdown planned (78 articles)
- [x] Architecture decided (JSON + Static HTML hybrid)
- [x] Hosting decided (Cloudflare Pages + R2)
- [x] Master TODO created
- [x] Premium interactive UI Demo built (demo.html)
- [x] Wikipedia-style tooltips and Devanagari pronunciations verified
- [ ] Phase 0: Folder structure & Shared Templates ← **START HERE**

