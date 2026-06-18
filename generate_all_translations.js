const fs = require('fs');
const path = require('path');

const fruitsConfig = [
  { word: "Apple", slug: "apple", word_en: "apple", word_en_plural: "apples", word_hi: "सेब", word_hi_plural: "सेब", article: "an", gender: "M" },
  { word: "Apricot", slug: "apricot", word_en: "apricot", word_en_plural: "apricots", word_hi: "खुबानी", word_hi_plural: "खुबानी", article: "an", gender: "F" },
  { word: "Avocado", slug: "avocado", word_en: "avocado", word_en_plural: "avocados", word_hi: "एवोकाडो", word_hi_plural: "एवोकाडो", article: "an", gender: "M" },
  { word: "Banana", slug: "banana", word_en: "banana", word_en_plural: "bananas", word_hi: "केला", word_hi_plural: "केले", article: "a", gender: "M" },
  { word: "Blackberry", slug: "blackberry", word_en: "blackberry", word_en_plural: "blackberries", word_hi: "ब्लैकबेरी", word_hi_plural: "ब्लैकबेरी", article: "a", gender: "F" },
  { word: "Blueberry", slug: "blueberry", word_en: "blueberry", word_en_plural: "blueberries", word_hi: "ब्लूबेरी", word_hi_plural: "ब्लूबेरी", article: "a", gender: "F" },
  { word: "Boysenberry", slug: "boysenberry", word_en: "boysenberry", word_en_plural: "boysenberries", word_hi: "बॉयसेनबेरी", word_hi_plural: "बॉयसेनबेरी", article: "a", gender: "F" },
  { word: "Cantaloupe", slug: "cantaloupe", word_en: "cantaloupe", word_en_plural: "cantaloupes", word_hi: "खरबूजा", word_hi_plural: "खरबूजे", article: "a", gender: "M" },
  { word: "Cherry", slug: "cherry", word_en: "cherry", word_en_plural: "cherries", word_hi: "चेरी", word_hi_plural: "चेरी", article: "a", gender: "F" },
  { word: "Coconut", slug: "coconut", word_en: "coconut", word_en_plural: "coconuts", word_hi: "नारियल", word_hi_plural: "नारियल", article: "a", gender: "M" },
  { word: "Cranberry", slug: "cranberry", word_en: "cranberry", word_en_plural: "cranberries", word_hi: "क्रैनबेरी", word_hi_plural: "क्रैनबेरी", article: "a", gender: "F" },
  { word: "Custard Apple", slug: "custard-apple", word_en: "custard apple", word_en_plural: "custard apples", word_hi: "शरीफा", word_hi_plural: "शरीफे", article: "a", gender: "M" },
  { word: "Dates", slug: "dates", word_en: "date", word_en_plural: "dates", word_hi: "खजूर", word_hi_plural: "खजूर", article: "a", gender: "M" },
  { word: "Dragon Fruit", slug: "dragon-fruit", word_en: "dragon fruit", word_en_plural: "dragon fruits", word_hi: "ड्रैगन फ्रूट", word_hi_plural: "ड्रैगन फ्रूट", article: "a", gender: "M" },
  { word: "Durian", slug: "durian", word_en: "durian", word_en_plural: "durians", word_hi: "डूरियन", word_hi_plural: "डूरियन", article: "a", gender: "M" },
  { word: "Elderberry", slug: "elderberry", word_en: "elderberry", word_en_plural: "elderberries", word_hi: "एल्डरबेरी", word_hi_plural: "एल्डरबेरी", article: "an", gender: "F" },
  { word: "Fig", slug: "fig", word_en: "fig", word_en_plural: "figs", word_hi: "अंजीर", word_hi_plural: "अंजीर", article: "a", gender: "M" },
  { word: "Gooseberry", slug: "gooseberry", word_en: "gooseberry", word_en_plural: "gooseberries", word_hi: "आंवला", word_hi_plural: "आंवले", article: "a", gender: "M" },
  { word: "Grapefruit", slug: "grapefruit", word_en: "grapefruit", word_en_plural: "grapefruits", word_hi: "चकोतरा", word_hi_plural: "चकोतरे", article: "a", gender: "M" },
  { word: "Grapes", slug: "grapes", word_en: "grape", word_en_plural: "grapes", word_hi: "अंगूर", word_hi_plural: "अंगूर", article: "a", gender: "M" },
  { word: "Guava", slug: "guava", word_en: "guava", word_en_plural: "guavas", word_hi: "अमरूद", word_hi_plural: "अमरूद", article: "a", gender: "M" },
  { word: "Jackfruit", slug: "jackfruit", word_en: "jackfruit", word_en_plural: "jackfruits", word_hi: "कटहल", word_hi_plural: "कटहल", article: "a", gender: "M" },
  { word: "Kiwi", slug: "kiwi", word_en: "kiwi", word_en_plural: "kiwis", word_hi: "कीवी", word_hi_plural: "कीवी", article: "a", gender: "F" },
  { word: "Kumquat", slug: "kumquat", word_en: "kumquat", word_en_plural: "kumquats", word_hi: "कुमकुट", word_hi_plural: "कुमकुट", article: "a", gender: "M" },
  { word: "Lemon", slug: "lemon", word_en: "lemon", word_en_plural: "lemons", word_hi: "नींबू", word_hi_plural: "नींबू", article: "a", gender: "M" },
  { word: "Lychee", slug: "lychee", word_en: "lychee", word_en_plural: "lychees", word_hi: "लीची", word_hi_plural: "लीची", article: "a", gender: "F" },
  { word: "Mango", slug: "mango", word_en: "mango", word_en_plural: "mangoes", word_hi: "आम", word_hi_plural: "आम", article: "a", gender: "M" },
  { word: "Mulberry", slug: "mulberry", word_en: "mulberry", word_en_plural: "mulberries", word_hi: "शहतूत", word_hi_plural: "शहतूत", article: "a", gender: "M" },
  { word: "Muskmelon", slug: "muskmelon", word_en: "muskmelon", word_en_plural: "muskmelons", word_hi: "खरबूजा", word_hi_plural: "खरबूजे", article: "a", gender: "M" },
  { word: "Nectarine", slug: "nectarine", word_en: "nectarine", word_en_plural: "nectarines", word_hi: "नेक्टराइन", word_hi_plural: "नेक्टराइन", article: "a", gender: "M" },
  { word: "Olive", slug: "olive", word_en: "olive", word_en_plural: "olives", word_hi: "जैतून", word_hi_plural: "जैतून", article: "an", gender: "M" },
  { word: "Orange", slug: "orange", word_en: "orange", word_en_plural: "oranges", word_hi: "संतरा", word_hi_plural: "संतरे", article: "an", gender: "M" },
  { word: "Papaya", slug: "papaya", word_en: "papaya", word_en_plural: "papayas", word_hi: "पपीता", word_hi_plural: "पपीते", article: "a", gender: "M" },
  { word: "Passion Fruit", slug: "passion-fruit", word_en: "passion fruit", word_en_plural: "passion fruits", word_hi: "पैशन फ्रूट", word_hi_plural: "पैशन फ्रूट", article: "a", gender: "M" },
  { word: "Peach", slug: "peach", word_en: "peach", word_en_plural: "peaches", word_hi: "आड़ू", word_hi_plural: "आड़ू", article: "a", gender: "M" },
  { word: "Pear", slug: "pear", word_en: "pear", word_en_plural: "pears", word_hi: "नाशपाती", word_hi_plural: "नाशपाती", article: "a", gender: "F" },
  { word: "Persimmon", slug: "persimmon", word_en: "persimmon", word_en_plural: "persimmons", word_hi: "जापानी फल", word_hi_plural: "जापानी फल", article: "a", gender: "M" },
  { word: "Pineapple", slug: "pineapple", word_en: "pineapple", word_en_plural: "pineapples", word_hi: "अनानास", word_hi_plural: "अनानास", article: "a", gender: "M" },
  { word: "Plum", slug: "plum", word_en: "plum", word_en_plural: "plums", word_hi: "आलूबुखारा", word_hi_plural: "आलूबुखारा", article: "a", gender: "M" },
  { word: "Pomegranate", slug: "pomegranate", word_en: "pomegranate", word_en_plural: "pomegranates", word_hi: "अनार", word_hi_plural: "अनार", article: "a", gender: "M" },
  { word: "Pomelo", slug: "pomelo", word_en: "pomelo", word_en_plural: "pomelos", word_hi: "चकोतरा", word_hi_plural: "चकोतरे", article: "a", gender: "M" },
  { word: "Quince", slug: "quince", word_en: "quince", word_en_plural: "quinces", word_hi: "सफरजल", word_hi_plural: "सफरजल", article: "a", gender: "M" },
  { word: "Raspberry", slug: "raspberry", word_en: "raspberry", word_en_plural: "raspberries", word_hi: "रसभरी", word_hi_plural: "रसभरी", article: "a", gender: "F" },
  { word: "Sapota", slug: "sapota", word_en: "sapota", word_en_plural: "sapotas", word_hi: "चीकू", word_hi_plural: "चीकू", article: "a", gender: "M" },
  { word: "Starfruit", slug: "starfruit", word_en: "starfruit", word_en_plural: "starfruits", word_hi: "कमरख", word_hi_plural: "कमरख", article: "a", gender: "M" },
  { word: "Strawberry", slug: "strawberry", word_en: "strawberry", word_en_plural: "strawberries", word_hi: "स्ट्रॉबेरी", word_hi_plural: "स्ट्रॉबेरी", article: "a", gender: "F" },
  { word: "Sweet Lime", slug: "sweet-lime", word_en: "sweet lime", word_en_plural: "sweet limes", word_hi: "मौसमी", word_hi_plural: "मौसमी", article: "a", gender: "F" },
  { word: "Tamarind", slug: "tamarind", word_en: "tamarind", word_en_plural: "tamarinds", word_hi: "इमली", word_hi_plural: "इमली", article: "a", gender: "F" },
  { word: "Tangerine", slug: "tangerine", word_en: "tangerine", word_en_plural: "tangerines", word_hi: "कीनू", word_hi_plural: "कीनू", article: "a", gender: "M" },
  { word: "Watermelon", slug: "watermelon", word_en: "watermelon", word_en_plural: "watermelons", word_hi: "तरबूज", word_hi_plural: "तरबूज", article: "a", gender: "M" }
];

