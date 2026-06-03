# 🎓 English Vidya — Codebase & Security Rules

यह दस्तावेज़ उन नियमों और सर्वोत्तम प्रथाओं (Best Practices) को परिभाषित करता है जिनका पालन भविष्य में किसी भी AI डेवलपर या मानवीय डेवलपर को कोड लिखते समय करना **अनिवार्य** है।

---

## 🛡️ 1. सुरक्षा नियम (Security & XSS Protection)

1. **XSS एस्केपिंग (Strict Escaping):**
   * किसी भी बाहरी डेटा या यूज़र इनपुट (जैसे खोज शब्द, फ़्लैशकार्ड टेक्स्ट, संपर्क फ़ॉर्म इनपुट) को रेंडर करते समय सीधे `innerHTML` का उपयोग करने से बचें।
   * हमेशा `escHtml(str)` उपयोगिता फ़ंक्शन का उपयोग करें, जो टेक्स्ट को सुरक्षित रूप से एस्केप करता है:
     ```javascript
     function escHtml(str) {
       if (!str) return '';
       const div = document.createElement('div');
       div.textContent = str;
       return div.innerHTML;
     }
     ```
2. **लोकलस्टोरेज सुरक्षा सीमा (Storage Cap):**
   * संपर्क फ़ॉर्म सबमिशन को LocalStorage में कैप करके रखें (अधिकतम 10 प्रविष्टियाँ) ताकि मेमोरी लीक या ब्राउज़र डेटा ओवरफ़्लो न हो।
3. **सुरक्षित प्रमाणीकरण (Authentication):**
   * भविष्य में प्रमाणीकरण (Authentication) जोड़ते समय Secure HttpOnly Cookies का उपयोग करें ताकि जावास्क्रिप्ट द्वारा टोकन चोरी न किए जा सकें।

---

## 🎨 2. सीएसएस और डिज़ाइन सिस्टम नियम (Styling Tokens)

1. **वेनिला सीएसएस (Vanilla CSS Only):**
   * कोई भी नया घटक (component) बनाते समय सीधे इन-लाइन शैलियाँ (in-line styles) या एड-हॉक क्लासेस न लिखें।
   * हमेशा `style.css` में डिज़ाइन किए गए HSL टोकन्स का उपयोग करें।
     - डार्क मोड के लिए: `var(--bg-base)`, `var(--bg-raised)`, `var(--accent)`, `var(--border)`
     - प्रकाश मोड (Light Mode) के लिए सीएसएस टोकन स्वतः लागू होंगे।
2. **Glassmorphism कंसिस्टेंसी:**
   * प्रीमियम बक्से या कार्ड्स बनाते समय हमेशा निम्नलिखित गुणों (properties) का उपयोग करें:
     ```css
     background: var(--nav-bg);
     backdrop-filter: blur(12px);
     border: 1px solid var(--border);
     box-shadow: var(--shadow-md);
     ```
3. **स्प्रिंग एनीमेशन (Spring Interpolation):**
   * मॉर्फिंग या एकॉर्डियन एनीमेशन के लिए साधारण `ease` का उपयोग न करें। हमेशा प्रीमियम स्प्रिंग कर्व का उपयोग करें:
     ```css
     transition: all var(--duration-normal) cubic-bezier(0.34, 1.56, 0.64, 1);
     ```

---

## 💾 3. प्रदर्शन और मेमोरी नियम (Performance & Memory Care)

1. **Lighthouse 99+ अनुपालन:**
   * कोड लिखते समय यह ध्यान रखें कि पृष्ठों के लोड होने का समय 10ms से कम रहे और कोई लेआउट शिफ्ट (CLS) न हो।
2. **स्मार्ट इनपुट डीबाउंसिंग (Input Debouncing):**
   * टेक्स्ट इनपुट इवेंट्स (जैसे शब्दकोश खोज) पर सीधे एपीआई कॉल या भारी प्रसंस्करण (processing) न चलाएं। हमेशा 150ms का डीबाउंस अंतराल लागू करें:
     ```javascript
     searchInput.addEventListener('input', debounce(() => this.search(searchInput.value), 150));
     ```
3. **ऑफ़लाइन-प्रथम कम्पैटिबिलिटी (Offline-First):**
   * राउटर में बदलाव करते समय यह सुनिश्चित करें कि हाइब्रिड फ़ॉलबैक (Hash fallback on `file:`) 100% कार्यशील रहे, ताकि ऑफ़लाइन छात्र को कोई सफ़ेद स्क्रीन (white screen crash) न दिखाई दे।
