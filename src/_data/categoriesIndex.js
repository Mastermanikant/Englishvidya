const fs = require('fs');
const path = require('path');

module.exports = function() {
  const filePath = path.join(__dirname, '../../website/data/site/categories-index.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error("[Eleventy Data] Could not load categories index", err);
    return [];
  }
};