function generateTranslations(fruit) {
  const { word_en, word_en_plural, word_hi, word_hi_plural, article, gender } = fruit;

  // Gender-based endings
  const was = gender === 'F' ? 'थी' : 'था';
  const were = gender === 'F' ? 'थीं' : 'थे';
  const bought_past = gender === 'F' ? 'खरीदी' : 'खरीदा';
  const bought_past_perf = gender === 'F' ? 'खरीदी थी' : 'खरीदा था';
  const sweet = gender === 'F' ? 'मीठी' : 'मीठा';
  const rotten = gender === 'F' ? 'सड़ी हुई' : 'सड़ा हुआ';
  const ripe = gender === 'F' ? 'पकी हुई' : 'पका हुआ';
  const eaten_passive_past = gender === 'F' ? 'खाई गई थी' : 'खाया गया था';
  const eaten_passive_present = gender === 'F' ? 'खाई जाती है' : 'खाया जाता है';

  return [
    // To Be & Demonstrative
    { tense: "To Be - Present Affirmative", en: `This is ${article} ${word_en}.`, hi: `यह एक ${word_hi} है।` },
    { tense: "To Be - Present Affirmative (Plural)", en: `These are ${word_en_plural}.`, hi: `ये ${word_hi_plural} हैं।` },
    { tense: "To Be - Past Affirmative", en: `That was ${article} ${word_en}.`, hi: `वह एक ${word_hi} ${was}।` },
    { tense: "To Be - Past Affirmative (Plural)", en: `Those were ${word_en_plural}.`, hi: `वे ${word_hi_plural} ${were}।` },
    { tense: "To Be - Present Negative", en: `This is not ${article} ${word_en}.`, hi: `यह एक ${word_hi} नहीं है।` },
    { tense: "To Be - Present Negative (Plural)", en: `These are not ${word_en_plural}.`, hi: `ये ${word_hi_plural} नहीं हैं।` },
    { tense: "To Be - Present Interrogative", en: `Is this ${article} ${word_en}?`, hi: `क्या यह एक ${word_hi} है?` },
    { tense: "To Be - Present Interrogative (Plural)", en: `Are these ${word_en_plural}?`, hi: `क्या ये ${word_hi_plural} हैं?` },
    { tense: "To Be - Past Interrogative", en: `Was that ${article} ${word_en}?`, hi: `क्या वह एक ${word_hi} ${was}?` },
    { tense: "To Be - Wh-Question", en: `Where is the ${word_en}?`, hi: `${word_hi} कहाँ है?` },
    { tense: "To Be - Wh-Question (Plural)", en: `Where are the ${word_en_plural}?`, hi: `${word_hi_plural} कहाँ हैं?` },
    { tense: "To Be - Wh-Question (Why)", en: `Why is this ${word_en} here?`, hi: `यह ${word_hi} यहाँ क्यों है?` },

    // To Have (Possession)
    { tense: "To Have - Present Affirmative", en: `I have ${article} ${word_en}.`, hi: `मेरे पास एक ${word_hi} है।` },
    { tense: "To Have - Present Affirmative (Plural)", en: `I have many ${word_en_plural}.`, hi: `मेरे पास कई ${word_hi_plural} हैं।` },
    { tense: "To Have - Past Affirmative", en: `I had ${article} ${word_en}.`, hi: `मेरे पास एक ${word_hi} ${was}।` },
    { tense: "To Have - Present Negative", en: `I don't have ${article} ${word_en}.`, hi: `मेरे पास ${word_hi} नहीं है।` },
    { tense: "To Have - Present Interrogative", en: `Do you have ${article} ${word_en}?`, hi: `क्या तुम्हारे पास एक ${word_hi} है?` },
    { tense: "To Have - Past Interrogative", en: `Did you have ${article} ${word_en}?`, hi: `क्या तुम्हारे पास एक ${word_hi} ${was}?` },
    { tense: "To Have - Wh-Question", en: `How many ${word_en_plural} do you have?`, hi: `तुम्हारे पास कितने ${word_hi_plural} हैं?` },

    // Tenses - Simple Present
    { tense: "Simple Present - Affirmative", en: `I eat ${article} ${word_en} every day.`, hi: `मैं हर दिन एक ${word_hi} खाता हूँ।` },
    { tense: "Simple Present - Negative", en: `I don't eat ${word_en_plural}.`, hi: `मैं ${word_hi_plural} नहीं खाता हूँ।` },
    { tense: "Simple Present - Interrogative", en: `Do you eat ${word_en_plural}?`, hi: `क्या तुम ${word_hi_plural} खाते हो?` },
    { tense: "Simple Present - Wh-Question", en: `When do you eat ${article} ${word_en}?`, hi: `तुम ${word_hi} कब खाते हो?` },

    // Tenses - Present Continuous
    { tense: "Present Continuous - Affirmative", en: `I am eating ${article} ${word_en}.`, hi: `मैं एक ${word_hi} खा रहा हूँ।` },
    { tense: "Present Continuous - Negative", en: `I am not eating ${article} ${word_en}.`, hi: `मैं ${word_hi} नहीं खा रहा हूँ।` },
    { tense: "Present Continuous - Interrogative", en: `Are you eating ${article} ${word_en}?`, hi: `क्या तुम ${word_hi} खा रहे हो?` },
    { tense: "Present Continuous - Wh-Question", en: `Why are you eating my ${word_en}?`, hi: `तुम मेरा ${word_hi} क्यों खा रहे हो?` },

    // Tenses - Present Perfect
    { tense: "Present Perfect - Affirmative", en: `I have eaten the ${word_en}.`, hi: `मैंने ${word_hi} खा लिया है।` },
    { tense: "Present Perfect - Negative", en: `I have not eaten the ${word_en}.`, hi: `मैंने ${word_hi} नहीं खाया है।` },
    { tense: "Present Perfect - Interrogative", en: `Have you eaten the ${word_en}?`, hi: `क्या तुमने ${word_hi} खा लिया है?` },

    // Tenses - Simple Past
    { tense: "Simple Past - Affirmative", en: `I bought ${article} ${word_en} yesterday.`, hi: `मैंने कल एक ${word_hi} ${bought_past_perf}।` },
    { tense: "Simple Past - Negative", en: `I didn't buy ${article} ${word_en}.`, hi: `मैंने ${word_hi} नहीं ${bought_past}।` },
    { tense: "Simple Past - Interrogative", en: `Did you buy ${article} ${word_en}?`, hi: `क्या तुमने एक ${word_hi} ${bought_past}?` },
    { tense: "Simple Past - Wh-Question", en: `Where did you buy this ${word_en}?`, hi: `तुमने यह ${word_hi} कहाँ से ${bought_past}?` },

    // Tenses - Past Continuous
    { tense: "Past Continuous - Affirmative", en: `I was eating ${article} ${word_en} when you called.`, hi: `जब तुमने फोन किया तब मैं एक ${word_hi} खा रहा था।` },
    { tense: "Past Continuous - Interrogative", en: `Were you eating ${article} ${word_en}?`, hi: `क्या तुम एक ${word_hi} खा रहे थे?` },

    // Tenses - Simple Future
    { tense: "Simple Future - Affirmative", en: `I will eat ${article} ${word_en} tomorrow.`, hi: `मैं कल एक ${word_hi} खाऊँगा।` },
    { tense: "Simple Future - Negative", en: `I will not eat the ${word_en}.`, hi: `मैं वह ${word_hi} नहीं खाऊँगा।` },
    { tense: "Simple Future - Interrogative", en: `Will you eat this ${word_en}?`, hi: `क्या तुम यह ${word_hi} खाओगे?` },

    // Modals
    { tense: "Modal - Can", en: `Can you peel this ${word_en}?`, hi: `क्या तुम यह ${word_hi} छील सकते हो?` },
    { tense: "Modal - Should", en: `You should eat ${article} ${word_en}.`, hi: `तुम्हें एक ${word_hi} खाना चाहिए।` },
    { tense: "Modal - Must", en: `You must buy fresh ${word_en_plural}.`, hi: `तुम्हें ताज़े ${word_hi_plural} ही खरीदने चाहिए।` },
    { tense: "Modal - May", en: `May I have ${article} ${word_en}?`, hi: `क्या मैं एक ${word_hi} ले सकता हूँ?` },
    { tense: "Modal - Would", en: `Would you like ${article} ${word_en}?`, hi: `क्या आप एक ${word_hi} लेना पसंद करेंगे?` },
    
    // Imperative & Others
    { tense: "Imperative - Affirmative", en: `Eat this ${word_en}.`, hi: `यह ${word_hi} खाओ।` },
    { tense: "Imperative - Negative", en: `Don't eat that ${word_en}.`, hi: `वह ${word_hi} मत खाओ।` },
    { tense: "Passive Voice - Present", en: `The ${word_en} is eaten.`, hi: `${word_hi} ${eaten_passive_present}।` },
    { tense: "Passive Voice - Past", en: `The ${word_en} was eaten by him.`, hi: `${word_hi} उसके द्वारा ${eaten_passive_past}।` },
    
    // Prepositions / Locations
    { tense: "Location/Preposition", en: `The ${word_en} is on the table.`, hi: `${word_hi} मेज़ पर है।` },
    { tense: "Location/Preposition", en: `There is a ${word_en} in the basket.`, hi: `टोकरी में एक ${word_hi} है।` },
    { tense: "Location/Preposition", en: `The monkey is holding a ${word_en}.`, hi: `बंदर ने एक ${word_hi} पकड़ा हुआ है।` },

    // Adjectives
    { tense: "Adjective Use", en: `This ${word_en} is sweet.`, hi: `यह ${word_hi} ${sweet} है।` },
    { tense: "Adjective Use", en: `That ${word_en} is rotten.`, hi: `वह ${word_hi} ${rotten} है।` },
    { tense: "Adjective Use", en: `I need a ripe ${word_en}.`, hi: `मुझे एक ${ripe} ${word_hi} चाहिए।` },

    // Actions
    { tense: "Action - Cutting", en: `I am cutting the ${word_en}.`, hi: `मैं ${word_hi} काट रहा हूँ।` },
    { tense: "Action - Peeling", en: `Please peel the ${word_en}.`, hi: `कृपया ${word_hi} छील दो।` },
    { tense: "Action - Buying", en: `She is buying ${word_en_plural}.`, hi: `वह ${word_hi_plural} खरीद रही है।` },
    { tense: "Action - Washing", en: `Wash the ${word_en} before eating.`, hi: `खाने से पहले ${word_hi} धो लो।` },
  ];
}

const targetDir = path.join(__dirname, 'website', 'data', 'translations', 'fruits');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let generatedCount = 0;
fruitsConfig.forEach(fruit => {
  const outputPath = path.join(targetDir, `sentence-${fruit.slug}.json`);
  const outputData = {
    word: fruit.word,
    slug: fruit.slug,
    category: "fruits",
    translations: generateTranslations(fruit)
  };
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), 'utf8');
  generatedCount++;
});

console.log(`Successfully generated translations for ${generatedCount} fruits.`);
