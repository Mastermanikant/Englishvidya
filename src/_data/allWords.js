const fs = require('fs');
const path = require('path');

module.exports = function() {
  const categoriesDir = path.join(__dirname, '..', '..', 'website', 'data', 'vocabulary', 'categories');
  const dictionaryDir = path.join(__dirname, '..', '..', 'website', 'data', 'dictionary');
  const allWords = [];
  
  // 1. Process old category arrays
  if (fs.existsSync(categoriesDir)) {
    const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      try {
        const filePath = path.join(categoriesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        const data = JSON.parse(fileContent);
        const categorySlug = file.replace('.json', '');
        
        if (Array.isArray(data)) {
          data.forEach(item => {
            let word = item.word || item.w;
            let meaning = item.meaning || item.definition || item.m;
            let pron = item.pron || item.p;
            let example = item.example || item.ex;
            
            if (word) {
              allWords.push({
                ...item,
                word: word,
                slug: item.slug || word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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

  // 2. Process new dictionary format (individual word files in category folders)
  if (fs.existsSync(dictionaryDir)) {
    const categories = fs.readdirSync(dictionaryDir).filter(f => fs.statSync(path.join(dictionaryDir, f)).isDirectory());
    
    categories.forEach(categorySlug => {
      const catPath = path.join(dictionaryDir, categorySlug);
      const files = fs.readdirSync(catPath).filter(f => f.endsWith('.json'));
      
      files.forEach(file => {
        try {
          const filePath = path.join(catPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
          const item = JSON.parse(fileContent);
          
          let word = item.word;
          if (word) {
            allWords.push({
              ...item,
              word: word,
              slug: item.slug || word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              category: item.category || categorySlug
            });
          }
        } catch (e) {
          console.error(`Error parsing dictionary file ${file}:`, e);
        }
      });
    });
  }
  
  // Deduplicate by slug just in case. New ones will overwrite old ones if they exist at the end
  const uniqueMap = new Map();
  for (const w of allWords) {
    uniqueMap.set(w.slug, w);
  }

  return Array.from(uniqueMap.values());
};
