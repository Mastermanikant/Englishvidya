# 🎓 English Vidya — Progress Tracker

This document tracks the current status, file organization, and overall development progress of the English Vidya platform.

---

## 📅 Last Updated: June 2, 2026

### 📂 Clean Folder Organization (Flat Hierarchy)
The codebase has been refactored to follow a clean, one-level subfolder design to maintain simple navigation for developers and AI agents alike:

* **`/archive`** - Stores deprecated/old versions and development log backups.
* **`/assets`** - Holds media assets and design mockups.
* **`/Final Data`** - Holds the final articles, project summaries, and developer guidelines/rules.
* **`/project_meta`** - Private planning files, developer diaries, and LLM context docs.
* **`/raw_content`** - Raw Markdown course guides divided by grammar, vocabulary, and technical units.
* **`/scratch`** - Active work-in-progress workspace divided into `/scripts`, `/drafts`, `/reports`, `/data`.
* **`/tools`** - Production developer utilities and processing scripts.
* **`/website`** - Production static assets (HTML/CSS/JS) and JSON databases served to client.

In addition, key documentation files (**`progress.md`** and **`llms.txt`**) are placed directly in the main folder (root directory) for immediate access.

---

## 📈 Recent Milestone: Reorganization & Optimization (June 2, 2026)

### 1. Root & Directory Restructuring
- **Archive Rename:** Renamed directory `Useless Files/` to `archive/` for professional coding structure.
- **Root Cleanup:** Created `/assets` and moved all unreferenced images out of the root folder.
- **Old Assets Relocated:** Created `archive/website_old/` and moved unused `old_index.html` and `old_app.js`.
- **Tools Consolidation:** Moved `process_dictionary.ps1` from `website/data/` to `tools/` folder.

### 2. Organized Scratchpad Workspaces
- Grouped 26 loose files in `scratch/` into structured subdirectories:
  - `scratch/scripts/` (for temporary scripts)
  - `scratch/drafts/` (for markdown lessons)
  - `scratch/reports/` (for category reports)
  - `scratch/data/` (for temporary json data)

### 3. Code, Path, and Consolidation Corrections
- Updated path dependencies from `Useless Files` to `archive` in `tools/recover_dictionary.js`, `tools/consolidate_categories.js`, and `cleanup_useless_files.ps1`.
- Corrected a syntax error comment corrupting the JSON formatting in `archive/old_master_versions/master_dictionary_FINAL_v5.json`.
- **Fixed Category Consolidation Bug:** Fixed a bug in `tools/consolidate_categories.js` that caused uncategorized words to be discarded, and resolved a self-reassignment loop that caused the deletion of categories with less than 15 words.
- **Verified 100% Data Integrity:** Wrote a verification script and confirmed that all 8,939 unique vocabulary words from the backups are fully preserved in the active categories.
- **Cleaned Up Archive backups:**
  - Overwrote `archive/old_master_versions/` to hold only `master_dictionary_FINAL_v7.json` and deleted obsolete v1-v5 files.
  - Replaced the micro-category backups in `archive/duplicate_vocabulary_backups/` with a copy of the clean consolidated categories.
  - Created `/Can Be Delete` at the root and moved all obsolete files (such as `demo.html`, `old_placeholder_modules/`, `website_old/`, `uuid_draft_logs/`) there for review.

### 4. Final Data Setup & Key References
- Created **`/Final Data`** folder to serve as the launchpad for new sessions.
- Copied the three final grammar articles written yesterday into `/Final Data/`:
  - `01_language_and_communication.md`
  - `02_grammar_and_sentence_structure.md`
  - `03_alphabet_phonics_and_pronunciation.md`
- Placed **`progress.md`**, **`llms.txt`**, **`summary_and_rules.md`**, **`codebase_rules.md`**, and **`AI_GUIDELINES.md`** directly in the root workspace directory as requested to keep all rules, guidelines, and trackers easily readable at the main folder level.

---

## 🚀 Recent Milestone: Bug Hunting & UI/UX Responsive Redesign (June 2, 2026)

### 1. Resolved Routing & View Bugs
- **Resolved View Stacking Bug:** Added explicit CSS rules for `.spa-view` and `.spa-view.active` in `website/css/style.css` to hide inactive sections, fixing the bug where clicking "हमारे बारे में" (About Us) kept the user stuck on the Home page.
- **Fixed basePath calculation:** Refactored the base URL matching logic in `website/js/app.js` to dynamically identify and strip top-level route slugs, resolving issues where direct deep reloads (e.g., `/grammar/nouns`) broke relative navigation.
- **Improved Accordion Spacing:** Relocated the category introduction text blocks (`intro`) into the collapsible body, styled with `white-space: pre-line` to prevent raw newlines from running together.

### 2. Built Premium Mobile Hamburger Drawer
- **Menu Trigger:** Added a CSS-responsive hamburger button in the sticky `.app-header` inside `website/index.html`.
- **Slide-out Navigation Drawer:** Added `#mobile-drawer-overlay` containing links to all views (Home, Grammar, Dictionary, Flashcards, Profile, About Us, Contact, Legal).
- **Responsive Animations:** Added drawer styling in `style.css` supporting touch-scrolling, a dark backdrop-blur, and sliding translation transitions on viewports `<768px`.
- **Event Listeners:** Programmed drawer triggers in `app.js` to open and close smoothly and highlight the active drawer links based on the active route.

### 3. Integrated Foundational Roadmap Lessons
- **Three Foundational Units:** Converted the three final articles in `/Final Data/` into JSON files and placed them in `website/data/grammar/lessons/`:
  - `language-and-communication.json` (Part 1)
  - `grammar-and-sentence-structure.json` (Part 2)
  - `alphabet-phonics-and-pronunciation.json` (Part 3)
- **Roadmap Syncing:** Updated `website/data/site/articles-index.json` to insert these lessons, shifting all 15 pre-existing units forward, and modified the `"part"` attribute of each active lesson file.

### 4. DOM Repairs & Housekeeping
- **Cleaned Nested Markup:** Found and resolved multiple leaked orphaned `</div>` tags in the columns of `index.html` that broke document boundaries.
- **Service Worker Version Bump:** Incremented the caching version to `ev-v3` in `service-worker.js` to invalidate stale client caches.
- **Obsolete Files Relocation:** Moved 69 inactive `part_*.json` backup files from the lessons directory to `Can Be Delete/` for cleanup.

---

## 🧭 Next Steps
- Implement plan to review duplications in `.md` files under the grammar folder.
- Enrich bilingual examples in lessons where content is marked as minimal.
- Review and delete `/Can Be Delete` directory after confirming contents are not needed.
