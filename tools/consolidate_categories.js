const fs = require('fs');
const path = require('path');

const categoriesDir = path.join(__dirname, '..', 'website', 'data', 'vocabulary', 'categories');
const v7Path = path.join(__dirname, '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v7.json');
const indexFilePath = path.join(__dirname, '..', 'website', 'data', 'site', 'categories-index.json');
const backupDir = path.join(__dirname, '..', 'archive', 'duplicate_vocabulary_backups');

// 1. Load v7 Master Dictionary for rich translations
let masterDict = new Map();
try {
    if (fs.existsSync(v7Path)) {
        const v7Data = JSON.parse(fs.readFileSync(v7Path, 'utf8').replace(/^\uFEFF/, ''));
        v7Data.forEach(item => {
            if (item && item.word) {
                masterDict.set(item.word.toLowerCase().trim(), item);
            }
        });
        console.log(`Loaded Master Dictionary v7 with ${masterDict.size} unique lookup words.`);
    }
} catch (e) {
    console.error('Could not load Master Dictionary v7:', e.message);
}

// 2. Define Category Consolidation / Mapping rules
function getConsolidatedCategory(rawCat) {
    if (!rawCat || rawCat.toLowerCase() === 'uncategorized') return 'General English Vocabulary';
    
    let cat = rawCat.replace(/___/g, ' ').replace(/__/g, ' ').replace(/_/g, ' ').trim();
    // Capitalize words
    cat = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    // Mapping rules
    const catLower = cat.toLowerCase();
    
    // Weak vs Strong Alternatives
    if (catLower.startsWith('weak abstract') || catLower.includes('alternative') || catLower.includes('weak professional') || catLower.includes('formal educational') || catLower.includes('weak vs strong')) {
        return 'Weak vs Strong Alternatives';
    }
    
    // Slang and Alternatives
    if (catLower.startsWith('alternative to') || catLower.includes('slang') || catLower.includes('native expressions')) {
        return 'Slang & Modern Expressions';
    }
    // Discourse Markers
    if (catLower.includes('discourse marker')) {
        return 'Discourse Markers';
    }
    // Linking Words
    if (catLower.includes('linking word') || catLower.includes('linking phrase') || catLower.includes('connectives') || catLower.includes('logical connective')) {
        return 'Linking Words & Connectors';
    }
    // Transitions
    if (catLower.includes('transition')) {
        return 'Transitions & Connectives';
    }
    // Collocations
    if (catLower.includes('collocation') || catLower.includes('word pair') || catLower.includes('verb phrase') || catLower.includes('adjective-noun') || catLower.includes('verb-noun') || catLower.includes('verb-adverb') || catLower.includes('verb-adjective') || catLower.includes('adverb-adjective') || catLower.includes('adverb-verb') || catLower.includes('collocations')) {
        return 'Collocations & Phrases';
    }
    // Birds
    if (catLower.includes('bird')) {
        return 'Birds & Bird Sounds';
    }
    // Beverages
    if (catLower.includes('beverage')) {
        return 'Beverages (Hot & Cold)';
    }
    // Health & Illnesses
    if (catLower.includes('illness') || catLower.includes('disease') || catLower.includes('symptom') || catLower.includes('skin condition') || catLower.includes('immune system') || catLower.includes('physical injury') || catLower.includes('medical')) {
        return 'Health, Diseases & Symptoms';
    }
    // Emotions
    if (catLower.includes('anger') || catLower.includes('frustration') || catLower.includes('irritability') || catLower.includes('resentment')) {
        return 'Anger & Frustration';
    }
    if (catLower.includes('sadness') || catLower.includes('grief') || catLower.includes('nostalgia') || catLower.includes('yearning')) {
        return 'Sadness & Grief';
    }
    if (catLower.includes('fear') || catLower.includes('anxiety') || catLower.includes('distress') || catLower.includes('panic')) {
        return 'Fear & Anxiety';
    }
    if (catLower.includes('happy') || catLower.includes('joy') || catLower.includes('joyful') || catLower.includes('serenity') || catLower.includes('calm') || catLower.includes('peace')) {
        return 'Happiness & Joy';
    }
    if (catLower.includes('love') || catLower.includes('affection') || catLower.includes('compassion') || catLower.includes('respect')) {
        return 'Love & Affection';
    }
    if (catLower.includes('shame') || catLower.includes('embarrassment') || catLower.includes('guilt') || catLower.includes('remorse')) {
        return 'Shame, Guilt & Embarrassment';
    }
    if (catLower.includes('disgust') || catLower.includes('contempt') || catLower.includes('disdain') || catLower.includes('aversion')) {
        return 'Disgust & Contempt';
    }
    if (catLower.includes('hope') || catLower.includes('anticipation') || catLower.includes('optimism')) {
        return 'Hope & Anticipation';
    }
    if (catLower.includes('surprise') || catLower.includes('wonder') || catLower.includes('awe') || catLower.includes('astonish')) {
        return 'Surprise & Wonder';
    }
    if (catLower.includes('emotion') || catLower.includes('feeling') || catLower.includes('wellness') || catLower.includes('coping') || catLower.includes('mental_state') || catLower.includes('mental state')) {
        return 'Emotions, Feelings & Wellness';
    }
    
    // Academic & School
    if (catLower.includes('academic') || catLower.includes('school') || catLower.includes('classroom') || catLower.includes('exam') || catLower.includes('education') || catLower.includes('study') || catLower.includes('pedagogical') || catLower.includes('learning')) {
        return 'Academic Vocabulary & Education';
    }
    
    // Argument & Debate
    if (catLower.includes('argument') || catLower.includes('debate') || catLower.includes('discuss') || catLower.includes('arguing')) {
        return 'Argument, Debate & Discussion';
    }
    
    // Philosophy & Logic
    if (catLower.includes('philosoph') || catLower.includes('logic') || catLower.includes('reasoning') || catLower.includes('deduction') || catLower.includes('inference') || catLower.includes('metacognition') || catLower.includes('critical thinking') || catLower.includes('premise') || catLower.includes('proposition') || catLower.includes('cognit') || catLower.includes('think') || catLower.includes('analyz') || catLower.includes('examin') || catLower.includes('comprehens') || catLower.includes('bias') || catLower.includes('fallac')) {
        return 'Philosophy, Logic & Thinking Skills';
    }
    
    // Household & Chores
    if (catLower.includes('bedroom') || catLower.includes('belonging') || catLower.includes('home') || catLower.includes('furniture') || catLower.includes('utensil') || catLower.includes('kitchen') || catLower.includes('dining') || catLower.includes('cleaning') || catLower.includes('supplies') || catLower.includes('chore') || catLower.includes('house')) {
        return 'Household & Daily Chores';
    }
    
    // Food & Taste
    if (catLower.includes('food') || catLower.includes('condiment') || catLower.includes('grocery') || catLower.includes('grain') || catLower.includes('lentil') || catLower.includes('oil') || catLower.includes('spicy') || catLower.includes('savory') || catLower.includes('sweet') || catLower.includes('sour') || catLower.includes('bitter') || catLower.includes('taste') || catLower.includes('cook') || catLower.includes('meal') || catLower.includes('dish') || catLower.includes('groceries') || catLower.includes('spice') || catLower.includes('herb')) {
        return 'Food, Groceries & Taste Descriptors';
    }
    
    // Clothing & Fashion
    if (catLower.includes('clothing') || catLower.includes('fashion') || catLower.includes('bag') || catLower.includes('accessory') || catLower.includes('wear')) {
        return 'Clothing, Fashion & Accessories';
    }
    
    // Travel & Direction
    if (catLower.includes('travel') || catLower.includes('direction') || catLower.includes('position') || catLower.includes('location') || catLower.includes('commuting') || catLower.includes('transport') || catLower.includes('road') || catLower.includes('air_travel') || catLower.includes('public_transport') || catLower.includes('map') || catLower.includes('coordinate') || catLower.includes('accommodation') || catLower.includes('route') || catLower.includes('street')) {
        return 'Travel, Transport & Directions';
    }
    
    // Numbers, Time & Seasons
    if (catLower.includes('number') || catLower.includes('time') || catLower.includes('date') || catLower.includes('measure') || catLower.includes('calendar') || catLower.includes('season') || catLower.includes('time_period') || catLower.includes('time period') || catLower.includes('clock')) {
        return 'Numbers, Time, Measures & Seasons';
    }
    
    // Nature & Environment
    if (catLower.includes('weather') || catLower.includes('climate') || catLower.includes('nature') || catLower.includes('ecosystem') || catLower.includes('biodiversity') || catLower.includes('environment') || catLower.includes('pollution') || catLower.includes('disaster') || catLower.includes('conservation') || catLower.includes('forest') || catLower.includes('eco-friendly')) {
        return 'Nature, Weather & Environment';
    }
    
    // Tech & AI
    if (catLower.includes('software') || catLower.includes('hardware') || catLower.includes('computer') || catLower.includes('computing') || catLower.includes('tech') || catLower.includes('machine learning') || catLower.includes('prompt engineering') || catLower.includes('robotics') || catLower.includes('cybersecurity') || catLower.includes('internet') || catLower.includes('web browsing') || catLower.includes('messaging') || catLower.includes('chat') || catLower.includes('data file') || catLower.includes('system operation') || catLower.includes('ui ux') || catLower.includes('ml terms') || catLower.includes('prompt')) {
        return 'Technology, Computers & AI';
    }
    
    // Greetings & Social
    if (catLower.includes('greetings') || catLower.includes('partings') || catLower.includes('social replies') || catLower.includes('social manners') || catLower.includes('polite expression') || catLower.includes('polite phrasing') || catLower.includes('softener') || catLower.includes('hedging') || catLower.includes('casual opener') || catLower.includes('casual_opener') || catLower.includes('greetings farewells') || catLower.includes('polite') || catLower.includes('introduction')) {
        return 'Greetings, Social Manners & Polite English';
    }
    
    // Grammar
    if (catLower === 'noun' || catLower === 'verb' || catLower === 'adjective' || catLower === 'adverb' || catLower === 'pronoun' || catLower.includes('part-of-speech') || catLower.includes('grammar')) {
        return 'Grammar & Parts of Speech';
    }
    
    // Clean up typical spelling variants
    if (catLower === 'geometry/shapes' || catLower === 'geometryshapes' || catLower === 'geometry shapes') return 'Geometry & Shapes';
    if (catLower === 'arithmetic/operations' || catLower === 'arithmeticoperations' || catLower === 'arithmetic operations') return 'Arithmetic & Operations';
    if (catLower === 'algebra/calculations' || catLower === 'algebracalculations' || catLower === 'algebra calculations') return 'Algebra & Calculations';
    if (catLower === 'forces/motion' || catLower === 'forcesmotion' || catLower === 'forces motion') return 'Forces & Motion';
    if (catLower === 'energy/electricity' || catLower === 'energyelectricity' || catLower === 'energy electricity') return 'Energy & Electricity';
    if (catLower === 'space/astronomy' || catLower === 'spaceastronomy' || catLower === 'space astronomy') return 'Space & Astronomy';
    if (catLower === 'courtroom & trials' || catLower === 'courtroom_trials') return 'Courtroom & Trials';
    if (catLower === 'e commerce' || catLower === 'e-commerce') return 'E-Commerce';
    if (catLower === 'banking & accounts' || catLower === 'banking_accounts') return 'Banking & Accounts';
    
    return cat;
}

