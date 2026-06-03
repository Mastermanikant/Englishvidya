const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '..', '..', 'archive', 'duplicate_vocabulary_backups');
const v7Path = path.join(__dirname, '..', '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v7.json');

// Mock consolidation logic for algebra and formula
try {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    const aggregatedWords = new Map();
    
    files.forEach(file => {
        const filePath = path.join(backupDir, file);
        let content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        let data = JSON.parse(content);
        const fileCat = file.replace('.json', '');
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && (item.word || item.w)) {
                    const rawWord = (item.word || item.w || '').trim();
                    const keyWord = rawWord.toLowerCase();
                    if (keyWord === 'algebra' || keyWord === 'formula') {
                        const originalCat = item.category || fileCat;
                        console.log(`Aggregating: ${rawWord} from ${file} with category: ${originalCat}`);
                        const wordEntry = {
                            word: rawWord,
                            meaning: item.hindi_meaning || item.meaning_hi || item.m || item.hindi || item.meaning || '',
                            category: originalCat
                        };
                        if (!aggregatedWords.has(keyWord)) {
                            aggregatedWords.set(keyWord, []);
                        }
                        aggregatedWords.get(keyWord).push(wordEntry);
                    }
                }
            });
        }
    });

    console.log('Aggregated entries for algebra:', aggregatedWords.get('algebra'));
    console.log('Aggregated entries for formula:', aggregatedWords.get('formula'));

} catch(e) {
    console.error(e);
}
