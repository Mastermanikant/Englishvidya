const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '..', '..', 'archive', 'duplicate_vocabulary_backups');
const v7Path = path.join(__dirname, '..', '..', 'website', 'data', 'grammar', 'master_dictionary_FINAL_v7.json');

// Mock getConsolidatedCategory from consolidate_categories.js
function getConsolidatedCategory(rawCat) {
    if (!rawCat) return 'Uncategorized';
    let cat = rawCat.replace(/___/g, ' ').replace(/__/g, ' ').replace(/_/g, ' ').trim();
    cat = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const catLower = cat.toLowerCase();
    if (catLower === 'geometry/shapes' || catLower === 'geometryshapes' || catLower === 'geometry shapes') return 'Geometry & Shapes';
    if (catLower === 'arithmetic/operations' || catLower === 'arithmeticoperations' || catLower === 'arithmetic operations') return 'Arithmetic & Operations';
    if (catLower === 'algebra/calculations' || catLower === 'algebracalculations' || catLower === 'algebra calculations') return 'Algebra & Calculations';
    return cat;
}

try {
    const file = 'algebracalculations.json';
    const filePath = path.join(backupDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    
    console.log('--- Tracing algebracalculations.json ---');
    data.forEach(item => {
        const word = (item.word || item.w || '').trim();
        if (word === 'algebra' || word === 'formula' || word === 'coefficient') {
            console.log(`Word: ${word}`);
            console.log(`  Raw Category: ${item.category}`);
            console.log(`  Consolidated Category: ${getConsolidatedCategory(item.category || 'algebracalculations')}`);
            console.log(`  meaning_hi: ${item.hindi_meaning || item.meaning_hi || item.m || item.hindi || item.meaning || ''}`);
        }
    });
} catch (e) {
    console.error(e);
}
