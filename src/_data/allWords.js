const fs = require('fs');
const path = require('path');

module.exports = function() {
  const categoriesDir = path.join(__dirname, '..', '..', 'website', 'data', 'vocabulary', 'categories');
  const allWords = [];
  
  if (fs.existsSync(categoriesDir)) {
    const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      try {
        const filePath = path.join(categoriesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const categorySlug = file.replace('.json', '');
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          data.forEach(item => {
            // Some old data might have 'w' instead of 'word'
            let word = item.word || item.w;
            let meaning = item.meaning || item.definition || item.m;
            let pron = item.pron || item.p;
            let example = item.example || item.ex;
            
            if (word) {
              allWords.push({
                word: word,
                slug: word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                meaning: meaning,
                pron: pron,
                example: example,
                category: categorySlug
              });
            }
          });
        }
      } catch (e) {
        console.error(`Error parsing vocabulary file ${file}:`, e);
      }
    });
  }
  
  // Deduplicate by slug just in case
  const uniqueWords = [];
  const slugs = new Set();
  
  for (const w of allWords) {
    if (!slugs.has(w.slug)) {
      slugs.add(w.slug);
      uniqueWords.push(w);
    }
  }

  return uniqueWords;
};
