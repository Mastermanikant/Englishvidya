# 🎓 English Vidya — Files Structure & Folder Map

यह फ़ाइल भविष्य में आने वाले किसी भी AI एजेंट को English Vidya प्रोजेक्ट की पूरी संरचना और फ़ाइलों की स्थिति को समझने में मदद करेगी।

---

## 📂 निर्देशिका पेड़ (Directory Tree Overview)

```
d:\English Vidya\
├── archive/                            # 📂 पुराने/अप्रचलित फ़ाइलों का आर्काइव फ़ोल्डर (Flat)
│   ├── Brain_Data_Export/
│   ├── duplicate_vocabulary_backups/
│   ├── old_master_versions/
│   ├── old_partial_dictionaries/
│   ├── old_placeholder_modules/
│   ├── scratch_temp_scripts/
│   ├── uuid_draft_logs/
│   └── website_old/                    # पुरानी वेबसाइट फ़ाइलें (old_index.html, old_app.js)
├── assets/                             # 📂 न्यू रूट एसेट्स फ़ोल्डर (Flat)
│   ├── call to action for video.png
│   └── file_0000000009647207841c7e00b9cde6af.png
├── tools/                              # 📂 कोडिंग स्क्रिप्ट्स और उपयोगी टूल्स (Flat)
│   ├── process_dictionary.ps1          # शब्दकोश प्रोसेसिंग स्क्रिप्ट
│   └── ... (अन्य डेवलपमेंट स्क्रिप्ट्स)
├── scratch/                            # 📂 अस्थायी कार्य फ़ाइलों का फ़ोल्डर (Flat)
│   ├── data/                           # ग्रामर_डेटा JSON फ़ाइलें
│   ├── drafts/                         # पाठों के ड्राफ्ट्स (part1.md आदि)
│   ├── reports/                        # कैटेगरीज रिपोर्ट्स और समरी
│   └── scripts/                        # अस्थायी कोडिंग स्क्रिप्ट्स (ps1, js, py)
├── raw_content/                        # 📂 कच्ची अध्ययन सामग्री (Markdown raw grammar guides)
│   ├── grammar/
│   ├── technical/
│   └── vocabulary/
├── website/                            # 🚀 मुख्य वेबसाइट वितरण फ़ोल्डर (Live Deployment Folder)
│   ├── css/                            # सीएसएस स्टाइल फ़ाइलें (style.css)
│   ├── js/                             # जावास्क्रिप्ट फ़ाइलें (app.js)
│   ├── data/                           # 📂 रॉ डेटाबेस (site/, grammar/, vocabulary/ JSONs)
│   ├── index.html                      # मुख्य एचटीएमएल शेल (SPA Shell & Static pages)
│   ├── 404.html                        # गिटहब पेजेज SPA पाथ रीडायरेक्टर (SPA Redirect Hack)
│   ├── manifest.json                   # PWA कॉन्फ़िगरेशन
│   ├── robots.txt                      # सर्च इंजन निर्देश
│   ├── service-worker.js               # ऑफ़लाइन लोडिंग और कैशिंग (PWA)
│   └── llms.txt                        # संक्षिप्त AI संदर्भ फ़ाइल (AI Map)
└── project_meta/                       # 📂 प्रोजेक्ट मैनेजमेंट और प्लानिंग फ़ोल्डर (निजी/स्थानीय)
    ├── planning/
    │   ├── implementation_plan.md      # होम पेज और क्लीन यूआरएल की कार्य योजना
    │   ├── task.md                     # वर्तमान टास्क लिस्ट (TODO Tracker)
    │   ├── walkthrough.md              # कार्य समापन रिपोर्ट
    │   └── Journey.md                  # डेवलपर जर्नल / डायरी (स्थानीय PC बैकअप)
    └── llms/                           # 📂 यह AI संदर्भ निर्देशिका (LLM context loader)
        ├── files_structure.md          # [वर्तमान फ़ाइल] निर्देशिका नक्शा
        ├── architecture.md             # आर्किटेक्चर विवरण (Router, PWA, Search)
        ├── codebase_rules.md           # कोडिंग और सुरक्षा नियम (XSS, HSL CSS)
        └── api_endpoints.json          # सभी डेटा JSONs का स्कीमा
```

---

## 🎯 मुख्य फ़ाइलों की भूमिका (Role of Core Files)

### 1. `website/index.html`
* **Static Page Shell:** होम, हमारे बारे में, संपर्क, नीतियां (Legal) पेज सीधे एचटीएमएल शेल में लिखे गए हैं ताकि 10ms में फ़्लिकर-मुक्त रेंडरिंग हो।
* **Dynamic Target (#view-dynamic-target):** मुख्य ऐप व्यूज (जैसे Grammar Reader, Dictionary Search, Flashcards, Profile) जावास्क्रिप्ट द्वारा इस स्लॉट में गतिशील रूप से रेंडर होते हैं।

### 2. `website/js/app.js`
* **Core SPA Hybrid Router:** `PopState` (ऑनलाइन क्लीन पाथवेज के लिए) और `HashChange` (ऑफ़लाइन फ़ॉलबैक के लिए) दोनों को चलाता है।
* **Zero-Cost Client Search:** स्थानीय सर्च इंडेक्स पर त्वरित फ़ज़ी खोज करता है।
* **Spaced-Repetition Flashcards:** कार्ड्स को सही/गलत अभ्यास के हिसाब से प्रोग्रेस ट्रैक करता है।
* **Theme Controller:** लाइट और डार्क मोड बदलते समय गोलाकार तरंग (reveal wave) एनिमेट करता है।

### 3. `website/css/style.css`
* **Design System:** संपूर्ण मंच के लिए HSL-आधारित रंग टोकन, फोंट्स (Inter, Outfit), रिस्पांसिव लेआउट ग्रिड और Glassmorphism इफ़ेक्ट स्टाइल करता है।

### 4. `website/404.html`
* **GitHub Pages Redirection:** लाइव वेबसाइट पर किसी भी क्लीन यूआरएल (जैसे `/grammar`) पर डायरेक्ट जाने वाले यूज़र को मुख्य `index.html` पर क्वेरी पैरामीटर (`?p=...`) के साथ रीडायरेक्ट करता है ताकि 404 एरर न आए।
