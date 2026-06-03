# 🎓 English Vidya — Core Summary & Agent Guidelines

यह फ़ाइल AI एजेंट के लिए एक त्वरित संदर्भ (Quick Reference Guide) है। जब भी आप इस प्रोजेक्ट पर काम शुरू करें, इसे अवश्य पढ़ें ताकि सभी नियमों और संरचना का सही ढंग से पालन किया जा सके।

---

## 📋 1. Project Overview & Architecture
* **English Vidya** एक द्विभाषी (Bilingual - English & Hindi) व्याकरण और स्पोकन इंग्लिश लर्निंग प्लेटफॉर्म है।
* यह पूरी तरह से **Vanilla HTML, CSS, and JS** पर आधारित है (बिना किसी भारी फ्रेमवर्क के)।
* **Content/Database Separation:** व्याकरण और शब्दकोश (vocabulary) की प्रविष्टियाँ `/website/data/` में JSON फाइलों में संग्रहीत हैं।
* **Core Engines:**
  - **Hybrid Router:** ऑनलाइन होने पर क्लीन यूआरएल (HTML5 History API) और स्थानीय/ऑफ़लाइन होने पर हैश फ़ॉलबैक (Hash fallback `file:///` पर)।
  - **Theme Reveal Wave Engine:** क्लिक सेंटर से डार्क/लाइट मोड में गोलाकार वेव एनीमेशन।
  - **Fuzzy Search:** `search-index.json` के माध्यम से 150ms डीबाउंस्ड क्लाइंट-साइड त्वरित खोज।
  - **Space-Repetition Flashcards:** LocalStorage (`ev-fc-progress`) पर आधारित प्रोग्रेस रेटिंग डेक।

---

## 📂 2. Directory Structure (Flat Hierarchy)
प्रोजेक्ट में फ़ोल्डर्स को 1-लेवल की सरल पदानुक्रम (Flat hierarchy) में व्यवस्थित किया गया है:

* **`/Final Data`** - अंतिम व्याकरण लेख (Final articles - unit_1) का फ़ोल्डर।
* **`/website`** - प्रोडक्शन वेबसाइट कोड (HTML/CSS/JS) और लाइव डेटाबेस JSONs।
* **`/tools`** - सक्रिय डेवलपर स्क्रिप्ट और प्रोसेसिंग यूटिलिटीज।
* **`/raw_content`** - अध्यायों के कच्चे ड्राफ्ट्स और वर्ड-मीनिंग प्रॉम्प्ट सूचियां।
* **`/project_meta`** - विकास यात्रा (Journey.md), फ़ाइल सारांश, और योजनाएं।
* **`/archive`** - पुराने और अप्रचलित डेटा/फाइलों के बैकअप (v7 मास्टर डिक्शनरी सहित)।
* **`/assets`** - सभी मीडिया और डिजाइन इमेजेस।
* **`/scratch`** - सक्रिय काम के लिए टेम्परेरी स्पेस (`/scripts`, `/drafts`, `/reports`, `/data`)।
* **`/Can Be Delete`** - री-चेक करने योग्य फाइलें जिन्हें अंतिम पुष्टि के बाद डिलीट किया जा सकता है।

### 📄 मुख्य फ़ोल्डर (Root Directory) की महत्वपूर्ण फाइलें:
* **`progress.md`** - विकास प्रगति ट्रैकर।
* **`llms.txt`** - AI एजेंट के लिए संक्षिप्त मैपिंग फ़ाइल।
* **`summary_and_rules.md`** - (यह फ़ाइल) प्रोजेक्ट ओवरव्यू और एजेंट के नियम।
* **`codebase_rules.md`** - कोड सिक्योरिटी, परफॉरमेंस और स्टाइलिंग नियम।
* **`AI_GUIDELINES.md`** - AI एजेंट टोकन-बचत गाइडलाइन्स।

---

## ⚡ 3. CRITICAL AGENT RULES & GUIDELINES
काम शुरू करते ही निम्नलिखित नियमों का 100% पालन करें:

### A. टोकन बचत (Token & Context Window Care)
1. **Zero-Output Execution:** टर्मिनल या कंसोल पर कभी भी संपूर्ण JSON या विशाल डेटा फ़ाइल प्रिंट न करें।
2. **Script-First Validation:** विशाल फ़ाइलों को देखने के लिए `view_file` का उपयोग न करें। आवश्यकता होने पर एक छोटा Node.js स्क्रिप्ट लिखकर डेटा प्रोसेस करें और केवल समरी प्रिंट करें।
3. **No Massive Dumps:** हमेशा एरे को `slice(0, 3)` करके केवल सैंपल प्रिंट करें।

### B. सुरक्षा नियम (Security & XSS Protection)
1. **Strict XSS Escaping:** यूजर इनपुट या बाह्य डेटा को रेंडर करते समय कभी भी सीधे `innerHTML` का उपयोग न करें। हमेशा `escHtml(str)` का उपयोग करें:
   ```javascript
   function escHtml(str) {
     if (!str) return '';
     const div = document.createElement('div');
     div.textContent = str;
     return div.innerHTML;
   }
   ```
2. **Debounced Inputs:** सर्च बार या अन्य हेवी इवेंट्स को हमेशा कम से कम 150ms के डीबाउंस अंतराल के साथ रन करें।

### C. डिज़ाइन और एनीमेशन नियम (Premium Styling)
1. **Theme Variable Consistency:** नई शैलियों में केवल `style.css` में परिभाषित HSL वेरिएबल्स (`var(--bg-base)`, `var(--accent)`, `var(--border)`) का उपयोग करें।
2. **Glassmorphism Styling:** प्रीमियम कार्ड डिज़ाइन्स में निम्नलिखित गुण लागू करें:
   ```css
   background: var(--nav-bg);
   backdrop-filter: blur(12px);
   border: 1px solid var(--border);
   box-shadow: var(--shadow-md);
   ```
3. **Spring Animations:** एनीमेशन को प्रीमियम टच देने के लिए साधारण `ease` के स्थान पर बेज़ियर कर्व का उपयोग करें:
   ```css
   transition: all var(--duration-normal) cubic-bezier(0.34, 1.56, 0.64, 1);
   ```

---

## 🔄 4. Recent Completed Works
* **SPA Routing & Deep-linking:** exposed `window.navigate` globally in `app.js` and added direct support for `/#/` hash-based deep links (like `/#/flashcards`) to prevent routing failures on direct navigation.
* **Layout Navigation:** Added glass-morphic history back/forward buttons linked to standard browser history controls (`history.back()` and `history.forward()`).
* **Study Activity Tracker:** Implemented dynamic tracking in LocalStorage and rendered a year -> month -> day tree with smooth height transitions powered by a custom JS `toggleSection(el)` accordion utility.
* **Flashcards UI Polish:** Addressed truncation on smaller viewports with scrollable containers, implemented dynamic Devanagari phonetic formatting, and resolved swipe glitches with transition locks (`state.fcTransitioning`).
* **A11y & SEO:** Resolved invalid syntax errors (comment-tags, unclosed inputs) and standardized heading hierarchies and `aria-label` tags for screen readers.
