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

  // ── 2. FILTERS ─────────────────────────────────────────────────────

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
