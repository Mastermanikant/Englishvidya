const fs = require('fs');
const path = require('path');

const pyPath = 'D:\\English Vidya\\scratch\\generate_sports_vocabulary.py';
const jsonPath = 'D:\\English Vidya\\website\\data\\grammar\\dictionary_batches\\v5_sports_athletics.json';

const pyContent = fs.readFileSync(pyPath, 'utf8');

// Find the start of the vocabulary array
const startIndex = pyContent.indexOf('vocabulary = [');
if (startIndex === -1) {
  console.error("Could not find 'vocabulary = [' in the python file.");
  process.exit(1);
}

// We want to extract from the '[' to the corresponding ']' at the end of the array definition.
// The array starts at startIndex + 'vocabulary = '.length
const arrayStart = startIndex + 'vocabulary = '.length; // This is the '['
// Let's find the closing ']' before the '# Write to file' or similar.
// Since the array is the main thing, we can find the last ']' before 'target_file = '
const targetFileIndex = pyContent.indexOf('target_file =');
if (targetFileIndex === -1) {
  console.error("Could not find 'target_file =' in the python file.");
  process.exit(1);
}

const arrayEnd = pyContent.lastIndexOf(']', targetFileIndex) + 1;

const arrayText = pyContent.substring(arrayStart, arrayEnd);

// Now we evaluate it by creating a temporary function or just writing a temp JS file and requiring it.
// Let's write it to a temp js file:
const tempJsPath = 'D:\\English Vidya\\scratch\\temp_vocab.js';
fs.writeFileSync(tempJsPath, 'module.exports = ' + arrayText + ';', 'utf8');

try {
  const vocabulary = require(tempJsPath);
  console.log(`Loaded ${vocabulary.length} entries successfully.`);
  
  // Write to destination
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(vocabulary, null, 2), 'utf8');
  console.log(`Successfully wrote JSON to ${jsonPath}`);
} catch (e) {
  console.error("Failed to load or write vocabulary:", e);
} finally {
  // Clean up
  try {
    fs.unlinkSync(tempJsPath);
  } catch (_) {}
}
