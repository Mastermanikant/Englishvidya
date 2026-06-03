/**
 * full_fix_final.js
 * 
 * Complete fix pipeline for English Vidya vocabulary data:
 * 1. Read clean Mojibake from D:\EnglishVidya\Englishvidya (source of truth)
 * 2. Decode all Hindi via CP1252 reverse-map -> UTF-8
 * 3. Save fixed master dictionary to website/data/grammar/
 * 4. Enrich ALL category JSON files (fixing both hindi_meaning + meaning_hi fields)
 * 5. Rebuild search-index.json
 */

const fs   = require('fs');
const path = require('path');

const CLEAN_SOURCE   = 'D:\\EnglishVidya\\Englishvidya\\data\\grammar\\master_dictionary_FINAL_v6.json';
const DEST_MASTER    = 'D:\\English Vidya\\website\\data\\grammar\\master_dictionary_FINAL_v6.json';
const CATEGORIES_DIR = 'D:\\English Vidya\\website\\data\\vocabulary\\categories';
const SEARCH_INDEX   = 'D:\\English Vidya\\website\\data\\site\\search-index.json';

// ─── CP1252 Mojibake Decoder ─────────────────────────────────────────────────
const CP1252 = {
  0x20AC:0x80, 0x201A:0x82, 0x0192:0x83, 0x201E:0x84, 0x2026:0x85,
  0x2020:0x86, 0x2021:0x87, 0x02C6:0x88, 0x2030:0x89, 0x0160:0x8A,
  0x2039:0x8B, 0x0152:0x8C, 0x017D:0x8E, 0x2018:0x91, 0x2019:0x92,
  0x201C:0x93, 0x201D:0x94, 0x2022:0x95, 0x2013:0x96, 0x2014:0x97,
  0x02DC:0x98, 0x2122:0x99, 0x0161:0x9A, 0x203A:0x9B, 0x0153:0x9C,
  0x017E:0x9E, 0x0178:0x9F,
};

function fixMojibake(str) {
  if (!str || typeof str !== 'string') return str;
  // Only process if it looks like Mojibake (Latin Extended + CP1252 specials)
  if (!/[\u00C0-\u00FF\u2013-\u2039\u2018-\u201D\u20AC\u2122]/.test(str)) return str;
  try {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      bytes.push(CP1252[c] !== undefined ? CP1252[c] : (c <= 0xFF ? c : 0x3F));
    }
    const decoded = Buffer.from(bytes).toString('utf8');
    // Accept if result has Devanagari OR is similar length to input (not garbage)
    if (/[\u0900-\u097F]/.test(decoded)) return decoded;
    return str;
  } catch(e) { return str; }
}

function isValidHindi(str) {
  if (!str) return false;
  return /[\u0900-\u097F]/.test(str) && !str.includes('\uFFFD') && !/\?\?\?\?/.test(str);
}

// ─── STEP 1: Load & decode clean source master dictionary ────────────────────
console.log('═══════════════════════════════════════════════');
console.log(' English Vidya — Full Hindi Fix Pipeline');
console.log('═══════════════════════════════════════════════\n');

