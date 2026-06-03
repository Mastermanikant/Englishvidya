const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'raw_content', 'grammar', 'modules');
const outputReport = path.join(__dirname, '..', 'project_meta', 'dedup_report.md');

function scanDuplicates() {
  console.log('Scanning modules for duplicate lines...');
  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.md'));
  
  const lineToFilesMap = new Map();
  
  files.forEach(file => {
    const filePath = path.join(modulesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      // Ignore empty, headers, very short lines, list markers, or common formatting lines
      if (!cleanLine || 
          cleanLine.startsWith('#') || 
          cleanLine.length < 15 || 
          cleanLine.startsWith('---') || 
          cleanLine.startsWith('|') ||
          cleanLine.includes('**Daily Conversation**') ||
          cleanLine.includes('**Common Mistake**')) {
        return;
      }
      
      if (!lineToFilesMap.has(cleanLine)) {
        lineToFilesMap.set(cleanLine, []);
      }
      lineToFilesMap.get(cleanLine).push({ file, lineNum: index + 1 });
    });
  });
  
  // Filter only duplicates
  const duplicates = [];
  for (const [line, occurrences] of lineToFilesMap.entries()) {
    if (occurrences.length > 1) {
      // Check if they are unique files
      const uniqueFiles = new Set(occurrences.map(o => o.file));
      if (uniqueFiles.size > 1) {
        duplicates.push({ line, occurrences });
      }
    }
  }
  
  // Generate Report
  let md = `# English Vidya — Grammar Content Deduplication Report\n\n`;
  md += `This report lists duplicate content detected across different module files in \`raw_content/grammar/modules/\`.\n\n`;
  md += `Total duplicate blocks/sentences found: **${duplicates.length}**\n\n`;
  md += `## Detected Duplicates & Resolution Plan\n\n`;
  
  duplicates.forEach((dup, index) => {
    md += `### ${index + 1}. Duplicate Content Found\n`;
    md += `> **Content:** \`${dup.line}\`\n\n`;
    md += `**Occurrences:**\n`;
    dup.occurrences.forEach(occ => {
      md += `- File: [\`${occ.file}\`](file:///d:/English%20Vidya/raw_content/grammar/modules/${occ.file}) (Line ${occ.lineNum})\n`;
    });
    md += `\n`;
    // Suggest resolution based on file names
    const has31B = dup.occurrences.some(o => o.file.includes('31B'));
    const has31D = dup.occurrences.some(o => o.file.includes('31D'));
    
    md += `**Resolution Strategy:**\n`;
    if (has31B && has31D) {
      md += `* Keep in [\`part_31B...\`](file:///d:/English%20Vidya/raw_content/grammar/modules/part_31B_translation_intelligence_english_thinking_system.md) as deep conceptual explanation.\n`;
      md += `* Convert to pure interactive drill exercise in [\`part_31D...\`](file:///d:/English%20Vidya/raw_content/grammar/modules/part_31D_error_correction_natural_english_mastery_system.md).\n`;
    } else {
      md += `* Keep the richest explanation. In final article assembly, refer to this content in only one article to save space.\n`;
    }
    md += `\n---\n\n`;
  });
  
  fs.writeFileSync(outputReport, md, 'utf8');
  console.log(`Report generated successfully at: ${outputReport}`);
}

scanDuplicates();
