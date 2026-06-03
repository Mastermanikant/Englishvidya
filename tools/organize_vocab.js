const fs = require('fs');
const path = require('path');

const categoriesDir = path.join(__dirname, '..', 'website', 'data', 'vocabulary', 'categories');
const v7Path = path.join(__dirname, '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v7.json');
const outputDir = path.join(__dirname, '..', 'raw_content', 'vocabulary', 'themes');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Load v7 Master Dictionary for lookup and enrichment
let masterDict = new Map();
try {
    if (fs.existsSync(v7Path)) {
        const v7Data = JSON.parse(fs.readFileSync(v7Path, 'utf8'));
        v7Data.forEach(item => {
            if (item && item.word) {
                masterDict.set(item.word.toLowerCase().trim(), item);
            }
        });
        console.log(`Loaded Master Dictionary v7 with ${masterDict.size} unique lookup words.`);
    }
} catch (e) {
    console.warn('Could not load Master Dictionary v7 for enrichment:', e.message);
}

// Expanded Themes Map
const themes = {
    '01a_household_and_items': { title: 'Household, Furniture & Daily Belongings (घरेलू सामान और दैनिक वस्तुएं)', words: [] },
    '01b_food_and_beverages': { title: 'Food, Beverages & Groceries (भोजन, पेय पदार्थ और राशन शब्दावली)', words: [] },
    '01c_clothing_and_style': { title: 'Clothing, Fashion & Accessories (कपड़े, फ़ैशन और सहायक उपकरण)', words: [] },
    '01d_human_body_relations': { title: 'Human Body, Health & Relationships (मानव शरीर, स्वास्थ्य और संबंध)', words: [] },
    '01e_travel_and_directions': { title: 'Travel, Commuting & Directions (यात्रा, मार्ग और दिशाएं)', words: [] },
    '01f_numbers_time_dates': { title: 'Numbers, Time, Dates & Seasons (संख्याएं, समय, तिथियां और मौसम)', words: [] },
    '01g_general_daily_words': { title: 'General Daily Essentials (सामान्य दैनिक उपयोगी शब्द)', words: [] },
    
    '02_emotions_and_feelings': { title: 'Emotions, Feelings & Wellness (भावनाएं, संवेदनाएं और मानसिक स्वास्थ्य)', words: [] },
    '03_business_and_work': { title: 'Business, Work & Workplace English (कार्यालय और व्यावसायिक शब्दावली)', words: [] },
    '04_academic_and_exams': { title: 'Academic, Science & Competitive Exams (शैक्षणिक और प्रतियोगी परीक्षाओं के लिए)', words: [] },
    '05_slang_and_native_idioms': { title: 'Native Expressions, Slangs & Connectors (बोलचाल के मुहावरे, स्लैंग और योजक)', words: [] },
    '06_nature_and_weather': { title: 'Nature, Animals & Weather (प्रकृति, पशु-पक्षी और मौसम शब्दावली)', words: [] }
};

function getThemeKey(filename) {
    const fn = filename.toLowerCase();
    
    // Core themes first
    if (fn.includes('anger') || fn.includes('sad') || fn.includes('happy') || fn.includes('emotion') || fn.includes('wellness') || fn.includes('jealousy') || fn.includes('disgust') || fn.includes('distress') || fn.includes('guilt') || fn.includes('fear') || fn.includes('hope') || fn.includes('boredom') || fn.includes('compassion') || fn.includes('awe') || fn.includes('irritability')) {
        return '02_emotions_and_feelings';
    }
    if (fn.includes('alternative_to') || fn.includes('discourse_marker') || fn.includes('linking_phrase') || fn.includes('linking_word') || fn.includes('slang') || fn.includes('chat') || fn.includes('messaging') || fn.includes('greetings')) {
        return '05_slang_and_native_idioms';
    }
    if (fn.includes('academic') || fn.includes('algebra') || fn.includes('geometry') || fn.includes('arithmetic') || fn.includes('civilization') || fn.includes('education') || fn.includes('learning') || fn.includes('linguistics') || fn.includes('critical_thinking') || fn.includes('cognitive') || fn.includes('comprehension')) {
        return '04_academic_and_exams';
    }
    if (fn.includes('banking') || fn.includes('bargaining') || fn.includes('finance') || fn.includes('e-commerce') || fn.includes('corporate') || fn.includes('work') || fn.includes('gig_economy') || fn.includes('administration') || fn.includes('accounting') || fn.includes('automation') || fn.includes('collab')) {
        return '03_business_and_work';
    }
    if (fn.includes('animal') || fn.includes('bird') || fn.includes('weather') || fn.includes('climate') || fn.includes('ecosystem') || fn.includes('biodiversity') || fn.includes('energy') || fn.includes('force') || fn.includes('insect') || fn.includes('eco-friendly') || fn.includes('conservation') || fn.includes('envir')) {
        return '06_nature_and_weather';
    }
    
    // Sub-splitting the giant 01_daily_life_survival
    if (fn.includes('home') || fn.includes('house') || fn.includes('bedroom') || fn.includes('living_room') || fn.includes('cleaning') || fn.includes('kitchen') || fn.includes('dining') || fn.includes('belongings') || fn.includes('furniture') || fn.includes('chore') || fn.includes('supplies')) {
        return '01a_household_and_items';
    }
    if (fn.includes('food') || fn.includes('drink') || fn.includes('beverage') || fn.includes('condiment') || fn.includes('grocery') || fn.includes('herb') || fn.includes('lentil') || fn.includes('grain')) {
        return '01b_food_and_beverages';
    }
    if (fn.includes('clothing') || fn.includes('fashion') || fn.includes('wear') || fn.includes('accessory') || fn.includes('bags') || fn.includes('keys')) {
        return '01c_clothing_and_style';
    }
    if (fn.includes('family') || fn.includes('relation') || fn.includes('human') || fn.includes('body') || fn.includes('health') || fn.includes('hygiene') || fn.includes('identity')) {
        return '01d_human_body_relations';
    }
    if (fn.includes('travel') || fn.includes('direction') || fn.includes('position') || fn.includes('location') || fn.includes('commuting') || fn.includes('movement') || fn.includes('transport') || fn.includes('road') || fn.includes('street')) {
        return '01e_travel_and_directions';
    }
    if (fn.includes('number') || fn.includes('time') || fn.includes('date') || fn.includes('measure') || fn.includes('calendar') || fn.includes('season')) {
        return '01f_numbers_time_dates';
    }
    
    return '01g_general_daily_words';
}

