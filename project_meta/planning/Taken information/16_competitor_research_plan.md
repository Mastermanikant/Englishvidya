# Implementation Plan – Competitive Research for English Vidya

## Goal Description
We need to research competitor websites (English language teaching platforms and general teacher‑learning sites) to uncover **growth strategies** that can be applied to English Vidya. The output will be a concise, actionable list of best‑practice tactics and a checklist of any missing components in our current plan.

## User Review Required
- Approve the research scope and the list of competitor categories.
- Confirm if you want a deep‑dive into **technical stack**, **content strategy**, **SEO**, **monetisation**, **community**, and **user‑engagement** for each competitor.
- Indicate any specific competitors you already have in mind (e.g., Duolingo, EngVid, BBC Learning English, Byju’s, Vedantu, Khan Academy Hindi, etc.).

## Open Questions
> [!IMPORTANT] **Which of the following competitor groups are highest priority?**
- Global English‑learning apps (Duolingo, Babbel, Busuu)
- Free video‑based English teachers (EngVid, BBC Learning English, VOA Learning English)
- Indian ed‑tech platforms with English courses (Byju’s, Vedantu, Unacademy)
- Community‑driven language forums (italki, HelloTalk, Reddit r/EnglishLearning)
> 
> [!IMPORTANT] **Do you want the research to include pricing models and free‑tier vs paid‑tier analysis?**
> 
> [!IMPORTANT] **Any particular geographic focus (rural India, Hindi‑speaking audience) for the competitor analysis?**

## Proposed Changes (Research Steps)

### 1. Competitor Selection (≈ 10 sites)
- Choose 3 global SaaS apps, 3 free video channels, 2 Indian ed‑tech platforms, 2 community forums.
- Create a spreadsheet `competitor_analysis.xlsx` with columns:
  - Site / App name
  - Target audience
  - Core features (PWA, video, live‑class, AI‑chat, gamification)
  - Tech stack (frontend framework, CDN, backend services)
  - SEO tactics (structured data, keyword focus, backlink strategy)
  - Monetisation (ads, subscriptions, freemium, referral, merch)
  - Engagement metrics (DAU/MAU, session length, retention hooks)
  - Pricing & free‑tier limits
  - Notable “jugaad” low‑cost tricks

### 2. Data Collection
- Use **search_web** tool to query for each competitor’s tech stack (e.g., “what technology does duolingo use?”, “engvid website stack”).
- Pull recent case‑studies, blog posts, and media articles (e.g., “Duolingo growth strategy 2024”).
- For Indian platforms, also search for local news/press releases on cost‑optimisation.
- Capture SEO insights using **search_web** for “site:example.com” and review meta tags via **read_url_content** if needed.

### 3. Content & Pedagogy Review
- Sample 2‑3 lessons from each competitor (video, interactive quiz, PDF). Note:
  - Lesson length, visual style, cultural localisation (Hindi subtitles, audio), interactive elements.
  - Use of spaced‑repetition, micro‑learning, story‑based learning.
- Record if they provide **voice‑search** or **speech‑recognition** for pronunciation practice.

### 4. Community & User‑Generated Content
- Examine comment sections / forums for moderation approach, gamified reputation, badges.
- Identify referral or ambassador programs.

### 5. Monetisation & Anti‑Fraud
- Document ad formats (Monetag, AdSense, In‑app purchases).
- Note fraud‑prevention measures (device‑binding, KYC, captcha).

### 6. Synthesis & Gap Analysis
- Fill the spreadsheet with findings.
- Produce a **summary.md** (≈ 2‑page) listing:
  - Top 5 growth tactics we can adopt (e.g., daily streak rewards, push‑notification lessons, community Q&A, localized subtitles, freemium‑ad‑watch‑to‑unlock).
  - Any missing features in English Vidya’s current plan (e.g., live‑teacher webinars, AI‑chat tutor, spaced‑repetition algorithm, multi‑language UI). 
- Highlight low‑cost “jugaad” opportunities (e.g., using Cloudflare Workers KV as a cheap quiz‑score store, leveraging YouTube’s subtitles for Hindi translation).

### 7. Deliverables
- `competitor_analysis.xlsx` (saved in `English Vidya Master Planning/` as an artifact).
- `15_SEO_Strategy.md` will be updated with competitor‑derived SEO tactics.
- `summary.md` with actionable recommendations and missing‑feature checklist.

### 8. Verification Plan
- Cross‑check collected data with at least **two** independent sources per competitor.
- Validate spreadsheet formulas for cost‑estimation.
- Ensure all URLs and screenshots are archived in R2 for reproducibility.

---
**Next Step:** Await your approval to start the research and create the above artifacts.
