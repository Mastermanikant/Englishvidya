const categoriesIndex = require('./categoriesIndex');

module.exports = function() {
  const cats = categoriesIndex();
  const mainGroups = {};
  
  cats.forEach(c => {
    const main = c.mainCategory || 'Other Categories';
    const sub = c.subCategory || 'General';
    
    if (!mainGroups[main]) {
      mainGroups[main] = {};
    }
    if (!mainGroups[main][sub]) {
      mainGroups[main][sub] = [];
    }
    mainGroups[main][sub].push(c);
  });
  
  // Convert to an array structure for easier iteration in Nunjucks
  const result = [];
  for (const [mainName, subObj] of Object.entries(mainGroups)) {
    const subCategories = [];
    for (const [subName, items] of Object.entries(subObj)) {
      subCategories.push({
        name: subName,
        items: items
      });
    }
    result.push({
      name: mainName,
      subCategories: subCategories
    });
  }
  
  return result;
};
