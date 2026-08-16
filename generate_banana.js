const fs = require('fs');
const path = require('path');

const word_en = "banana";
const word_hi = "केला";
const word_en_plural = "bananas";
const word_hi_plural = "केले";
const article = "a";

const templates = [
  // To Be & Demonstrative
  { tense: "To Be - Present Affirmative", en: `This is ${article} ${word_en}.`, hi: `यह एक ${word_hi} है।` },
  { tense: "To Be - Present Affirmative (Plural)", en: `These are ${word_en_plural}.`, hi: `ये ${word_hi_plural} हैं।` },
  { tense: "To Be - Past Affirmative", en: `That was ${article} ${word_en}.`, hi: `वह एक ${word_hi} था।` },
  { tense: "To Be - Past Affirmative (Plural)", en: `Those were ${word_en_plural}.`, hi: `वे ${word_hi_plural} थे।` },
  { tense: "To Be - Present Negative", en: `This is not ${article} ${word_en}.`, hi: `यह एक ${word_hi} नहीं है।` },
  { tense: "To Be - Present Negative (Plural)", en: `These are not ${word_en_plural}.`, hi: `ये ${word_hi_plural} नहीं हैं।` },
  { tense: "To Be - Present Interrogative", en: `Is this ${article} ${word_en}?`, hi: `क्या यह एक ${word_hi} है?` },
  { tense: "To Be - Present Interrogative (Plural)", en: `Are these ${word_en_plural}?`, hi: `क्या ये ${word_hi_plural} हैं?` },
  { tense: "To Be - Past Interrogative", en: `Was that ${article} ${word_en}?`, hi: `क्या वह एक ${word_hi} था?` },
  { tense: "To Be - Wh-Question", en: `Where is the ${word_en}?`, hi: `${word_hi} कहाँ है?` },
  { tense: "To Be - Wh-Question (Plural)", en: `Where are the ${word_en_plural}?`, hi: `${word_hi_plural} कहाँ हैं?` },
  { tense: "To Be - Wh-Question (Why)", en: `Why is this ${word_en} here?`, hi: `यह ${word_hi} यहाँ क्यों है?` },

  // To Have (Possession)
  { tense: "To Have - Present Affirmative", en: `I have ${article} ${word_en}.`, hi: `मेरे पास एक ${word_hi} है।` },
  { tense: "To Have - Present Affirmative (Plural)", en: `I have many ${word_en_plural}.`, hi: `मेरे पास कई ${word_hi_plural} हैं।` },
  { tense: "To Have - Past Affirmative", en: `I had ${article} ${word_en}.`, hi: `मेरे पास एक ${word_hi} था।` },
  { tense: "To Have - Present Negative", en: `I don't have ${article} ${word_en}.`, hi: `मेरे पास ${word_hi} नहीं है।` },
  { tense: "To Have - Present Interrogative", en: `Do you have ${article} ${word_en}?`, hi: `क्या तुम्हारे पास एक ${word_hi} है?` },
  { tense: "To Have - Past Interrogative", en: `Did you have ${article} ${word_en}?`, hi: `क्या तुम्हारे पास एक ${word_hi} था?` },
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
  { tense: "Simple Past - Affirmative", en: `I bought ${article} ${word_en} yesterday.`, hi: `मैंने कल एक ${word_hi} खरीदा था।` },
  { tense: "Simple Past - Negative", en: `I didn't buy ${article} ${word_en}.`, hi: `मैंने ${word_hi} नहीं खरीदा।` },
  { tense: "Simple Past - Interrogative", en: `Did you buy ${article} ${word_en}?`, hi: `क्या तुमने एक ${word_hi} खरीदा?` },
  { tense: "Simple Past - Wh-Question", en: `Where did you buy this ${word_en}?`, hi: `तुमने यह ${word_hi} कहाँ से खरीदा?` },

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
  { tense: "Passive Voice - Present", en: `The ${word_en} is eaten.`, hi: `${word_hi} खाया जाता है।` },
  { tense: "Passive Voice - Past", en: `The ${word_en} was eaten by him.`, hi: `${word_hi} उसके द्वारा खाया गया था।` },
  
  // Prepositions / Locations
  { tense: "Location/Preposition", en: `The ${word_en} is on the table.`, hi: `${word_hi} मेज़ पर है।` },
  { tense: "Location/Preposition", en: `There is a ${word_en} in the basket.`, hi: `टोकरी में एक ${word_hi} है।` },
  { tense: "Location/Preposition", en: `The monkey is holding a ${word_en}.`, hi: `बंदर ने एक ${word_hi} पकड़ा हुआ है।` },

  // Adjectives
  { tense: "Adjective Use", en: `This ${word_en} is sweet.`, hi: `यह ${word_hi} मीठा है।` },
  { tense: "Adjective Use", en: `That ${word_en} is rotten.`, hi: `वह ${word_hi} सड़ा हुआ है।` },
  { tense: "Adjective Use", en: `I need a ripe ${word_en}.`, hi: `मुझे एक पका हुआ ${word_hi} चाहिए।` },

  // Actions
  { tense: "Action - Cutting", en: `I am cutting the ${word_en}.`, hi: `मैं ${word_hi} काट रहा हूँ।` },
  { tense: "Action - Peeling", en: `Please peel the ${word_en}.`, hi: `कृपया ${word_hi} छील दो।` },
  { tense: "Action - Buying", en: `She is buying ${word_en_plural}.`, hi: `वह ${word_hi_plural} खरीद रही है।` },
  { tense: "Action - Washing", en: `Wash the ${word_en} before eating.`, hi: `खाने से पहले ${word_hi} धो लो।` },
];

const targetDir = path.join(__dirname, 'website', 'data', 'translations', 'fruits');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, `sentence-${word_en}.json`);

const outputData = {
  word: "Banana",
  slug: "banana",
  category: "fruits",
  translations: templates
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), 'utf8');
console.log(`Successfully generated 58 translations for ${word_en}`);
