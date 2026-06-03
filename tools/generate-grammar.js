const fs = require('fs');
const path = require('path');

const lessonsDir = path.join(__dirname, 'website', 'data', 'grammar', 'lessons');
const siteDir = path.join(__dirname, 'website', 'data', 'site');

// Create directories if they don't exist
if (!fs.existsSync(lessonsDir)) fs.mkdirSync(lessonsDir, { recursive: true });
if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

const grammarTopics = [
    {
        id: 1, slug: "nouns", title: "Nouns (संज्ञा)", 
        def_en: "A noun is a word that names a person, place, thing, or idea.",
        def_hi: "संज्ञा किसी व्यक्ति, वस्तु, स्थान या भाव के नाम को कहते हैं।",
        cats: [
            { name: "Proper Noun (व्यक्तिवाचक संज्ञा)", intro: "Specific names", examples: [{en: "Rahul is my friend.", hi: "राहुल मेरा दोस्त है।"}, {en: "I live in Delhi.", hi: "मैं दिल्ली में रहता हूँ।"}] },
            { name: "Common Noun (जातिवाचक संज्ञा)", intro: "General names", examples: [{en: "The boy is playing.", hi: "लड़का खेल रहा है।"}, {en: "This is a big city.", hi: "यह एक बड़ा शहर है।"}] },
            { name: "Abstract Noun (भाववाचक संज्ञा)", intro: "Feelings or ideas", examples: [{en: "Honesty is the best policy.", hi: "ईमानदारी सबसे अच्छी नीति है।"}, {en: "Love is blind.", hi: "प्यार अंधा होता है।"}] }
        ]
    },
    {
        id: 2, slug: "pronouns", title: "Pronouns (सर्वनाम)",
        def_en: "A pronoun is a word used in place of a noun to avoid repetition.",
        def_hi: "सर्वनाम वह शब्द है जो संज्ञा के स्थान पर प्रयोग होता है ताकि संज्ञा को बार-बार दोहराना न पड़े।",
        cats: [
            { name: "Personal Pronouns (पुरुषवाचक)", intro: "I, We, You, He, She, It, They", examples: [{en: "He is a good boy.", hi: "वह एक अच्छा लड़का है।"}, {en: "They are playing.", hi: "वे खेल रहे हैं।"}] },
            { name: "Possessive Pronouns (अधिकारवाचक)", intro: "Mine, Yours, His, Hers, Theirs", examples: [{en: "This book is mine.", hi: "यह किताब मेरी है।"}, {en: "That car is theirs.", hi: "वह गाड़ी उनकी है।"}] }
        ]
    },
    {
        id: 3, slug: "verbs", title: "Verbs (क्रिया)",
        def_en: "A verb is a word that shows an action or a state of being.",
        def_hi: "क्रिया वह शब्द है जो किसी कार्य के होने या करने को दर्शाता है।",
        cats: [
            { name: "Action Verbs", intro: "Physical actions", examples: [{en: "I eat an apple.", hi: "मैं सेब खाता हूँ।"}, {en: "She runs fast.", hi: "वह तेज़ दौड़ती है।"}] },
            { name: "Helping Verbs", intro: "Is, Am, Are, Was, Were", examples: [{en: "He is sleeping.", hi: "वह सो रहा है।"}, {en: "They were playing.", hi: "वे खेल रहे थे।"}] }
        ]
    },
    {
        id: 4, slug: "adjectives", title: "Adjectives (विशेषण)",
        def_en: "An adjective is a word that describes or modifies a noun or pronoun.",
        def_hi: "विशेषण वह शब्द है जो संज्ञा या सर्वनाम की विशेषता बताता है।",
        cats: [
            { name: "Quality Adjectives", intro: "Shows kind or quality", examples: [{en: "He is a brave boy.", hi: "वह एक बहादुर लड़का है।"}, {en: "This is a beautiful flower.", hi: "यह एक सुंदर फूल है।"}] },
            { name: "Quantity Adjectives", intro: "Shows how much", examples: [{en: "I have some money.", hi: "मेरे पास कुछ पैसे हैं।"}, {en: "He ate the whole cake.", hi: "उसने पूरा केक खा लिया।"}] }
        ]
    },
    {
        id: 5, slug: "adverbs", title: "Adverbs (क्रिया विशेषण)",
        def_en: "An adverb is a word that modifies a verb, an adjective, or another adverb.",
        def_hi: "क्रिया विशेषण वह शब्द है जो किसी क्रिया, विशेषण या अन्य क्रिया विशेषण की विशेषता बताता है।",
        cats: [
            { name: "Adverbs of Manner", intro: "How an action is done", examples: [{en: "He runs quickly.", hi: "वह तेज़ी से दौड़ता है।"}, {en: "She sings beautifully.", hi: "वह बहुत सुरीला गाती है।"}] },
            { name: "Adverbs of Time", intro: "When an action is done", examples: [{en: "I will go tomorrow.", hi: "मैं कल जाऊँगा।"}, {en: "He came late.", hi: "वह देर से आया।"}] }
        ]
    },
    {
        id: 6, slug: "prepositions", title: "Prepositions (संबंधबोधक अव्यय)",
        def_en: "A preposition shows the relationship of a noun or pronoun to another word in the sentence.",
        def_hi: "संबंधबोधक अव्यय संज्ञा या सर्वनाम का संबंध वाक्य के अन्य शब्दों से जोड़ता है।",
        cats: [
            { name: "Prepositions of Place", intro: "In, On, Under, At", examples: [{en: "The book is on the table.", hi: "किताब मेज़ पर है।"}, {en: "He is at the door.", hi: "वह दरवाज़े पर है।"}] },
            { name: "Prepositions of Time", intro: "In, On, At", examples: [{en: "I will meet you at 5 PM.", hi: "मैं तुमसे शाम 5 बजे मिलूँगा।"}, {en: "My birthday is in June.", hi: "मेरा जन्मदिन जून में है।"}] }
        ]
    },
    {
        id: 7, slug: "conjunctions", title: "Conjunctions (समुच्चयबोधक अव्यय)",
        def_en: "A conjunction is a word used to connect words, phrases, or clauses.",
        def_hi: "यह दो शब्दों या वाक्यों को जोड़ने का काम करता है।",
        cats: [
            { name: "Coordinating Conjunctions", intro: "And, But, Or, So", examples: [{en: "I like tea and coffee.", hi: "मुझे चाय और कॉफ़ी पसंद है।"}, {en: "He is poor but honest.", hi: "वह गरीब है लेकिन ईमानदार है।"}] },
            { name: "Subordinating Conjunctions", intro: "Because, Although, If", examples: [{en: "I stayed home because it was raining.", hi: "मैं घर पर रहा क्योंकि बारिश हो रही थी।"}, {en: "If you work hard, you will pass.", hi: "अगर तुम कड़ी मेहनत करोगे, तो पास हो जाओगे।"}] }
        ]
    },
    {
        id: 8, slug: "interjections", title: "Interjections (विस्मयादिबोधक अव्यय)",
        def_en: "An interjection is a word that expresses strong emotion or sudden feeling.",
        def_hi: "यह शब्द अचानक आई भावनाओं (जैसे खुशी, दुख, आश्चर्य) को व्यक्त करता है।",
        cats: [
            { name: "Expressing Joy/Surprise", intro: "Wow, Hurray", examples: [{en: "Wow! That is a beautiful car.", hi: "वाह! वह बहुत सुंदर गाड़ी है।"}, {en: "Hurray! We won the match.", hi: "हुर्रे! हम मैच जीत गए।"}] },
            { name: "Expressing Sorrow/Pain", intro: "Alas, Ouch", examples: [{en: "Alas! He is dead.", hi: "हाय! वह मर गया।"}, {en: "Ouch! That hurts.", hi: "आउच! इसमें दर्द होता है।"}] }
        ]
    },
    {
        id: 9, slug: "tenses-present", title: "Present Tense (वर्तमान काल)",
        def_en: "The present tense is used to describe an action that is happening right now or happens regularly.",
        def_hi: "वर्तमान काल उस कार्य को दर्शाता है जो अभी हो रहा है या नियमित रूप से होता है।",
        cats: [
            { name: "Simple Present", intro: "Habits and facts", examples: [{en: "I play cricket.", hi: "मैं क्रिकेट खेलता हूँ।"}, {en: "The sun rises in the east.", hi: "सूरज पूर्व से उगता है।"}] },
            { name: "Present Continuous", intro: "Action happening right now", examples: [{en: "I am eating.", hi: "मैं खा रहा हूँ।"}, {en: "They are playing.", hi: "वे खेल रहे हैं।"}] }
        ]
    },
    {
        id: 10, slug: "tenses-past", title: "Past Tense (भूतकाल)",
        def_en: "The past tense is used to describe an action that has already happened.",
        def_hi: "भूतकाल उस कार्य को दर्शाता है जो बीते समय में हो चुका है।",
        cats: [
            { name: "Simple Past", intro: "Completed actions", examples: [{en: "I played cricket.", hi: "मैंने क्रिकेट खेला।"}, {en: "She went to school.", hi: "वह स्कूल गई।"}] },
            { name: "Past Continuous", intro: "Action happening in the past", examples: [{en: "I was eating.", hi: "मैं खा रहा था।"}, {en: "They were playing.", hi: "वे खेल रहे थे।"}] }
        ]
    },
    {
        id: 11, slug: "tenses-future", title: "Future Tense (भविष्य काल)",
        def_en: "The future tense is used to describe an action that will happen at a later time.",
        def_hi: "भविष्य काल उस कार्य को दर्शाता है जो आने वाले समय में होगा।",
        cats: [
            { name: "Simple Future", intro: "Will / Shall", examples: [{en: "I will play cricket.", hi: "मैं क्रिकेट खेलूँगा।"}, {en: "She will go to school.", hi: "वह स्कूल जाएगी।"}] },
            { name: "Future Continuous", intro: "Action that will be happening", examples: [{en: "I will be eating.", hi: "मैं खा रहा हूँगा।"}, {en: "They will be playing.", hi: "वे खेल रहे होंगे।"}] }
        ]
    },
    {
        id: 12, slug: "articles", title: "Articles (A, An, The)",
        def_en: "Articles are used before nouns to define whether they are specific or unspecific.",
        def_hi: "ये शब्द संज्ञा (Noun) को निश्चित या अनिश्चित बताने के लिए प्रयोग होते हैं।",
        cats: [
            { name: "Definite Article (The)", intro: "Specific nouns", examples: [{en: "The sun is hot.", hi: "सूरज गर्म है।"}, {en: "I read the book you gave me.", hi: "मैंने वह किताब पढ़ी जो तुमने मुझे दी थी।"}] },
            { name: "Indefinite Articles (A, An)", intro: "Unspecific nouns", examples: [{en: "I have a pen.", hi: "मेरे पास एक कलम है।"}, {en: "She eats an apple daily.", hi: "वह रोज़ एक सेब खाती है।"}] }
        ]
    },
    {
        id: 13, slug: "active-passive-voice", title: "Active & Passive Voice (कर्तृवाच्य और कर्मवाच्य)",
        def_en: "Active voice emphasizes the subject acting. Passive voice emphasizes the object receiving the action.",
        def_hi: "Active में कर्ता (Subject) की प्रधानता होती है, और Passive में कर्म (Object) की प्रधानता होती है।",
        cats: [
            { name: "Active Voice", intro: "Subject acts", examples: [{en: "Ram killed Ravan.", hi: "राम ने रावण को मारा।"}] },
            { name: "Passive Voice", intro: "Action is received", examples: [{en: "Ravan was killed by Ram.", hi: "रावण राम के द्वारा मारा गया।"}] }
        ]
    },
    {
        id: 14, slug: "direct-indirect-speech", title: "Direct & Indirect Speech (प्रत्यक्ष और अप्रत्यक्ष कथन)",
        def_en: "Direct speech quotes the exact words. Indirect speech reports what was said without exact quotes.",
        def_hi: "Direct में वक्ता के शब्दों को ज्यों का त्यों रखा जाता है। Indirect में उन शब्दों को अपने तरीके से कहा जाता है।",
        cats: [
            { name: "Direct Speech", intro: "Exact words", examples: [{en: "He said, 'I am going.'", hi: "उसने कहा, 'मैं जा रहा हूँ।'"}] },
            { name: "Indirect Speech", intro: "Reported words", examples: [{en: "He said that he was going.", hi: "उसने कहा कि वह जा रहा था।"}] }
        ]
    },
    {
        id: 15, slug: "modal-verbs", title: "Modal Verbs (Can, Could, Should...)",
        def_en: "Modals are helping verbs that express possibility, ability, permission, or obligation.",
        def_hi: "ये विशेष क्रियाएं हैं जो संभावना, क्षमता या अनुमति को दर्शाती हैं।",
        cats: [
            { name: "Ability (क्षमता)", intro: "Can / Could", examples: [{en: "I can speak English.", hi: "मैं अंग्रेजी बोल सकता हूँ।"}, {en: "He could run fast.", hi: "वह तेज़ दौड़ सकता था।"}] },
            { name: "Advice & Obligation (सलाह / कर्तव्य)", intro: "Should / Must", examples: [{en: "You should study hard.", hi: "तुम्हें कड़ी मेहनत करनी चाहिए।"}, {en: "We must follow traffic rules.", hi: "हमें ट्रैफिक नियमों का पालन करना चाहिए।"}] }
        ]
    }
];

let indexArray = [];

grammarTopics.forEach(topic => {
    // Write individual lesson file matching the frontend expected schema
    const lessonData = {
        title: topic.title,
        slug: topic.slug,
        part: topic.id,
        definition_en: topic.def_en,
        definition_hi: topic.def_hi,
        categories: topic.cats
    };
    fs.writeFileSync(path.join(lessonsDir, `${topic.slug}.json`), JSON.stringify(lessonData, null, 2), 'utf8');
    
    // Add to index
    indexArray.push({
        title: topic.title,
        slug: topic.slug,
        part: topic.id
    });
});

// Write the index file
fs.writeFileSync(path.join(siteDir, 'articles-index.json'), JSON.stringify(indexArray, null, 2), 'utf8');

console.log(`Successfully generated ${grammarTopics.length} rich grammar lessons and updated articles-index.json!`);
