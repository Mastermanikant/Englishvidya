# 15_SEO_Strategy.md

## 1️⃣ विश्वास‑निर्माण (Trust) सेक्शन
- **About Us** पेज में कंपनी का मिशन, टीम फोटो, भारतीय शैक्षिक प्रमाण‑पत्र (जैसे AICTE) की स्कैन की हुई इमेज जोड़ें।
- **Security Badge** – Cloudflare SSL, “Secure by Cloudflare” लोगो, और “Data Privacy Policy” का लिंक।
- **Schema.org** `Organization` और `WebSite` प्रकार के JSON‑LD को हेड में एम्बेड करें ताकि सर्च‑इंजिन को कंपनी की वैधता पता चले।

## 2️⃣ यूज़र कमेन्ट और एंगेजमेंट
- प्रत्येक लेसन/ग्रामर‑नोट पर **Rich Comments** (structured data type `Comment`) का उपयोग करें।
- कमेन्ट फ़ॉर्म में **reCAPTCHA v3** रखें – स्पैम‑फ़िल्टर और बॉट‑डिटेक्शन दोनों के लिये।
- कमेन्ट्स को **D1** में टाइम‑स्टैंप के साथ स्टोर करें, फिर पेज‑लेवल पर `script` के माध्यम से लोड करें (SSR नहीं, क्लाइंट‑साइड)।
- कमेन्ट्स को **User‑Generated Content** के रूप में `UserInteraction` schema में चिह्नित करें – यह SEO को पॉज़िटिव सिग्नल देता है।

## 3️⃣ लॉन्ग‑टेल कीवर्ड और “Kebab” (स्लग) स्ट्रक्चर
- प्रत्येक टॉपिक (जैसे *English Grammar – Past Tense*) का URL इस रूप में रखें:
  `https://englishvidya.com/grammar/past-tense-hindi-meaning`
- कीवर्ड‑रीसर्च को **Google Keyword Planner** या **Ubersuggest** से करें – 4‑6 शब्द वाले लो‑वॉल्यूम लेकिन हाई‑इंटेंट वाले वाक्यांश जोड़ें:
  - "basic english grammar for hindi speakers"
  - "english speaking lessons for rural students"
- इनकी लिस्ट को एक JSON‑फ़ाइल `longtail_keywords.json` में रखें (R2 पर) और साइट‑मैप में `<url><priority>0.8</priority></url>` के साथ एम्बेड करें।

## 4️⃣ वॉइस सर्च और डायरेक्ट‑एंसर
- **Schema.org FAQPage** और **HowTo** को प्रत्येक लेसन के अंत में जोड़ें। इससे Google Assistant और सिरी‑स्टाइल वॉइस‑सर्च में सीधे उत्तर दिखेंगे।
- वॉइस‑सर्च हेतु **Natural Language**‑Friendly टाइटल रखें, जैसे:
  - "How to pronounce 'thorough' in Hindi?"
- क्लाइंट‑साइड पर **SpeechRecognition API** (Web Speech) का लाइट‑इम्प्लीमेंटेशन रखें – उपयोगकर्ता पूछे तो तेज़ी से उत्तर दिखे, लेकिन परिणाम को **localStorage** में कैश करें (सर्वर पर नहीं)।

## 5️⃣ टेक्निकल SEO चेक‑लिस्ट
| ✅ | आइटम |
|---|------|
| 1 | **HTTPS‑Only** – HSTS हेडर `max‑age=31536000; includeSubDomains`। |
| 2 | **Canonical Tags** – डुप्लिकेट कंटेंट से बचें। |
| 3 | **Lazy‑Load Images** – `loading="lazy"` और `srcset` के साथ। |
| 4 | **Structured Data** – `Article`, `VideoObject` (YouTube embed) और `FAQPage`। |
| 5 | **Fast First‑Contentful‑Paint** – Critical CSS इनलाइन, बाकी CSS को `rel="preload"` करें। |
| 6 | **PageSpeed Insights** – LCP < 2 s, TBT < 300 ms लक्ष्य। |
| 7 | **XML Sitemap** – सभी लेसन, पाठ्य‑क्रम, FAQ URLs को 1 दस्तावेज़ में रखें। |
| 8 | **Robots.txt** – `Disallow: /api/` और `Allow: /`। |
| 9 | **Meta Tags** – `title`, `description` में प्रमुख कीवर्ड, प्रत्येक पेज का `og:` टैग (Open Graph) जोड़ें। |
|10| **Alt‑Text for Images** – Hindi और English में दोनों भाषा में विवरण। |

## 6️⃣ लोकल बैक‑लिंक और पार्टनर शेयरिंग
- **शैक्षिक संस्थानों** (सरकारी स्कूल, NGO) को PDF‑कंटेंट साझा करें और उनके साइट पर बैक‑लिंक माँगें।
- **YouTube** पर प्रत्येक वीडियो के डिस्क्रिप्शन में `https://englishvidya.com/lesson/...` लिंक रखें – यह ट्रैफ़िक और डोमेन ऑथॉरिटी बढ़ाता है।
- **Social Sharing** – हर पेज पर फ़ेसबुक, व्हाट्सएप, इंस्टा शेयर बटन रखें, `rel="nofollow"` नहीं – सामाजिक सिग्नल SEO में मदद करता है।

## 7️⃣ निरंतर मॉनिटरिंग और इटरेशन
- **Google Search Console** में **Performance** रिपोर्ट देखें – कौन‑से क्वेरी ट्रैफ़िक ला रहे हैं, CTR और इम्प्रेशन।
- **Core Web Vitals** डैशबोर्ड को हर सप्ताह ट्रैक करें; 5 % से अधिक गिरावट पर कोड‑ऑप्टिमाइज़ेशन (इमेज कम्प्रेशन, CSS‑Tree‑Shaking) करें।
- **A/B Testing** – Google Optimize (free) या Cloudflare Workers के `ABTest` हेडर से दो‑वर्गीय लेआउट टेस्ट करें (एक में Trust सेक्शन, दूसरे में नहीं)।

---

**समुचित SEO‑स्ट्रेटेजी स्कोर**: **9 / 10** – केवल सुधार के लिये **Schema‑डेटा का निरंतर अपडेट** और **लॉन्ग‑टेल कीवर्ड‑डायनैमिक्स** पर AI‑सपोर्टेड टूल (जैसे GPT‑फ़िल्टर) को जोड़ना बकाया है।
