const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'raw_content', 'grammar', 'modules');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function processPart1() {
    const inputFilePath = path.join(__dirname, '..', 'raw_content', 'grammar', 'english_basics_part1.md');
    const content = fs.readFileSync(inputFilePath, 'utf8');
    
    // Match: "Topic X - Title" or "Topic X — Title"
    const topicRegex = /Topic\s+(\d+[A-Z]*)\s+[-—]\s+([^\n]+)/g;
    let match;
    const topics = [];
    
    while ((match = topicRegex.exec(content)) !== null) {
        topics.push({
            id: match[1],
            title: match[2].trim(),
            index: match.index
        });
    }
    
    console.log(`[Part 1] Found ${topics.length} topics.`);
    
    for (let i = 0; i < topics.length; i++) {
        const current = topics[i];
        const next = topics[i + 1];
        
        const start = current.index;
        const end = next ? next.index : content.length;
        
        const topicContent = content.slice(start, end).trim();
        
        const cleanTitle = current.title
            .toLowerCase()
            .replace(/\([^)]*\)/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_');
            
        const paddedId = current.id.padStart(2, '0');
        const fileName = `topic_${paddedId}_${cleanTitle}.md`;
        const filePath = path.join(outputDir, fileName);
        
        fs.writeFileSync(filePath, topicContent, 'utf8');
        console.log(`Created: ${fileName}`);
    }
}

function processPart2() {
    const inputFilePath = path.join(__dirname, '..', 'raw_content', 'grammar', 'english_basics_part2.md');
    const content = fs.readFileSync(inputFilePath, 'utf8');
    
    // Match: "Part X - Title" or "Part X — Title"
    const partRegex = /Part\s+(\d+[A-Z]*L?\d*)\s+[-—]\s+([^\n]+)/g;
    let match;
    const parts = [];
    
    while ((match = partRegex.exec(content)) !== null) {
        const title = match[2].trim();
        if (title.includes('✅') || title.includes('⏳')) {
            continue; // Skip the checklist entries at the end
        }
        parts.push({
            id: match[1],
            title: title,
            index: match.index
        });
    }
    
    console.log(`[Part 2] Found ${parts.length} actual parts.`);
    
    for (let i = 0; i < parts.length; i++) {
        const current = parts[i];
        const next = parts[i + 1];
        
        const start = current.index;
        const end = next ? next.index : content.length;
        
        const partContent = content.slice(start, end).trim();
        
        const cleanTitle = current.title
            .toLowerCase()
            .replace(/\([^)]*\)/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_');
            
        const paddedId = current.id.padStart(2, '0');
        const fileName = `part_${paddedId}_${cleanTitle}.md`;
        const filePath = path.join(outputDir, fileName);
        
        fs.writeFileSync(filePath, partContent, 'utf8');
        console.log(`Created: ${fileName}`);
    }
}

try {
    processPart1();
    processPart2();
    console.log('Modularization completed successfully!');
} catch (err) {
    console.error('Error during modularization:', err);
}
