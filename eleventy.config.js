// eleventy.config.js — English Vidya
// JSON content → real HTML pages (SEO-friendly, WordPress-like)

const path = require("path");
const fs   = require("fs");

module.exports = function (eleventyConfig) {

  // ── 1. PASSTHROUGH COPIES ──────────────────────────────────────────
  // Ye folders jaise-ke-taise _site/ me copy honge
  eleventyConfig.addPassthroughCopy({ "website/css":             "css"             });
  eleventyConfig.addPassthroughCopy({ "website/js":              "js"              });
  eleventyConfig.addPassthroughCopy({ "website/icons":           "assets/icons"    });
  eleventyConfig.addPassthroughCopy({ "src/assets/images":       "assets/images"   });
  eleventyConfig.addPassthroughCopy({ "website/data":            "data"            });
  eleventyConfig.addPassthroughCopy({ "website/manifest.json":   "manifest.json"   });
  eleventyConfig.addPassthroughCopy({ "website/service-worker.js": "service-worker.js" });
  eleventyConfig.addPassthroughCopy({ "website/robots.txt":      "robots.txt"      });

  eleventyConfig.addPassthroughCopy({ "website/.nojekyll":       ".nojekyll"       });
  eleventyConfig.addPassthroughCopy({ "website/404.html":        "404.html"        });
  eleventyConfig.addPassthroughCopy({ "website/_headers":        "_headers"        });
  eleventyConfig.addPassthroughCopy({ "website/_redirects":      "_redirects"      });
  eleventyConfig.addPassthroughCopy({ "website/llms.txt":        "llms.txt"        });

  // ── 2. FILTERS ─────────────────────────────────────────────────────

  // Date → YYYY-MM-DD (for sitemap lastmod)
  eleventyConfig.addFilter("toISO", (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    return d.toISOString().slice(0, 10);
  });

  // HTML escape (XSS prevention)
  eleventyConfig.addFilter("escHtml", (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });

  // Newlines → <br> (for lesson intro text)
  eleventyConfig.addFilter("nl2br", (str) => {
    if (!str) return "";
    return String(str).replace(/\n/g, "<br>");
  });

  // String includes check (for nav active states)
  eleventyConfig.addFilter("includes", (str, substr) => {
    if (!str) return false;
    return String(str).includes(substr);
  });

  // Slug → readable title
  eleventyConfig.addFilter("slugToTitle", (slug) => {
    if (!slug) return "";
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  });

  // Shortcode for current build time
  eleventyConfig.addShortcode("buildTime", () => {
    return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  });

  // Safe JSON stringify (for schema.org)
  eleventyConfig.addFilter("jsonify", (value) => JSON.stringify(value));

  // Truncate string
  eleventyConfig.addFilter("truncate", (str, len) => {
    if (!str) return "";
    const s = String(str);
    return s.length > len ? s.slice(0, len) + "…" : s;
  });

  // ── 3. COLLECTIONS ───────────────────────────────────────────────
  // Custom sorted collection for grammar lessons
  eleventyConfig.addCollection("grammar", function(collectionApi) {
    return collectionApi.getFilteredByTag("grammar").sort((a, b) => {
      let partA = a.data.part || 999;
      let partB = b.data.part || 999;
      return partA - partB;
    });
  });

  // ── 4. SHORTCODES ──────────────────────────────────────────────────
  eleventyConfig.addShortcode("include_word", function(word) {
    const allWords = require('./src/_data/allWords.js')();
    const targetSlug = String(word).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const foundWord = allWords.find(w => w.slug === targetSlug);
    
    if (!foundWord) {
      return `<div class="card" style="border-left: 4px solid var(--accent);"><p><strong>${word}</strong> (Definition not found)</p></div>`;
    }
    
    return `
      <div class="card" style="border-left: 4px solid var(--accent); margin: var(--sp-4) 0; padding: var(--sp-4);">
        <h3 style="margin-bottom: var(--sp-2); display: flex; align-items: center; gap: 8px;">
          ${foundWord.word} 
          <button onclick="speakWord('${foundWord.word.replace(/'/g, "\\'")}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🔊</button>
        </h3>
        <div style="font-size: 1.1rem; margin-bottom: var(--sp-2);"><strong>Hindi:</strong> ${foundWord.meaning}</div>
        ${foundWord.example ? `<div style="font-style: italic; color: var(--text-secondary);">"${foundWord.example}"</div>` : ''}
        <div style="margin-top: var(--sp-3);">
          <a href="/dictionary/${foundWord.slug}/" style="font-size: 0.9rem; font-weight: bold; color: var(--accent);">View full details →</a>
        </div>
      </div>
    `;
  });

  // ── 5. YOUTUBE EMBED SHORTCODE ──────────────────────────────────────
  // Usage in any .njk or .md file: {% youtube "VIDEO_ID" %}
  // Lazy-loads YouTube using a click-to-play facade (no CLS, no speed penalty)
  eleventyConfig.addShortcode("youtube", function(videoId, title) {
    const safeTitle = title || "YouTube Video";
    const safeId    = String(videoId).replace(/[^a-zA-Z0-9_-]/g, "");
    return `
      <div class="yt-facade" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; background:#000; cursor:pointer; margin: var(--sp-6) 0;" onclick="this.innerHTML='<iframe width=\'100%\' height=\'100%\' src=\'https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1\' title=\'${safeTitle}\' style=\'position:absolute;top:0;left:0;width:100%;height:100%;border:0;\' allow=\'autoplay; encrypted-media; picture-in-picture\' allowfullscreen loading=\'lazy\'></iframe>';" role="button" aria-label="Play: ${safeTitle}">
        <img
          src="https://i.ytimg.com/vi/${safeId}/hqdefault.jpg"
          alt="${safeTitle}"
          loading="lazy"
          width="480" height="270"
          style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; border-radius:12px;"
        >
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:72px; height:72px; background:rgba(255,0,0,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,0,0,0.5);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
        <div style="position:absolute; bottom:12px; left:12px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.8rem; padding:4px 10px; border-radius:20px; font-family:var(--font-sans);">${safeTitle}</div>
      </div>
    `;
  });

  // ── 4. BUILD OPTIONS ───────────────────────────────────────────────
  return {
    dir: {
      input:    "src",
      output:   "_site",
      includes: "_includes",
      data:     "_data",
    },
    templateFormats:      ["njk", "html", "md"],
    htmlTemplateEngine:   "njk",
    markdownTemplateEngine: "njk",
    pathPrefix:           "/",
  };
};