try {
    const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));
    console.log(`Scanning ${files.length} category JSON files...`);
    
    files.forEach(file => {
        const filePath = path.join(categoriesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        
        const data = JSON.parse(content);
        const themeKey = getThemeKey(file);
        const theme = themes[themeKey] || themes['01g_general_daily_words'];
        
        const categoryName = file.replace('.json', '').replace(/_/g, ' ');
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && (item.word || item.w)) {
                    const rawWord = (item.word || item.w || '').trim();
                    const keyWord = rawWord.toLowerCase();
                    
                    // Lookup in v7 dictionary to enrich empty meanings/pronunciations
                    let meaning = item.meaning_hi || item.m || item.hindi || item.hindi_meaning || '';
                    let pronunciation = item.pronunciation_help || item.p || item.pronunciation || '';
                    let definition = item.simple_explanation || item.definition || '';
                    
                    if (masterDict.has(keyWord)) {
                        const rich = masterDict.get(keyWord);
                        if (!meaning) meaning = rich.hindi_meaning || '';
                        if (!pronunciation) pronunciation = rich.pronunciation_help || '';
                        if (!definition) definition = rich.simple_explanation || rich.definition || '';
                    }
                    
                    theme.words.push({
                        word: rawWord,
                        meaning: meaning,
                        pronunciation: pronunciation,
                        definition: definition,
                        category: categoryName
                    });
                }
            });
        }
    });
    
    // Clean old generated theme files
    if (fs.existsSync(outputDir)) {
        fs.readdirSync(outputDir).forEach(f => {
            fs.unlinkSync(path.join(outputDir, f));
        });
    }

    // Write out the split theme files
    Object.keys(themes).forEach(key => {
        const theme = themes[key];
        const uniqueWords = new Map();
        
        theme.words.forEach(w => {
            const wordKey = w.word.toLowerCase();
            if (!uniqueWords.has(wordKey)) {
                uniqueWords.set(wordKey, w);
            }
        });
        
        const sortedWords = Array.from(uniqueWords.values()).sort((a, b) => a.word.localeCompare(b.word));
        
        if (sortedWords.length === 0) return;
        
        // Smart split for the giant 01g general daily words theme
        if (key === '01g_general_daily_words') {
            const chunkSize = 850; // Splitting to get ~8 balanced parts of ~800 words
            for (let chunkIndex = 0; chunkIndex < sortedWords.length; chunkIndex += chunkSize) {
                const chunk = sortedWords.slice(chunkIndex, chunkIndex + chunkSize);
                const partNum = Math.floor(chunkIndex / chunkSize) + 1;
                
                let mdContent = `# General Daily Essentials Part ${partNum} (सामान्य दैनिक उपयोगी शब्द - भाग ${partNum})\n\n`;
                mdContent += `यह आपकी मास्टर शब्दावली फ़ाइल है जो विभिन्न श्रेणियों से संकलित की गई है।\n\n`;
                mdContent += `| अंग्रेज़ी शब्द (Word) | हिंदी अर्थ (Meaning) | उच्चारण सहायता (Pronunciation) | संक्षिप्त परिभाषा (Short Definition) | श्रेणी (Original Category) |\n`;
                mdContent += `|---|---|---|---|---|\n`;
                
                chunk.forEach(w => {
                    mdContent += `| **${w.word}** | ${w.meaning} | *${w.pronunciation}* | ${w.definition} | \`${w.category}\` |\n`;
                });
                
                const outputFilePath = path.join(outputDir, `01g_general_daily_words_part${partNum}.md`);
                fs.writeFileSync(outputFilePath, mdContent, 'utf8');
                console.log(`Created Theme File: 01g_general_daily_words_part${partNum}.md with ${chunk.length} unique words.`);
            }
        } else {
            // Standard theme file output
            let mdContent = `# ${theme.title}\n\n`;
            mdContent += `यह आपकी मास्टर शब्दावली फ़ाइल है जो विभिन्न श्रेणियों से संकलित की गई है।\n\n`;
            mdContent += `| अंग्रेज़ी शब्द (Word) | हिंदी अर्थ (Meaning) | उच्चारण सहायता (Pronunciation) | संक्षिप्त परिभाषा (Short Definition) | श्रेणी (Original Category) |\n`;
            mdContent += `|---|---|---|---|---|\n`;
            
            sortedWords.forEach(w => {
                mdContent += `| **${w.word}** | ${w.meaning} | *${w.pronunciation}* | ${w.definition} | \`${w.category}\` |\n`;
            });
            
            const outputFilePath = path.join(outputDir, `${key}.md`);
            fs.writeFileSync(outputFilePath, mdContent, 'utf8');
            console.log(`Created Theme File: ${key}.md with ${sortedWords.length} unique words.`);
        }
    });
    
    console.log('Vocabulary reorganization & enrichment completed successfully!');
} catch (e) {
    console.error('Error during vocabulary reorganization:', e);
}
