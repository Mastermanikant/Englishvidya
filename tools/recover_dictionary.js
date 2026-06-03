const fs = require('fs');
const path = require('path');

const v5Path = path.join(__dirname, '..', 'archive', 'old_master_versions', 'master_dictionary_FINAL_v5.json');
const v6Path = path.join(__dirname, '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v6.json');
const outputPath = path.join(__dirname, '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v7.json');

function decodeMojibake(str) {
    if (!str) return '';
    if (!str.includes('à¤') && !str.includes('à¥')) {
        return str;
    }
    try {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code === 0x20AC) bytes.push(0x80);
            else if (code === 0x201A) bytes.push(0x82);
            else if (code === 0x0192) bytes.push(0x83);
            else if (code === 0x201E) bytes.push(0x84);
            else if (code === 0x2026) bytes.push(0x85);
            else if (code === 0x2020) bytes.push(0x86);
            else if (code === 0x2021) bytes.push(0x87);
            else if (code === 0x02C6) bytes.push(0x88);
            else if (code === 0x2030) bytes.push(0x89);
            else if (code === 0x0160) bytes.push(0x8A);
            else if (code === 0x2039) bytes.push(0x8B);
            else if (code === 0x0152) bytes.push(0x8C);
            else if (code === 0x017D) bytes.push(0x8E);
            else if (code === 0x2018) bytes.push(0x91);
            else if (code === 0x2019) bytes.push(0x92);
            else if (code === 0x201C) bytes.push(0x93);
            else if (code === 0x201D) bytes.push(0x94);
            else if (code === 0x2022) bytes.push(0x95);
            else if (code === 0x2013) bytes.push(0x96);
            else if (code === 0x2014) bytes.push(0x97);
            else if (code === 0x02DC) bytes.push(0x98);
            else if (code === 0x2122) bytes.push(0x99);
            else if (code === 0x0161) bytes.push(0x9A);
            else if (code === 0x203A) bytes.push(0x9B);
            else if (code === 0x0153) bytes.push(0x9C);
            else if (code === 0x017E) bytes.push(0x9E);
            else if (code === 0x0178) bytes.push(0x9F);
            else bytes.push(code & 0xFF);
        }
        return Buffer.from(bytes).toString('utf8');
    } catch (e) {
        return str;
    }
}

try {
    console.log('Loading dictionaries...');
    
    const v6Data = JSON.parse(fs.readFileSync(v6Path, 'utf8'));
    console.log(`Loaded clean v6 database with ${v6Data.length} entries.`);
    
    // Create map for fast lookup with rich quality preservation
    const wordMap = new Map();
    v6Data.forEach(item => {
        if (item && item.word) {
            const key = item.word.toLowerCase().trim();
            const hasHindi = !!(item.hindi_meaning || item.meaning_hi || item.m || item.hindi);
            
            // Proactively preserve rich quality entries! Never overwrite a rich entry with a poor one.
            if (!wordMap.has(key) || (!wordMap.get(key).hindi_meaning && hasHindi)) {
                wordMap.set(key, {
                    word: item.word,
                    hindi_meaning: item.hindi_meaning || item.meaning_hi || item.m || item.hindi || '',
                    pronunciation_help: item.pronunciation_help || item.pronunciation || item.p || '',
                    word_type: item.word_type || item.partOfSpeech || 'Noun',
                    simple_explanation: item.simple_explanation || item.definition || item.meaning || '',
                    daily_life_use: item.daily_life_use || '',
                    spoken_use: item.spoken_use || '',
                    natural_native_use: item.natural_native_use || '',
                    emotional_tone: item.emotional_tone || 'Neutral',
                    common_collocations: item.common_collocations || [],
                    examples: item.examples || item.example ? [item.example] : [],
                    common_mistakes: item.common_mistakes || '',
                    hindi_confusion_correction: item.hindi_confusion_correction || '',
                    formal_informal_note: item.formal_informal_note || '',
                    image_url: item.image_url || ''
                });
            }
        }
    });
    
    // Load v5 (18,346 words, raw)
    let v5Text = fs.readFileSync(v5Path, 'utf8');
    if (v5Text.charCodeAt(0) === 0xFEFF) {
        v5Text = v5Text.slice(1);
    }
    const v5Data = JSON.parse(v5Text);
    console.log(`Loaded raw v5 database with ${v5Data.length} entries.`);
    
    let recoveredCount = 0;
    
    // Process and merge v5 entries
    v5Data.forEach(item => {
        if (!item || !item.word) return;
        const key = item.word.toLowerCase().trim();
        const hasHindi = !!(item.hindi_meaning || item.meaning_hi || item.m || item.hindi);
        
        const decodedHindi = decodeMojibake(item.hindi_meaning || item.meaning_hi || item.m || item.hindi || '');
        const decodedPron = decodeMojibake(item.pronunciation_help || item.pronunciation || item.p || '');
        
        if (!wordMap.has(key)) {
            // Recover new word!
            const newItem = {
                word: item.word,
                hindi_meaning: decodedHindi,
                pronunciation_help: decodedPron,
                word_type: item.word_type || item.partOfSpeech || 'Noun',
                simple_explanation: item.simple_explanation || item.definition || item.meaning || '',
                daily_life_use: item.daily_life_use || '',
                spoken_use: item.spoken_use || '',
                natural_native_use: item.natural_native_use || '',
                emotional_tone: item.emotional_tone || 'Neutral',
                common_collocations: item.common_collocations || [],
                examples: item.examples || item.example ? [item.example] : [],
                common_mistakes: item.common_mistakes || '',
                hindi_confusion_correction: item.hindi_confusion_correction || '',
                formal_informal_note: item.formal_informal_note || '',
                image_url: item.image_url || ''
            };
            wordMap.set(key, newItem);
            recoveredCount++;
        } else if (!wordMap.get(key).hindi_meaning && hasHindi) {
            // Update poor entry with rich decoded values!
            const entry = wordMap.get(key);
            entry.hindi_meaning = decodedHindi;
            entry.pronunciation_help = decodedPron;
            entry.simple_explanation = item.simple_explanation || item.definition || item.meaning || entry.simple_explanation;
            recoveredCount++;
        }
    });
    
    console.log(`Successfully recovered/enriched ${recoveredCount} words!`);
    
    const mergedArray = Array.from(wordMap.values());
    console.log(`Total active database size after merge: ${mergedArray.length} entries.`);
    
    mergedArray.sort((a, b) => a.word.localeCompare(b.word));
    fs.writeFileSync(outputPath, JSON.stringify(mergedArray, null, 2), 'utf8');
    console.log(`Successfully wrote master_dictionary_FINAL_v7.json to destination!`);
    
} catch (e) {
    console.error('Error during dictionary recovery:', e);
}
