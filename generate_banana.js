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
  { tense: "To Have - Present Affirmative (He/She)", en: `She has ${article} ${word_en}.`, hi: `उसके पास एक ${word_hi} है।` },
  { tense: "To Have - Past Affirmative", en: `We had ${article} ${word_en}.`, hi: `हमारे पास एक ${word_hi} था।` },
  { tense: "To Have - Present Negative", en: `I don't have ${article} ${word_en}.`, hi: `मेरे पास ${word_hi} नहीं है।` },
  { tense: "To Have - Present Negative (He/She)", en: `He doesn't have ${article} ${word_en}.`, hi: `उसके पास ${word_hi} नहीं है।` },
  { tense: "To Have - Present Interrogative", en: `Do you have ${article} ${word_en}?`, hi: `क्या तुम्हारे पास एक ${word_hi} है?` },
  { tense: "To Have - Past Interrogative", en: `Did they have ${article} ${word_en}?`, hi: `क्या उनके पास एक ${word_hi} था?` },
  { tense: "To Have - Wh-Question", en: `How many ${word_en_plural} do you have?`, hi: `तुम्हारे पास कितने ${word_hi_plural} हैं?` },

  // Present Simple (Eat/Like/Want/Buy/Need)
  { tense: "Present Simple - Affirmative", en: `I eat ${article} ${word_en} every day.`, hi: `मैं रोज़ एक ${word_hi} खाता हूँ।` },
  { tense: "Present Simple - Affirmative", en: `He likes ${word_en_plural}.`, hi: `उसे ${word_hi_plural} पसंद हैं।` },
  { tense: "Present Simple - Affirmative", en: `They want ${word_en_plural}.`, hi: `उन्हें ${word_hi_plural} चाहिए।` },
  { tense: "Present Simple - Negative", en: `I do not eat ${word_en_plural}.`, hi: `मैं ${word_hi_plural} नहीं खाता।` },
  { tense: "Present Simple - Negative", en: `She does not like ${word_en_plural}.`, hi: `उसे ${word_hi_plural} पसंद नहीं हैं।` },
  { tense: "Present Simple - Interrogative", en: `Do you like ${word_en_plural}?`, hi: `क्या तुम्हें ${word_hi_plural} पसंद हैं?` },
  { tense: "Present Simple - Interrogative", en: `Does he eat ${word_en_plural}?`, hi: `क्या वह ${word_hi_plural} खाता है?` },
  { tense: "Present Simple - Wh-Question", en: `Why do you eat ${word_en_plural}?`, hi: `तुम ${word_hi_plural} क्यों खाते हो?` },

  // Present Continuous
  { tense: "Present Continuous - Affirmative", en: `I am eating ${article} ${word_en}.`, hi: `मैं एक ${word_hi} खा रहा हूँ।` },
  { tense: "Present Continuous - Affirmative", en: `She is buying ${word_en_plural}.`, hi: `वह ${word_hi_plural} खरीद रही है।` },
  { tense: "Present Continuous - Negative", en: `They are not eating ${word_en_plural}.`, hi: `वे ${word_hi_plural} नहीं खा रहे हैं।` },
  { tense: "Present Continuous - Interrogative", en: `Are you eating ${article} ${word_en}?`, hi: `क्या तुम एक ${word_hi} खा रहे हो?` },
  { tense: "Present Continuous - Wh-Question", en: `Why is he buying ${word_en_plural}?`, hi: `वह ${word_hi_plural} क्यों खरीद रहा है?` },

  // Present Perfect
  { tense: "Present Perfect - Affirmative", en: `I have eaten the ${word_en}.`, hi: `मैंने ${word_hi} खा लिया है।` },
  { tense: "Present Perfect - Affirmative", en: `She has bought ${word_en_plural}.`, hi: `उसने ${word_hi_plural} खरीद लिए हैं।` },
  { tense: "Present Perfect - Negative", en: `I have not seen the ${word_en}.`, hi: `मैंने ${word_hi} नहीं देखा है।` },
  { tense: "Present Perfect - Interrogative", en: `Have you eaten the ${word_en}?`, hi: `क्या तुमने ${word_hi} खा लिया है?` },

  // Past Simple
  { tense: "Past Simple - Affirmative", en: `I bought ${article} ${word_en} yesterday.`, hi: `मैंने कल एक ${word_hi} खरीदा।` },
  { tense: "Past Simple - Affirmative", en: `She ate the ${word_en}.`, hi: `उसने ${word_hi} खाया।` },
  { tense: "Past Simple - Negative", en: `I did not buy any ${word_en_plural}.`, hi: `मैंने कोई ${word_hi_plural} नहीं खरीदे।` },
  { tense: "Past Simple - Interrogative", en: `Did you eat the ${word_en}?`, hi: `क्या तुमने ${word_hi} खाया?` },
  { tense: "Past Simple - Wh-Question", en: `Why did you cut the ${word_en}?`, hi: `तुमने ${word_hi} क्यों काटा?` },

  // Past Continuous
  { tense: "Past Continuous - Affirmative", en: `I was eating ${article} ${word_en}.`, hi: `मैं एक ${word_hi} खा रहा था।` },
  { tense: "Past Continuous - Negative", en: `They were not eating ${word_en_plural}.`, hi: `वे ${word_hi_plural} नहीं खा रहे थे।` },
  { tense: "Past Continuous - Interrogative", en: `Were you looking for a ${word_en}?`, hi: `क्या तुम एक ${word_hi} ढूँढ रहे थे?` },

  // Future Simple
  { tense: "Future Simple - Affirmative", en: `I will buy ${article} ${word_en} tomorrow.`, hi: `मैं कल एक ${word_hi} खरीदूंगा।` },
  { tense: "Future Simple - Affirmative", en: `We shall eat ${word_en_plural}.`, hi: `हम ${word_hi_plural} खाएंगे।` },
  { tense: "Future Simple - Negative", en: `I will not eat the ${word_en}.`, hi: `मैं ${word_hi} नहीं खाऊंगा।` },
  { tense: "Future Simple - Interrogative", en: `Will you give me ${article} ${word_en}?`, hi: `क्या तुम मुझे एक ${word_hi} दोगे?` },
  { tense: "Future Simple - Wh-Question", en: `When will he eat the ${word_en}?`, hi: `वह ${word_hi} कब खाएगा?` },

  // Modals (Can, Should, Must)
  { tense: "Modal (Can) - Affirmative", en: `I can eat a dozen ${word_en_plural}.`, hi: `मैं एक दर्जन ${word_hi_plural} खा सकता हूँ।` },
  { tense: "Modal (Can) - Interrogative", en: `Can you peel the ${word_en}?`, hi: `क्या तुम ${word_hi} छील सकते हो?` },
  { tense: "Modal (Should) - Affirmative", en: `You should eat a ${word_en} for energy.`, hi: `तुम्हें ऊर्जा के लिए एक ${word_hi} खाना चाहिए।` },
  { tense: "Modal (Should) - Negative", en: `We should not waste ${word_en_plural}.`, hi: `हमें ${word_hi_plural} बर्बाद नहीं करने चाहिए।` },
  { tense: "Modal (Must) - Affirmative", en: `You must wash the ${word_en} before eating.`, hi: `खाने से पहले तुम्हें ${word_hi} जरूर धोना चाहिए।` },
  
  // Passive Voice
  { tense: "Passive (Present)", en: `The ${word_en} is eaten by him.`, hi: `${word_hi} उसके द्वारा खाया जाता है।` },
  { tense: "Passive (Past)", en: `The ${word_en} was eaten.`, hi: `${word_hi} खा लिया गया था।` }
];

const transData = {
  word: "Banana",
  slug: "banana",
  category: "fruits",
  translations: templates
};

fs.writeFileSync(path.join(__dirname, 'website', 'data', 'translations', 'fruits', 'sentence-banana.json'), JSON.stringify(transData, null, 4));

console.log(`Generated ${templates.length} translations for Banana.`);