console.log('📖 [1/5] Loading clean source master dictionary...');
let raw = fs.readFileSync(CLEAN_SOURCE, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const sourceData = JSON.parse(raw);
console.log(`     ${sourceData.length} total entries in source.`);

console.log('🔧 [2/5] Decoding CP1252 Mojibake in all fields...');
const masterFixed = [];
const wordMap = new Map();  // lowercase word → { hindi_meaning, pronunciation_help }
let decodedFieldCount = 0;

for (const entry of sourceData) {
  const word = (entry.word || '').trim();
  if (!word) continue;

  const fixed = { ...entry };

  // Fields that may contain Hindi Mojibake
  const hindiFields = [
    'hindi_meaning', 'pronunciation_help', 'hindi_confusion_correction',
    'meaning_hi', 'pronunciation_hi'
  ];
  for (const field of hindiFields) {
    if (fixed[field] && typeof fixed[field] === 'string') {
      const dec = fixMojibake(fixed[field]);
      if (dec !== fixed[field]) { fixed[field] = dec; decodedFieldCount++; }
    }
  }

  masterFixed.push(fixed);

  // Build lookup — prefer hindi_meaning, fallback to meaning_hi
  wordMap.set(word.toLowerCase(), {
    hindi_meaning:    fixed.hindi_meaning    || fixed.meaning_hi    || '',
    pronunciation_help: fixed.pronunciation_help || fixed.pronunciation_hi || '',
  });
}

console.log(`     ✅ Decoded ${decodedFieldCount} fields across ${masterFixed.length} entries.`);
console.log(`     ✅ Lookup map has ${wordMap.size} unique words.`);

// ─── STEP 2: Save fixed master dictionary ────────────────────────────────────
console.log('\n💾 [3/5] Saving fixed master dictionary...');
fs.writeFileSync(DEST_MASTER, JSON.stringify(masterFixed, null, 2), 'utf8');
console.log(`     ✅ Saved to: ${DEST_MASTER}`);

// ─── STEP 3: Enrich all category JSON files ──────────────────────────────────
console.log('\n📂 [4/5] Enriching category files...');
const catFiles = fs.readdirSync(CATEGORIES_DIR).filter(f => f.endsWith('.json'));
console.log(`     Found ${catFiles.length} category files.`);

let catUpdated = 0, catUnchanged = 0, catErrored = 0;
let wordsFixed = 0, wordsAdded = 0;

for (const file of catFiles) {
  const fp = path.join(CATEGORIES_DIR, file);
  let content;
  try {
    let catRaw = fs.readFileSync(fp, 'utf8');
    if (catRaw.charCodeAt(0) === 0xFEFF) catRaw = catRaw.slice(1);
    content = JSON.parse(catRaw);
  } catch(e) {
    catErrored++;
    continue;
  }

  const isArray = Array.isArray(content);
  const entries = isArray ? content : [content];
  let modified = false;

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const word = (entry.word || '').trim().toLowerCase();
    const lookup = wordMap.get(word);

    // Fix existing Mojibake in category file's own fields
    const fields = ['hindi_meaning', 'meaning_hi', 'pronunciation_help', 'pronunciation_hi',
                    'hindi_confusion_correction'];
    for (const field of fields) {
      if (entry[field] && typeof entry[field] === 'string') {
        const dec = fixMojibake(entry[field]);
        if (dec !== entry[field]) {
          entry[field] = dec;
          modified = true;
          wordsFixed++;
        }
        // Also clear out garbage "?????" values
        if (/^\?+$/.test(entry[field]) || entry[field] === '') {
          entry[field] = '';
        }
      }
    }

    // Fill in from master dictionary if still missing or invalid
    if (lookup) {
      // Fix hindi_meaning
      if (!isValidHindi(entry.hindi_meaning) && lookup.hindi_meaning) {
        entry.hindi_meaning = lookup.hindi_meaning;
        modified = true;
        wordsAdded++;
      }
      // Fix/add meaning_hi (alias)
      if (!isValidHindi(entry.meaning_hi) && lookup.hindi_meaning) {
        entry.meaning_hi = lookup.hindi_meaning;
        modified = true;
      }
      // Fix pronunciation_help
      if (!entry.pronunciation_help && lookup.pronunciation_help) {
        entry.pronunciation_help = lookup.pronunciation_help;
        modified = true;
      }
    }
  }

  if (modified) {
    const out = isArray ? entries : entries[0];
    fs.writeFileSync(fp, JSON.stringify(out, null, 2), 'utf8');
    catUpdated++;
  } else {
    catUnchanged++;
  }

  // Progress indicator every 100 files
  if ((catUpdated + catUnchanged) % 200 === 0) {
    process.stdout.write(`     ... processed ${catUpdated + catUnchanged}/${catFiles.length}\n`);
  }
}

console.log(`     ✅ Updated:   ${catUpdated} files`);
console.log(`     ✅ Unchanged: ${catUnchanged} files`);
console.log(`     ✅ Words fixed (Mojibake): ${wordsFixed}`);
console.log(`     ✅ Words enriched (from master): ${wordsAdded}`);
if (catErrored > 0) console.log(`     ⚠️  Errors: ${catErrored} files`);

// ─── STEP 4: Rebuild Search Index ────────────────────────────────────────────
console.log('\n🔍 [5/5] Rebuilding search-index.json...');
const searchIndex = masterFixed
  .filter(e => e.word)
  .map(e => {
    const word = (e.word || '').trim();
    const hi   = e.hindi_meaning || e.meaning_hi || '';
    const m    = hi.length > 60 ? hi.slice(0, 60) + '…' : hi;
    const s    = word.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return { w: word, m, s };
  });

fs.writeFileSync(SEARCH_INDEX, JSON.stringify(searchIndex), 'utf8');
console.log(`     ✅ ${searchIndex.length} entries written.`);

// ─── Verification ─────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════');
console.log(' 🧪 Spot Verification');
console.log('════════════════════════════════');

// Check master dictionary
const testWords = ['go','come','walk','run','sit','happy','write','speak','understand','think',
                   'important','beautiful','learn','friend','money'];
let masterPass = 0;
for (const w of testWords) {
  const e = masterFixed.find(x => (x.word||'').toLowerCase() === w);
  if (!e) { console.log(`  ⚠️  "${w}": not in master`); continue; }
  const hi = e.hindi_meaning || '';
  const ok = isValidHindi(hi);
  if (ok) masterPass++;
  const preview = hi.slice(0, 30);
  console.log(`  ${ok ? '✅' : '❌'} "${w}": ${preview}`);
}

// Check search index
console.log('\n📋 Search index sample (first 5):');
for (const s of searchIndex.slice(0, 5)) {
  const ok = isValidHindi(s.m);
  console.log(`  ${ok ? '✅' : '❌'} ${s.w}: ${s.m}`);
}

// Check a category file
console.log('\n📁 Category file sample (academic.json):');
try {
  const cat = JSON.parse(fs.readFileSync(path.join(CATEGORIES_DIR, 'academic.json'), 'utf8'));
  const arr = Array.isArray(cat) ? cat : [cat];
  for (const e of arr.slice(0, 3)) {
    const hi = e.hindi_meaning || e.meaning_hi || '[none]';
    const ok = isValidHindi(hi);
    console.log(`  ${ok ? '✅' : '⚠️ '} "${e.word}": ${hi}`);
  }
} catch(e) { console.log('  Error reading academic.json'); }

console.log('\n════════════════════════════════');
console.log(` 🎉 Pipeline Complete!`);
console.log(`    Master:       ${masterFixed.length} words (${masterPass}/${testWords.length} spot checks ✅)`);
console.log(`    Categories:   ${catUpdated} files updated`);
console.log(`    Search index: ${searchIndex.length} entries`);
console.log('════════════════════════════════\n');
