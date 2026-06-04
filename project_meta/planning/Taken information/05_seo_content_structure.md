# Module 5: SEO Architecture & Content Structure - English Vidya

## 1. Bilingual SEO Target Strategy (Hindi + English)
To capture massive search engine traffic from Google, Yahoo, and Bing in India, the website's SEO strategy is optimized for **mixed-language queries** (Hinglish/Hindi written in English alphabets and Devanagari script).

Rural and beginner students rarely search for academic English terms like *"Objective Case of Pronoun."* Instead, they search using high-intent colloquial terms.

### Keyword Intent Mapping Examples
| Target Concept | High-Volume Search Query | Language Style | Target Title Strategy |
| :--- | :--- | :--- | :--- |
| **Basic Tenses** | *"tense kitne prakar ke hote hain"* | Hinglish | **Tense कितने प्रकार के होते हैं? (Complete Tense Rules in Hindi)** |
| **Verb Forms** | *"go verb forms with hindi meaning"* | Mixed | **Go Verb Forms with Hindi Meaning - V1, V2, V3 Forms** |
| **Pronoun Rules** | *"pronoun in hindi grammar with examples"* | Mixed | **Pronoun (सर्वनाम) क्या है? Rules, Types and Examples in Hindi** |
| **Spoken English** | *"english me baat kaise kare basic level"* | Hinglish | **English में बात कैसे करें? Daily English Speaking Practice** |

---

## 2. Directory Hierarchy & URL slug Structures
Search engine crawlers require a logical, clean directory tree to crawl and index educational notes properly. We implement a flat, keyword-rich slug structure.

```
englishvidya.com/
│
├── grammar/                          # Core Grammar Notes Root
│   ├── basic/                        # Basic Grammar (Phase 1-3)
│   │   ├── what-is-language          # d/g/b/what-is-language
│   │   └── parts-of-speech-overview
│   ├── intermediate/                 # Intermediate Grammar (Phase 4-7)
│   │   ├── noun-system-part-17
│   │   └── subject-verb-agreement-rules
│   └── advanced/                     # Advanced Grammar (Phase 8-10)
│       ├── active-passive-voice-tricks
│       └── conditional-sentences-rules
│
├── spoken/                           # Spoken English Course Root
│   ├── thinking-in-english-tips
│   └── filler-words-for-fluency
│
└── vocab/                            # Vocabulary Cards Root
    ├── level-a/                      # Ultra Common Daily Words
    │   ├── water-meaning-hindi
    │   └── beautiful-meaning-hindi
    └── categories/                   # Grouped Vocabulary lists
        ├── family-relations-words
        └── weather-vocabulary-hindi
```

---

## 3. SEO HTML Metadata Templates
Every dynamic notes page rendered by Cloudflare Pages must serve fully optimized server-side HTML tags for search crawlers. 

*Note: Since dynamic crawling is critical, static site generation (SSG) or server-side hydration at the edge via Workers/Pages is utilized to ensure Google parses raw HTML instead of relying on JavaScript execution.*

### Dynamic Note Page HTML Schema
```html
<!DOCTYPE html>
<html lang="hi-IN">
<head>
  <meta charset="utf-8">
  <title>Noun (संज्ञा) क्या है? Types and Rules in Hindi - English Vidya</title>
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="Noun (संज्ञा) किसे कहते हैं? Simple explanation of Noun rules, traditional & modern classification in Hindi with daily-life examples and practice questions.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://englishvidya.com/grammar/intermediate/noun-system-part-17">
  
  <!-- Open Graph (Facebook / WhatsApp / Telegram Share) -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="Noun (संज्ञा) क्या है? Types and Rules in Hindi - English Vidya">
  <meta property="og:description" content="Noun (संज्ञा) किसे कहते हैं? Learn traditional and modern noun classification with simple Hinglish notes.">
  <meta property="og:image" content="https://englishvidya.com/assets/meta/og-noun-part-17.png">
  <meta property="og:url" content="https://englishvidya.com/grammar/intermediate/noun-system-part-17">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Noun (संज्ञा) क्या है? Types and Rules in Hindi - English Vidya">
  
  <!-- Mobile Viewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
</head>
<body>
...
</body>
</html>
```

---

## 4. Rich JSON-LD Structured Data Schema
To secure "Featured Snippets" (Position Zero) and rich search results, we inject structural JSON-LD payloads into our lesson HTML templates.

### A. Course Schema (For indexing the full course curriculum)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "English Grammar & Spoken Mastery for Hindi Speakers",
  "description": "Complete Basic to Advanced English Grammar, Vocabulary, and Spoken Lessons designed for Hindi-medium students.",
  "provider": {
    "@type": "Organization",
    "name": "English Vidya",
    "sameAs": "https://englishvidya.com"
  }
}
```

### B. FAQ Page Schema (For capturing dynamic FAQ drop-downs in search results)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Noun कितने प्रकार के होते हैं?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Traditional grammar के अनुसार Noun 5 प्रकार के होते हैं (Proper, Common, Collective, Material, Abstract), लेकिन Modern grammar के अनुसार इसे 3 प्रकार में वर्गीकृत किया जाता है (Proper, Countable, Uncountable Noun)."
    }
  }]
}
```

---

## 5. Dynamic Sitemap Generation (Cloudflare Edge Worker)
We do not write a manual static `sitemap.xml` file. Instead, a dedicated Cloudflare Worker route (`/sitemap.xml`) automatically generates a fresh sitemap dynamically directly from our Cloudflare D1 database. This ensures new grammar lessons or vocabulary words are indexed by Google instantly.

### Edge Sitemap Code Snippet
```typescript
// Cloudflare Worker Sitemap Generator Route
export async function onRequest(context) {
  const { env } = context;
  
  // Fetch all active lesson slugs and update times
  const { results: lessons } = await env.D1_DB.prepare(
    "SELECT slug, created_at FROM lessons ORDER BY created_at DESC"
  ).all();
  
  const urls = lessons.map(lesson => `
    <url>
      <loc>https://englishvidya.com/grammar/${lesson.slug}</loc>
      <lastmod>${new Date(lesson.created_at * 1000).toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://englishvidya.com/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    ${urls}
  </urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400' // Edge cache 1 day
    }
  });
}
```
