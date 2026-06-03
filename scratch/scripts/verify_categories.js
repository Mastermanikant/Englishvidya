const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '..', '..', 'archive', 'duplicate_vocabulary_backups');
const categoriesDir = path.join(__dirname, '..', '..', 'website', 'data', 'vocabulary', 'categories');

try {
    console.log('--- VOCABULARY INTEGRITY VERIFICATION ---');
    
    // 1. Gather all words from backup files
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    const backupWords = new Set();
    let backupTotalWordsLoaded = 0;
    
    backupFiles.forEach(file => {
        const filePath = path.join(backupDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && (item.word || item.w)) {
                    const w = (item.word || item.w).toLowerCase().trim();
                    if (w) {
                        backupWords.add(w);
                        backupTotalWordsLoaded++;
                    }
                }
            });
        }
    });
    
    console.log(`Backup: Loaded ${backupTotalWordsLoaded} word entries across ${backupFiles.length} files.`);
    console.log(`Backup: ${backupWords.size} unique words detected.`);
    
    // 2. Gather all words from active consolidated category files
    const activeFiles = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));
    const activeWords = new Set();
    let activeTotalWordsLoaded = 0;
    
    activeFiles.forEach(file => {
        const filePath = path.join(categoriesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && item.word) {
                    const w = item.word.toLowerCase().trim();
                    if (w) {
                        activeWords.add(w);
                        activeTotalWordsLoaded++;
                    }
                }
            });
        }
    });
    
    console.log(`Active: Loaded ${activeTotalWordsLoaded} word entries across ${activeFiles.length} files.`);
    console.log(`Active: ${activeWords.size} unique words detected.`);
    
    // 3. Find missing words
    const missing = [];
    backupWords.forEach(w => {
        if (!activeWords.has(w)) {
            missing.push(w);
        }
    });
    
    console.log(`Verification: ${missing.length} backup words are missing from the consolidated category files.`);
    if (missing.length > 0) {
        console.log('Sample missing words:', missing.slice(0, 10));
    } else {
        console.log('✅ Success: 100% of backup words are fully accounted for in the consolidated categories!');
    }
    
} catch (e) {
    console.error('Error during verification:', e);
}
