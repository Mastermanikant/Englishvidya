const fs = require('fs');
const path = require('path');

function extractStyles(dir, extractedStyles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      extractStyles(fullPath, extractedStyles);
    } else if (fullPath.endsWith('.njk')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
      let match;
      let hasChanges = false;
      while ((match = styleRegex.exec(content)) !== null) {
        extractedStyles.push(`/* From ${fullPath.replace(/\\/g, '/')} */\n` + match[1].trim());
        hasChanges = true;
      }
      if (hasChanges) {
        content = content.replace(styleRegex, '');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Extracted styles from ${fullPath}`);
      }
    }
  }
  return extractedStyles;
}

const styles = extractStyles(path.join(__dirname, 'src'));
if (styles.length > 0) {
  const cssContent = '\n\n/* --- EXTRACTED INLINE STYLES --- */\n\n' + styles.join('\n\n');
  fs.appendFileSync(path.join(__dirname, 'website', 'css', 'style.css'), cssContent, 'utf8');
  console.log('Appended extracted styles to website/css/style.css');
} else {
  console.log('No inline styles found.');
}
