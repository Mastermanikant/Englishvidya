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

  // ── 3. COMPUTED DATA for lesson pages ──────────────────────────────
  // Load all lessons once for prev/next navigation
  function loadLessons() {
    const dir = path.join(__dirname, "website/data/grammar/lessons");
    try {
      return fs.readdirSync(dir)
        .filter(f => f.endsWith(".json"))
        .map(f => {
          try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
          catch(e) { return null; }
        })
        .filter(Boolean)
        .sort((a, b) => (a.part || 999) - (b.part || 999));
    } catch(e) { return []; }
  }

  const ALL_LESSONS = loadLessons();

  eleventyConfig.addGlobalData("allLessons", ALL_LESSONS);

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
