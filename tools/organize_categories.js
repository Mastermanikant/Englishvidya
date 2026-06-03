const fs = require('fs');
const path = require('path');

const indexFilePath = path.join(__dirname, '..', 'website', 'data', 'site', 'categories-index.json');
const outputFilePath = path.join(__dirname, '..', 'project_meta', 'categories_summary_list.md');

try {
    if (!fs.existsSync(indexFilePath)) {
        console.error('Categories index file not found!');
        process.exit(1);
    }
    
    let content = fs.readFileSync(indexFilePath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    const categories = JSON.parse(content);
    console.log(`Loaded ${categories.length} categories.`);
    
    // Filter out uncategorized or empty names
    const filtered = categories.filter(c => c.name && c.slug && c.slug !== 'uncategorized');
    
    // Sort by word count descending
    filtered.sort((a, b) => b.count - a.count);
    
    let mdContent = `# English Vidya - Active Categories Summary List\n\n`;
    mdContent += `यह फ़ाइल वेबसाइट की सभी **${filtered.length} सक्रिय श्रेणियों (Active Categories)** और उनके शब्द-संख्या (Word Counts) की सूची है।\n\n`;
    mdContent += `| क्र.सं. | श्रेणी का नाम (Category Name) | आइकन (Icon) | शब्दों की संख्या (Word Count) | स्लग (Slug) |\n`;
    mdContent += `|---|---|---|---|---|\n`;
    
    let totalWords = 0;
    filtered.forEach((c, idx) => {
        mdContent += `| ${idx + 1} | **${c.name}** | ${c.icon || '📁'} | ${c.count} | \`${c.slug}\` |\n`;
        totalWords += c.count;
    });
    
    mdContent += `\n\n---\n### 📊 सांख्यिकी (Stats Summary)\n`;
    mdContent += `* **कुल सक्रिय श्रेणियां (Total Active Categories):** ${filtered.length}\n`;
    mdContent += `* **श्रेणियों में कुल शब्द-संख्या (Total Word Count across categories):** ${totalWords}\n`;
    
    fs.writeFileSync(outputFilePath, mdContent, 'utf8');
    console.log(`Successfully generated categories_summary_list.md with ${filtered.length} categories!`);
    
} catch (e) {
    console.error('Error organizing categories:', e);
}
