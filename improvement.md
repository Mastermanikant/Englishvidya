# English Vidya - Detailed Bug & UI/UX Improvement Report

## 1. Directory & File Structure
```
website/
├── css/
│   ├── style.css
│   └── home-redesign.css
├── data/
│   ├── dictionary/ (JSON files)
│   ├── grammar/ (JSON files)
│   ├── site/ (JSON files)
│   └── vocabulary/ (JSON files)
├── examples/
├── grammar/
├── icons/
├── js/
│   ├── app.js
│   └── home-redesign.js
├── mockups/
├── vocab/
├── index.html
├── 404.html
├── _template.html
├── manifest.json
├── robots.txt
├── service-worker.js
└── llms.txt
```

## 2. Technical Bugs Found (Must Fix)
1. **Malformed HTML in `index.html`**:
   - At line ~11: `<comment-tag id="1">` around `<meta name="theme-color">` in `<head>` is invalid and breaks parsing. Needs to be replaced with standard `<meta>` tags or removed.
   - At line ~665: `required</comment-tag id="2"` inside the contact form is a severe syntax error. The `<input>` tag is missing the closing `>` bracket. It should be `required>`.
2. **Missing Fallbacks in `js/`**:
   - Ensure `app.js` handles cases where elements like `#quiz-opts` or `#activity-tracker-tree-root` are not found on non-home pages, to prevent `null` reference errors.
3. **PWA Offline Mode**:
   - Ensure `service-worker.js` caches `home-redesign.css` and `home-redesign.js` since they are newly added.

## 3. UI/UX Improvements (Student Perspective)

### A. Mobile Experience (Difficulty & Fixes)
- **Issue:** The bottom of the screen (especially on iOS) can interfere with sticky headers or bottom navigation.
- **Fix:** Ensure safe area insets are respected (`padding-bottom: env(safe-area-inset-bottom)`).
- **Issue:** Tap targets (like Quiz options, Next/Prev word buttons) might be too small or too close together.
- **Fix:** Increase `min-height` of all interactive buttons to `48px` (minimum accessible touch target size).
- **Issue:** The drawer menu (`#mobile-drawer`) might not trap focus, meaning screen readers can scroll the body behind it.
- **Fix:** Implement focus trapping inside the mobile menu and disable body scroll when open (`overflow: hidden`).

### B. PC/Desktop Experience (Difficulty & Fixes)
- **Issue:** The main content sections (`.spa-view`) might stretch too wide on ultrawide monitors, making text hard to read.
- **Fix:** Add a `max-width: 1200px` and `margin: 0 auto` to the main container.
- **Issue:** Hover states are missing or not distinct enough on the new "Premium Glassmorphic" cards.
- **Fix:** Add subtle `transform: translateY(-2px)` and glow effects (`box-shadow`) on hover for desktop users on `.module-card` and `.task-info`.
- **Issue:** Keyboard accessibility (Tab navigation) is not visually clear.
- **Fix:** Add a distinct `:focus-visible` outline for all interactive elements to help keyboard navigators.

## 4. Instructions for Coding Agent (JSON Format for easy parsing)
```json
{
  "tasks": [
    {
      "file": "website/index.html",
      "action": "Remove <comment-tag id='1'> from <head> and fix the meta theme-color tags."
    },
    {
      "file": "website/index.html",
      "action": "Fix syntax error at line ~665: change 'required</comment-tag id=\"2\"' to 'required>' and remove the comment tag."
    },
    {
      "file": "website/css/style.css",
      "action": "Add focus-visible accessibility styles and min-height: 48px for all mobile buttons."
    },
    {
      "file": "website/css/home-redesign.css",
      "action": "Add max-width: 1200px to main container, and hover effects (translateY) for desktop cards."
    },
    {
      "file": "website/js/app.js",
      "action": "Implement body scroll lock when mobile drawer or search overlay is active."
    }
  ]
}
```
