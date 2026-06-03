const fs = require('fs');
const path = require('path');

const lessonsDir = 'd:/English Vidya/website/data/grammar/lessons';
const lessonsMap = {
  'nouns.json': 4,
  'pronouns.json': 5,
  'verbs.json': 6,
  'adjectives.json': 7,
  'adverbs.json': 8,
  'prepositions.json': 9,
  'conjunctions.json': 10,
  'interjections.json': 11,
  'tenses-present.json': 12,
  'tenses-past.json': 13,
  'tenses-future.json': 14,
  'articles.json': 15,
  'active-passive-voice.json': 16,
  'direct-indirect-speech.json': 17,
  'modal-verbs.json': 18
};

Object.entries(lessonsMap).forEach(([file, newPart]) => {
  const filePath = path.join(lessonsDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.part = newPart;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${file} to part ${newPart}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});
