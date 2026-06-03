const fs = require('fs');
const path = require('path');

const srcDir = 'd:/English Vidya/website/data/grammar/lessons';
const destDir = 'd:/English Vidya/Can Be Delete';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(file => {
  if (file.startsWith('part_') && file.endsWith('.json')) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${file} to Can Be Delete`);
  }
});