// Clean Sub-Category name from original filenames/slugs
function getCleanSubCategory(rawCat) {
    if (!rawCat) return 'General';
    let sub = rawCat.replace(/___/g, ' ').replace(/__/g, ' ').replace(/_/g, ' ').trim();
    sub = sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    if (rawCat.startsWith('alternative_to_')) {
        let cleanAlt = rawCat.replace('alternative_to_', '').replace(/_/g, ' ').trim();
        cleanAlt = cleanAlt.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `Alternative To: ${cleanAlt}`;
    }
    if (rawCat.startsWith('discourse_marker_')) {
        let cleanDis = rawCat.replace('discourse_marker_', '').replace(/_/g, ' ').trim();
        cleanDis = cleanDis.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `Discourse Marker: ${cleanDis}`;
    }
    if (rawCat.startsWith('linking_word_')) {
        let cleanLink = rawCat.replace('linking_word_', '').replace(/_/g, ' ').trim();
        cleanLink = cleanLink.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `Linking Word: ${cleanLink}`;
    }
    if (rawCat.startsWith('transition_')) {
        let cleanTrans = rawCat.replace('transition_', '').replace(/_/g, ' ').trim();
        cleanTrans = cleanTrans.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return `Transition: ${cleanTrans}`;
    }
    
    return sub;
}

