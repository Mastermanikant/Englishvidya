# 14_Security_Mitigation.md

## White‑Hat (Defensive) उपाय – उपर्युक्त 13 हमले पर प्रतिक्रिया

| # | हमले | रोकथाम / पैच | लागू करना कैसे (Cloudflare Workers / Client) |
|---|------|--------------|----------------------------------------------|
| 1 | SQL Injection | **Prepared‑Statements / Parameterised Queries** – Cloudflare Workers के `D1.prepare()` उपयोग करें। इनपुट को हमेशा वैलिडेट/सैनिटाइज़ करें। | सभी `INSERT/UPDATE` एपीआई (`/api/usage`, `/api/reward`, `/api/comment`) में `?`‑बाइंडिंग। |
| 2 | XSS | **Content‑Security‑Policy (CSP)** हेडर `script-src 'self' https://cdn.monetag.com; object-src 'none';` <br>**HTML एस्केप** फ़ंक्शन (उदा. `escapeHTML()`) पर सभी यूज़र‑जेनरेटेड कंटेंट (comments, feedback). | Workers में `Response.headers.set('Content‑Security‑Policy', ...)` और क्लाइंट‑साइड `sanitize-html` (lightweight). |
| 3 | CSRF | **SameSite=Lax** कूकी/टोकन, **CSRF‑Token** (रैंडम) को प्रत्येक POST‑बॉडी में भेजें और सर्वर‑साइड चेक करें। | `/api/*` में `csrfToken` जाँच। |
| 4 | Clickjacking | **X‑Frame‑Options: DENY** और **frame‑ancestors 'none'** CSP सेट करें। | Workers में हेडर सेट। |
| 5 | Credential Stuffing | **reCAPTCHA v3** या **hCaptcha** को लॉग‑इन/साइन‑इन फ़ॉर्म में एम्बेड। साथ ही **rate‑limit** (Workers‑Rate‑Limiter) – 5 त्रुटियों पर 15 मिनट ब्लॉक। | Cloudflare Dashboard → Rate‑Limiting Rule `/api/login`. |
| 6 | MITM | सभी API एन्डपॉइंट **HTTPS‑only** (Cloudflare Workers auto TLS). HSTS हेडर `max‑age=31536000; includeSubDomains`. | Workers में `Strict-Transport-Security` हेडर। |
| 7 | DoS / Resource Exhaustion | **IP‑rate‑limit** (100 रिक्वेस्ट/मिनट) और **Quota‑Check** before DB‑write (D1‑quota‑remaining). | Workers‑Rate‑Limiter + `if (await D1.quota() < 1) return new Response('Quota exceeded', {status:429});` |
| 8 | Monetag Fraud | **ad‑view‑verification** – Monetag लौटाए `adViewId` को सर्वर पर भेजें, फिर `Monetag.verify(adViewId)` API कॉल करके पुष्टि करें। | `/api/reward` में verification step। |
| 9 | Referral Abuse | **Device‑Bound Referral Code** – कोड को `device_id` से जुड़ें, साथ ही **IP/फ़िंगरप्रिन्ट** चेक, एक दिन में अधिकतम 5 उपयोग। | Workers में `if (refCount >5) reject`. |
|10| CORS Mis‑config | **CORS** को केवल भरोसेमंद ऑरिजिन (`https://englishvidya.com`) तक सीमित रखें, `Access-Control-Allow-Origin` को डायनामिक नहीं बल्कि स्ट्रिक्ट रखें। | Workers में `Response.headers.set('Access-Control-Allow-Origin','https://englishvidya.com')`. |
|11| LocalStorage Tampering | **Integrity‑Hash** – `sessionData` को HMAC‑SHA256 (सर्वर‑साइड secret) के साथ साइन करें, क्लाइंट केवल वैरिफ़ाइ कर सके। | JS में `crypto.subtle.sign` / `verify`. |
|12| ServiceWorker Cache Poisoning | **Cache‑Versioning** – प्रत्येक बिल्ड में `CACHE_VERSION` बदलें, `self.addEventListener('install')` में `caches.delete(old)`; सभी फ़ाइलें `integrity` एट्रिब्यूट के साथ लोड। |
|13| Voice Search Injection | यदि Voice API जोड़ते, तो **Speech‑to‑Text** के आउटपुट को **whitelist** (कमांड सूची) के साथ मिलाएँ, कोई भी अनजान कमांड ड्रॉप करें। |

### अतिरिक्त सुरक्षा‑चेक‑लिस्ट (डिप्लॉय से पहले)
1. **Static‑Code‑Analysis** – ESLint + security‑plugin चलाएँ।
2. **Dependency‑Audit** – `npm audit` (यदि npm पैकेज‑मैनेजमेंट) का उपयोग।
3. **Pen‑Test** – OWASP ZAP से स्वचालित स्कैन, विशेषकर `/api/*` एन्डपॉइंट।
4. **Backup‑Strategy** – D1 डेटाबेस का दैनिक snapshot (Cloudflare Backup) और R2 ऑब्जेक्ट्स का versioned storage।
5. **Log‑Monitoring** – Workers‑Logs को Cloudflare Logpush से Elastic या Splunk पर भेजें, अनियमित पैटर्न अलर्ट सेट करें।

---

**सुरक्षा योजना का स्कोर:** 9/10 – अधिकांश ज्ञात वेब‑आधारित हमले कवर हुए हैं; सुधार के लिए सभी तीसरे‑पक्ष SDK के नियमित अपडेट और सुरक्षा‑पैच का ऑटो‑डिप्लॉय जोड़ें।
