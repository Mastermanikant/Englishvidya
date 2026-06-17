const fs = require('fs');
const path = require('path');

module.exports = function() {
  const translationsDir = path.join(__dirname, '..', '..', 'website', 'data', 'translations');
  const allTranslations = [];
  
  if (fs.existsSync(translationsDir)) {
    const categories = fs.readdirSync(translationsDir).filter(f => fs.statSync(path.join(translationsDir, f)).isDirectory());
    
    categories.forEach(categorySlug => {
      const catPath = path.join(translationsDir, categorySlug);
      const files = fs.readdirSync(catPath).filter(f => f.endsWith('.json'));
      
      files.forEach(file => {
        try {
          const filePath = path.join(catPath, file);
          const item = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          let word = item.word;
          if (word) {
            allTranslations.push({
              ...item,
              word: word,
              slug: item.slug || word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              category: item.category || categorySlug
            });
          }
        } catch (e) {
          console.error(`Error parsing translation file ${file}:`, e);
        }
      });
    });
  }
  
  return allTranslations;
};
