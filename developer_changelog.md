# Developer Changelog & Technical Notes
**Project:** EnglishVidya.com
**Purpose:** Technical log of all features built, challenges faced, and how they were implemented. This can be used later to write blog posts or articles about the website's development journey.

## Phase 1: Core Content System & Build Optimization
- **The Challenge:** The project had 19,773 words spread across multiple Excel files. We needed to convert this into a usable web format without making the website slow.
- **The Solution:** 
  - Created a robust Node.js script (`excel_to_json.js`) to parse `.xlsx` files using `xlsx` library and convert them into categorized `.json` files.
  - Implemented an `allWords.js` script to dynamically expose these JSON words to Eleventy (11ty) during build time.
  - Developed `eleventy.config.js` to manage passthrough copies, filters, and shortcodes.

## Phase 2: UI Enhancements & Dictionary Integration
- **Flashcard App UI:** 
  - Converted the old vocabulary tables into an interactive, mobile-first Flashcard system (`website/js/app.js`). 
  - Implemented 5-column display support: Word, Pronunciation (Devanagari), Meaning (Hindi), Definition (English), and Example sentences.
- **Image Integration:**
  - Built an automated scraper (`download_images.js`) to fetch placeholder images from Wikipedia for specific categories (e.g., Fruits).
  - Wired the flashcard UI to dynamically display these images (`/assets/images/flashcards/{slug}.jpg`).
- **Dictionary Page:**
  - Removed the "Coming Soon" page and built a dynamic category grid in `src/dictionary/index.njk`.
  - Created `src/dictionary/category.njk` to display the full list of words using client-side JavaScript, fetching the JSON files asynchronously to keep the initial page load fast.
- **Auto-Word Count Script:**
  - Built `scripts/update_counts.js` to automatically parse all category JSON files and update the true word counts in `categories-index.json`.

## Phase 3: Teacher-Friendly UX Adjustments
- **Reading Width:** Adjusted the global `--max-width` in `style.css` from `720px` to `1000px` to balance optimal line length with modern desktop monitor sizes.
- **Floating "Aa" Widget:**
  - Fixed an issue where dragging was limited; it is now fully omnidirectional using touch and mouse events.
  - Added a **"⛶ Teacher Full Screen"** button.
  - Used the native browser `Fullscreen API` (`document.documentElement.requestFullscreen()`) to hide browser tabs and taskbars during teaching.
  - Added CSS (`body.presenter-mode`) to hide headers/footers and maximize content width to 96% with safe padding from the screen edges.
- **Brand Protection (Piracy Prevention):**
  - Designed a CSS-only animated watermark (`#ev-watermark`) that floats randomly across the screen in Teacher Mode. It uses `@keyframes` for position rotation and opacity pulsing (2% to 6%) to prevent screen recording theft without distracting students.

## Phase 4: Advanced Flashcard Settings & Auto-Play (Current)
- **Concept:** Teachers and students needed more control over the Flashcard view, especially for "Fast Revision" where all content appears on the front face.
- **Implementation (Ongoing):**
  - Removing Pronunciation from the front face by default to encourage active recall.
  - Building a Settings Modal to toggle what appears on the front/back faces.
  - Building a dual-timer Auto-Play system (Timer X for Front View, Timer Y for Back View) using strict `setTimeout` and `clearTimeout` logic to prevent memory leaks and chaotic overlaps.

## Phase 5: Image Format Migration & Monetization Layout
- **Image Optimization:** 
  - Wrote a Node script using the `sharp` library to batch convert all `.jpg` flashcard images to `.webp`.
  - Updated all image sources across the project (`website/js/app.js`, `src/dictionary/category.njk`) to use the `.webp` extension, vastly improving load times.
- **Responsive Ad Sidebar (2-Column Layout):**
  - Redesigned `article.njk` and `grammar-lesson.njk` to utilize a CSS Grid layout.
  - Created a 2-column structure for desktop (`min-width: 1024px`) with a primary content area and a `300px` right sidebar. This sidebar acts as an empty placeholder for future monetization (Google AdSense, etc.).
  - Ensured the layout remains a single stacked column on mobile devices for ease of reading.
- **Text Zoom Accessibility:**
  - Expanded the custom floating text scaler widget's limits. Users can now zoom out to a minimum of 50% and zoom in up to a maximum of 200%.
