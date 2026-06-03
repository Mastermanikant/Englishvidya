const fs = require('fs');
const path = require('path');

const dir = 'Archive/SourceFiles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log(`=== File: ${file} ===`);
    console.log(lines.slice(0, 8).join('\n'));
    console.log('=====================\n');
});
