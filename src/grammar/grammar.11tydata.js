// src/grammar/grammar.11tydata.js
// ══════════════════════════════════════════════════════════
// YE FILE MAGIC HAI!
// Eleventy is file ko padh kar AUTOMATICALLY har lesson ka
// ek alag URL page bana deta hai.
//
// Example:
//   website/data/grammar/lessons/nouns.json
//   → englishvidya.com/grammar/nouns/  (real HTML page, SEO perfect)
//
// WordPress me jaise ek plugin hota hai, waise yahan
// JSON automatically page ban jaata hai.
// ══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

module.exports = function () {
  // Grammar lessons folder ka path
  const lessonsDir = path.join(
    __dirname,
    "../../website/data/grammar/lessons"
  );

  let lessons = [];
  let articles = [];

  // Sabhi JSON files padho
  try {
    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".json"));

    files.forEach((file) => {
      try {
        const raw = fs.readFileSync(path.join(lessonsDir, file), "utf8");
        const data = JSON.parse(raw);

        if (data.slug && data.title) {
          lessons.push({
            slug: data.slug,
            title: data.title,
            part: data.part || 0,
            file: file,
          });
        }
      } catch (e) {
        console.warn(`[Grammar] Failed to parse: ${file}`, e.message);
      }
    });

    // Part number se sort karo
    lessons.sort((a, b) => (a.part || 999) - (b.part || 999));

    // Prev/Next links ke liye articles list banao
    articles = lessons.map((l, i) => ({
      slug: l.slug,
      title: l.title,
      prevLesson: i > 0 ? { slug: lessons[i - 1].slug, title: lessons[i - 1].title } : null,
      nextLesson: i < lessons.length - 1 ? { slug: lessons[i + 1].slug, title: lessons[i + 1].title } : null,
    }));
  } catch (e) {
    console.warn("[Grammar] Lessons directory not found:", e.message);
  }

  return {
    lessons,
    articles,
  };
};
