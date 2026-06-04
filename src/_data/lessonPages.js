// src/grammar/lessonPages.js
// ══════════════════════════════════════════════════════════
// Eleventy Global Data File — Grammar Lesson Pages Array
// Yeh sabhi lesson JSON files ek array me load karta hai
// jise lessons.njk pagination use karta hai.
// ══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

module.exports = function () {
  const lessonsDir = path.join(
    __dirname,
    "../../website/data/grammar/lessons"
  );

  const lessons = [];

  try {
    const files = fs
      .readdirSync(lessonsDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(lessonsDir, file), "utf8");
        const data = JSON.parse(raw);
        if (data.slug && data.title) {
          lessons.push(data);
        }
      } catch (e) {
        console.warn(`[lessonPages] Skip ${file}:`, e.message);
      }
    }

    // Part number se sort (Part 1 → Part 2 → Part 3...)
    lessons.sort((a, b) => (a.part || 999) - (b.part || 999));
  } catch (e) {
    console.warn("[lessonPages] Directory not found:", e.message);
  }

  return lessons;
};
