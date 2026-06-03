const fs = require('fs');

const indexFile = 'd:\\English Vidya\\website\\index.html';
let html = fs.readFileSync(indexFile, 'utf8');

const oldScript = '<script src="./js/app.js"></script>';
const newScript = '<script src="./js/app.js"></script>\n    <script src="./js/home-redesign.js"></script>';

if (html.includes(oldScript) && !html.includes('home-redesign.js')) {
    html = html.replace(oldScript, newScript);
    fs.writeFileSync(indexFile, html, 'utf8');
    console.log('Successfully injected JS script tag.');
} else {
    console.log('Script already injected or target not found.');
}
