const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const DATA_DIR = 'd:/EnglishVidya Website/Englishvidya/website/data/vocabulary/categories/';

async function transliterate(text) {
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
    const res = await fetch(url);
    const data = await res.json();
    return data[1][0][1][0];
  } catch (e) {
    return text;
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithRetry(text, options, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await translate(text, options);
    } catch (e) {
      if (i === retries - 1) throw e;
      const waitTime = 5000 * Math.pow(2, i);
      console.log(`Rate limit hit. Waiting ${waitTime/1000}s before retry ${i+1}...`);
      await delay(waitTime);
    }
  }
}

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  let changed = false;

  const toTranslateMeaning = [];
  const toTranslateExample = [];
  const toTransliterate = [];

  for (const item of data) {
    if (!item.meaning && !item.meaning_hi && !item.hindi) {
      toTranslateMeaning.push(item);
    }
    if (!item.pronunciation && !item.p) {
      toTransliterate.push(item);
    }
    if (item.example && !item.exampleHindi) {
      toTranslateExample.push(item);
    }
  }

  if (toTranslateMeaning.length === 0 && toTransliterate.length === 0 && toTranslateExample.length === 0) {
    return false; // Nothing to do
  }

  console.log(`Processing ${path.basename(filePath)}...`);

  // 1. Translate meanings in chunks of 10
  for (let i = 0; i < toTranslateMeaning.length; i += 10) {
    const chunk = toTranslateMeaning.slice(i, i + 10);
    const textToTranslate = chunk.map(item => item.definition || item.word).join('\n|||\n');
    try {
      const res = await translateWithRetry(textToTranslate, { to: 'hi' });
      const translations = res.text.split('|||').map(s => s.trim());
      chunk.forEach((item, idx) => {
        item.meaning = translations[idx] || '';
      });
      changed = true;
    } catch (err) {
      console.error(`Error translating meaning in ${path.basename(filePath)}:`, err.message);
    }
    await delay(5000);
  }

  // 2. Translate examples in chunks of 10
  for (let i = 0; i < toTranslateExample.length; i += 10) {
    const chunk = toTranslateExample.slice(i, i + 10);
    const textToTranslate = chunk.map(item => item.example).join('\n|||\n');
    try {
      const res = await translateWithRetry(textToTranslate, { to: 'hi' });
      const translations = res.text.split('|||').map(s => s.trim());
      chunk.forEach((item, idx) => {
        item.exampleHindi = translations[idx] || '';
      });
      changed = true;
    } catch (err) {
      console.error(`Error translating example in ${path.basename(filePath)}:`, err.message);
    }
    await delay(5000);
  }

  // 3. Transliterate pronunciation
  for (const item of toTransliterate) {
    try {
      const parts = item.word.split(' ');
      const transliteratedParts = [];
      for (const p of parts) {
        const clean = p.replace(/[^a-zA-Z]/g, '');
        if (clean) {
          const t = await transliterate(clean);
          transliteratedParts.push(p.replace(clean, t));
        } else {
          transliteratedParts.push(p);
        }
      }
      item.pronunciation = transliteratedParts.join(' ');
      changed = true;
      await delay(100);
    } catch (err) {
      console.error(`Error transliterating ${item.word}:`, err.message);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

async function main() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  let processed = 0;
  for (const file of files) {
    if (processed >= 1) {
      console.log('\n========================================================');
      console.log('Processed 1 category successfully.');
      console.log('Please check your GitHub Desktop / Website to verify the changes.');
      console.log('Run this script again when you are ready for the next category.');
      console.log('========================================================\n');
      break;
    }
    const wasUpdated = await processFile(path.join(DATA_DIR, file));
    if (wasUpdated) {
      processed++;
      console.log('Taking a 5-second break before the next category...\n');
      await delay(5000);
    }
  }
}

main().catch(console.error);
