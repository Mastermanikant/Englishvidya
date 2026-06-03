const fs = require('fs');

const indexFile = 'd:\\English Vidya\\website\\index.html';
const newHomeFile = 'd:\\English Vidya\\scratch\\new_home.html';

let html = fs.readFileSync(indexFile, 'utf8');
const newHome = fs.readFileSync(newHomeFile, 'utf8');

// 1. Add CSS Link
const cssLink = '<link rel="stylesheet" href="./css/style.css">\n    <link rel="stylesheet" href="./css/home-redesign.css">';
html = html.replace('<link rel="stylesheet" href="./css/style.css">', cssLink);

// 2. Replace Home View
// Find start index
const startStr = '<!-- ── HOME VIEW (Visible by Default) ── -->';
const endStr = '<!-- ── ABOUT VIEW (Static & Beautiful) ── -->';

const startIndex = html.indexOf(startStr);
const endIndex = html.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    html = html.substring(0, startIndex) + newHome + '\n        ' + html.substring(endIndex);
    fs.writeFileSync(indexFile, html, 'utf8');
    console.log('Successfully patched index.html');
} else {
    console.error('Could not find start or end markers');
}