// 3. Scan ALL backup original micro-category files to preserve maximum detail
try {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    console.log(`Scanning ${files.length} original category JSON files from backup...`);
    
    const aggregatedWords = new Map(); // wordKey -> Set of item data
    
    files.forEach(file => {
        const filePath = path.join(backupDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        
        let data;
        try {
            data = JSON.parse(content);
        } catch(err) {
            return; // Ignore parsing errors
        }
        
        const fileCat = file.replace('.json', '');
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && (item.word || item.w)) {
                    const rawWord = (item.word || item.w || '').trim();
                    if (!rawWord) return;
                    const keyWord = rawWord.toLowerCase();
                    
                    // Normalize Category and preserve subcategory
                    const originalCat = item.category || fileCat;
                    const consolidatedCat = getConsolidatedCategory(originalCat);
                    const subCategory = getCleanSubCategory(originalCat);
                    
                    let meaning = String(item.hindi_meaning || item.meaning_hi || item.m || item.hindi || item.meaning || '');
                    let pronunciation = String(item.pronunciation_help || item.p || item.pronunciation || '');
                    let definition = String(item.simple_explanation || item.definition || '');
                    let example = String(item.usageExample || item.example || item.e || '');
                    
                    // Lookup in v7 dictionary to enrich
                    if (masterDict.has(keyWord)) {
                        const rich = masterDict.get(keyWord);
                        if (!meaning || meaning.includes('?')) meaning = String(rich.hindi_meaning || meaning || '');
                        if (!pronunciation) pronunciation = String(rich.pronunciation_help || pronunciation || '');
                        if (!definition) definition = String(rich.simple_explanation || rich.definition || definition || '');
                    }
                    
                    const wordEntry = {
                        word: rawWord,
                        meaning: meaning,
                        pronunciation: pronunciation,
                        definition: definition,
                        example: example,
                        category: consolidatedCat,
                        subCategory: subCategory
                    };
                    
                    if (!aggregatedWords.has(keyWord)) {
                        aggregatedWords.set(keyWord, []);
                    }
                    aggregatedWords.get(keyWord).push(wordEntry);
                }
            });
        }
    });
    
    console.log(`Aggregated ${aggregatedWords.size} unique words from backups.`);
    
    // 4. Group unique words into their best matching consolidated category
    const categoryGroups = new Map(); // CategoryName -> Map(wordKey -> bestEntry)
    
    aggregatedWords.forEach((entries, keyWord) => {
        // Find best resolved category (prefer specific categories over general or Uncategorized)
        let resolvedCategory = 'Uncategorized';
        for (const e of entries) {
            if (e.category && e.category !== 'Uncategorized' && e.category !== 'General English Vocabulary' && e.category !== 'General') {
                resolvedCategory = e.category;
                break;
            }
        }
        if (resolvedCategory === 'Uncategorized') {
            for (const e of entries) {
                if (e.category && e.category !== 'Uncategorized') {
                    resolvedCategory = e.category;
                    break;
                }
            }
        }
        if (resolvedCategory === 'Uncategorized') {
            resolvedCategory = entries[0].category || 'Uncategorized';
        }

        let bestEntry = entries[0];
        entries.forEach(e => {
            let score = 0;
            if (e.meaning && typeof e.meaning === 'string' && !e.meaning.includes('?')) score += 3;
            if (e.pronunciation) score += 2;
            if (e.definition) score += 1;
            if (e.example) score += 1;
            
            let bestScore = 0;
            if (bestEntry.meaning && typeof bestEntry.meaning === 'string' && !bestEntry.meaning.includes('?')) bestScore += 3;
            if (bestEntry.pronunciation) bestScore += 2;
            if (bestEntry.definition) bestScore += 1;
            if (bestEntry.example) bestScore += 1;
            
            if (score > bestScore) {
                bestEntry = e;
            }
        });
        
        // Apply resolved category to the best entry data
        const finalizedEntry = {
            ...bestEntry,
            category: resolvedCategory
        };
        
        if (!categoryGroups.has(resolvedCategory)) {
            categoryGroups.set(resolvedCategory, new Map());
        }
        categoryGroups.get(resolvedCategory).set(keyWord, finalizedEntry);
    });
    
    console.log(`Grouped into ${categoryGroups.size} consolidated categories.`);
    
    // 5. Broad Consolidator for Categories with < 15 words to maintain balanced sizing
    function getBroaderCategory(catName) {
        const lower = catName.toLowerCase();
        
        if (lower.includes('emotion') || lower.includes('feeling') || lower.includes('wellness') || lower.includes('anger') || lower.includes('sadness') || lower.includes('fear') || lower.includes('happiness') || lower.includes('love') || lower.includes('shame') || lower.includes('disgust') || lower.includes('hope') || lower.includes('surprise') || lower.includes('gratitude') || lower.includes('insecurity') || lower.includes('pride') || lower.includes('boredom') || lower.includes('compassion') || lower.includes('awe') || lower.includes('irritability') || lower.includes('jealousy') || lower.includes('anxiety') || lower.includes('grief') || lower.includes('contempt') || lower.includes('guilt') || lower.includes('embarrassment')) {
            return 'Emotions, Feelings & Wellness';
        }
        
        if (lower.includes('language') || lower.includes('linguistic') || lower.includes('rhetoric') || lower.includes('writing') || lower.includes('communication') || lower.includes('speech') || lower.includes('phonetic') || lower.includes('syntactic') || lower.includes('pragmatic') || lower.includes('literary') || lower.includes('dialogue') || lower.includes('concluding') || lower.includes('aside') || lower.includes('clarification') || lower.includes('emphasis') || lower.includes('closing') || lower.includes('intro') || lower.includes('opening') || lower.includes('greet') || lower.includes('polite') || lower.includes('social') || lower.includes('manner') || lower.includes('expression')) {
            return 'Greetings, Social Manners & Polite English';
        }
        
        if (lower.includes('academic') || lower.includes('school') || lower.includes('education') || lower.includes('study') || lower.includes('learning') || lower.includes('pedagogic') || lower.includes('science') || lower.includes('philosoph') || lower.includes('logic') || lower.includes('reasoning') || lower.includes('thinking') || lower.includes('deduction') || lower.includes('inference') || lower.includes('metacognit') || lower.includes('bias') || lower.includes('fallac') || lower.includes('cognitive') || lower.includes('comprehens') || lower.includes('research') || lower.includes('synthesis') || lower.includes('intelligence') || lower.includes('ideas') || lower.includes('priority')) {
            return 'Academic Vocabulary & Education';
        }
        
        if (lower.includes('business') || lower.includes('work') || lower.includes('finance') || lower.includes('accounting') || lower.includes('commerce') || lower.includes('banking') || lower.includes('corporate') || lower.includes('office') || lower.includes('stationery') || lower.includes('presentation') || lower.includes('meeting') || lower.includes('negotiat') || lower.includes('market') || lower.includes('sale') || lower.includes('retail') || lower.includes('shopping') || lower.includes('gig') || lower.includes('automation') || lower.includes('collab') || lower.includes('administration') || lower.includes('accountability') || lower.includes('inclusivity') || lower.includes('equity') || lower.includes('dei') || lower.includes('dynamics') || lower.includes('leadership') || lower.includes('management') || lower.includes('networking') || lower.includes('delegation') || lower.includes('upskilling') || lower.includes('feedback') || lower.includes('working') || lower.includes('hybrid') || lower.includes('remote') || lower.includes('job') || lower.includes('career')) {
            return 'Business, Finance & Workplace English';
        }
        
        if (lower.includes('travel') || lower.includes('transport') || lower.includes('direction') || lower.includes('commuting') || lower.includes('road') || lower.includes('route') || lower.includes('street') || lower.includes('map') || lower.includes('coordinate') || lower.includes('geography') || lower.includes('accommodat') || lower.includes('location') || lower.includes('destination') || lower.includes('sightseeing')) {
            return 'Travel, Transport & Directions';
        }
        
        if (lower.includes('food') || lower.includes('grocery') || lower.includes('groceries') || lower.includes('taste') || lower.includes('spices') || lower.includes('herb') || lower.includes('grain') || lower.includes('lentil') || lower.includes('oil') || lower.includes('cooking') || lower.includes('meal') || lower.includes('beverage') || lower.includes('condiment') || lower.includes('dish') || lower.includes('kitchen') || lower.includes('dining')) {
            return 'Food, Groceries & Taste Descriptors';
        }
        
        if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('accessory') || lower.includes('bag') || lower.includes('keys') || lower.includes('belonging') || lower.includes('personal care') || lower.includes('hygiene') || lower.includes('body')) {
            return 'Clothing, Fashion & Accessories';
        }
        
        if (lower.includes('house') || lower.includes('home') || lower.includes('bedroom') || lower.includes('living') || lower.includes('furniture') || lower.includes('appliance') || lower.includes('cleaning') || lower.includes('supplies') || lower.includes('chore') || lower.includes('utensil') || lower.includes('gadget') || lower.includes('keys')) {
            return 'Household & Daily Chores';
        }
        
        if (lower.includes('leisure') || lower.includes('hobby') || lower.includes('sport') || lower.includes('game') || lower.includes('athletics') || lower.includes('theater') || lower.includes('dance') || lower.includes('art') || lower.includes('music') || lower.includes('cinema') || lower.includes('film') || lower.includes('news') || lower.includes('show') || lower.includes('broadcasting') || lower.includes('performance') || lower.includes('gaming')) {
            return 'Leisure, Hobbies & Sports';
        }
        
        if (lower.includes('tech') || lower.includes('computer') || lower.includes('software') || lower.includes('hardware') || lower.includes('ai') || lower.includes('machine learning') || lower.includes('prompt') || lower.includes('robot') || lower.includes('cyber') || lower.includes('internet') || lower.includes('web') || lower.includes('data') || lower.includes('digital') || lower.includes('coding') || lower.includes('network') || lower.includes('automation')) {
            return 'Technology, Computers & AI';
        }
        
        if (lower.includes('grammar') || lower.includes('parts of speech') || lower.includes('collocation') || lower.includes('phrase') || lower.includes('noun') || lower.includes('verb') || lower.includes('adject') || lower.includes('adverb') || lower.includes('pronoun') || lower.includes('word pair')) {
            return 'Grammar & Parts of Speech';
        }
        
        return 'General English Vocabulary';
    }

    let hasChanges = true;
    let iteration = 0;
    while (hasChanges && iteration < 5) {
        hasChanges = false;
        iteration++;
        const catsToReassign = [];
        
        categoryGroups.forEach((wordMap, catName) => {
            if (catName !== 'Uncategorized' && wordMap.size < 15) {
                catsToReassign.push({ name: catName, words: Array.from(wordMap.values()) });
            }
        });
        
        if (catsToReassign.length > 0) {
            hasChanges = true;
            catsToReassign.forEach(catInfo => {
                let broaderCat = getBroaderCategory(catInfo.name);
                // Prevent self-reassignment deletion bugs
                if (broaderCat === catInfo.name) {
                    broaderCat = 'General English Vocabulary';
                }
                
                if (!categoryGroups.has(broaderCat)) {
                    categoryGroups.set(broaderCat, new Map());
                }
                
                const targetMap = categoryGroups.get(broaderCat);
                catInfo.words.forEach(w => {
                    w.category = broaderCat;
                    targetMap.set(w.word.toLowerCase(), w);
                });
                
                categoryGroups.delete(catInfo.name);
            });
        }
    }
    
    console.log(`Consolidated further into ${categoryGroups.size} balanced categories.`);

    // 6. Delete old consolidated files in website/data/vocabulary/categories/
    const oldFiles = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.json'));
    oldFiles.forEach(file => {
        try {
            fs.unlinkSync(path.join(categoriesDir, file));
        } catch(e) {}
    });

    // 7. Write out new consolidated category JSON files with preserved subcategories
    const newCategoriesIndex = [];
    
    const catIcons = {
        'Positive Emotions': '❤',
        'Abstract Emotional Vocabulary': '❤',
        'Weak Professional Vocabulary': '💼',
        'Formal Educational Vocabulary': '🎩',
        'Exam & Classroom': '📚',
        'Animals & Insects': '🐾',
        'Birds & Bird Sounds': '🐦',
        'Beverages (Hot & Cold)': '☕',
        'Health, Diseases & Symptoms': '⚕',
        'Grammar & Parts of Speech': '📝',
        'Slang & Modern Expressions': '💬',
        'Discourse Markers': '🗣',
        'Linking Words & Connectors': '🔗',
        'Transitions & Connectives': '🔄',
        'Collocations & Phrases': '🤝',
        'E-Commerce': '🛒',
        'Banking & Accounts': '💰',
        'Geometry & Shapes': '🔶',
        'Arithmetic & Operations': '➕',
        'Algebra & Calculations': '📊',
        'Forces & Motion': '⚙',
        'Energy & Electricity': '⚡',
        'Space & Astronomy': '🚀',
        'Technology, Computers & AI': '💻',
        'Greetings, Social Manners & Polite English': '🤝',
        'Food, Groceries & Taste Descriptors': '🍎',
        'Emotions, Feelings & Wellness': '😊',
        'Academic Vocabulary & Education': '🎓',
        'Argument, Debate & Discussion': '🗣',
        'Philosophy, Logic & Thinking Skills': '🧠',
        'Household & Daily Chores': '🏠',
        'Clothing, Fashion & Accessories': '👕',
        'Travel, Transport & Directions': '✈',
        'Numbers, Time, Measures & Seasons': '⏰',
        'Nature, Weather & Environment': '🌳',
        'Leisure, Hobbies & Sports': '⚽',
        'General English Vocabulary': '📚',
        'Business, Finance & Workplace English': '💼'
    };
    
    categoryGroups.forEach((wordMap, catName) => {
        if (!catName || catName === 'Uncategorized') return;
        
        const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        const wordsArray = Array.from(wordMap.values()).sort((a,b) => a.word.localeCompare(b.word));
        
        // Write consolidated category JSON file
        const catFilePath = path.join(categoriesDir, `${slug}.json`);
        fs.writeFileSync(catFilePath, JSON.stringify(wordsArray, null, 2), 'utf8');
        
        // Add to index list
        newCategoriesIndex.push({
            name: catName,
            slug: slug,
            count: wordsArray.length,
            icon: catIcons[catName] || '📚'
        });
        
        console.log(`Created Consolidated Category File: ${slug}.json with ${wordsArray.length} words (subcategories preserved).`);
    });
    
    // Sort index by name
    newCategoriesIndex.sort((a,b) => a.name.localeCompare(b.name));
    
    // Write new categories index
    fs.writeFileSync(indexFilePath, JSON.stringify(newCategoriesIndex, null, 4), 'utf8');
    console.log(`Successfully regenerated categories-index.json with ${newCategoriesIndex.length} clean categories!`);
    
} catch (e) {
    console.error('Error during consolidation:', e);
}
