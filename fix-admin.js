const fs = require('fs');
let content = fs.readFileSync('D:/Englishvidya/Website_Source/src/admin/index.njk', 'utf8');

// Replace tabs
content = content.replace('<div class="tabs-container">', '<div class="tabs-container" role="tablist">');
content = content.replace(/<button class="tab-btn(.*?)onclick="switchTab\('([^']+)'\)"(.*?)>/g, function(match, p1, p2, p3) {
  let isSelected = match.includes('active') ? 'true' : 'false';
  return `<button class="tab-btn${p1}onclick="switchTab('${p2}')"${p3} role="tab" aria-selected="${isSelected}">`;
});

// Replace escapeHTML definition
const oldFunc = `function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}`;
content = content.replace(oldFunc, '');

// Replace calls
content = content.replace(/escapeHTML\(/g, 'window.escapeHTML(');

fs.writeFileSync('D:/Englishvidya/Website_Source/src/admin/index.njk', content);
console.log('done');
