const fs = require('fs');
let content = fs.readFileSync('D:/Englishvidya/Website_Source/src/profile/index.njk', 'utf8');

const oldFunc = `function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}`;

content = content.replace(oldFunc, '');
content = content.replace(/escapeHTML\(/g, 'window.escapeHTML(');

fs.writeFileSync('D:/Englishvidya/Website_Source/src/profile/index.njk', content);
console.log('done');
