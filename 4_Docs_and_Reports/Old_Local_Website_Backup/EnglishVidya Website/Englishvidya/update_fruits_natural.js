const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'website', 'data', 'dictionary', 'fruits');

const updates = {
  "blueberry": {
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["किताबों या शब्दकोशों में ब्लूबेरी (Blueberry) को 'नीलबदरी' कहा जाता है। लेकिन चूँकि यह फल मूल रूप से भारत का नहीं है, इसलिए आम बोलचाल और बाज़ारों में लोग इसे 'ब्लूबेरी' ही कहते हैं।"]
      },
      {
        title: "स्वास्थ्य लाभ और विशेषताएँ (Health Benefits)",
        points: [
          "सुपरफूड: यह बेहतरीन एंटीऑक्सीडेंट, विटामिन C, और फाइबर से भरपूर होता है।",
          "त्वचा और हृदय: इसे नियमित खाने से त्वचा जवां रहती है और दिल की सेहत भी अच्छी रहती है।",
          "याददाश्त: यह हमारे दिमाग को तेज़ करने और याददाश्त बढ़ाने में काफी मदद करता है।"
        ]
      },
      {
        title: "कहाँ से खरीदें? (Where to Buy)",
        points: ["आप इसे बड़े सुपरमार्केट्स, ऑनलाइन ग्रोसरी ऐप्स या अपने नज़दीकी बड़े फलों के बाज़ार से आसानी से खरीद सकते हैं।"]
      }
    ]
  },
  "avocado": {
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["हिंदी डिक्शनरी में इसे 'रुचिरा' नाम दिया गया है, लेकिन आम बोलचाल में इसे सिर्फ 'एवोकाडो' या 'मक्खन फल' (Butter fruit) ही कहा जाता है।"]
      }
    ]
  },
  "passion-fruit": {
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["हिंदी शब्दकोश में इसका नाम 'कृष्णकमल फल' है क्योंकि इसके फूल बिल्कुल कृष्णकमल की तरह होते हैं। हालाँकि, बाज़ार में और आम लोगों के बीच यह 'पैशन फ्रूट' (Passion fruit) के नाम से ही मशहूर है।"]
      }
    ]
  },
  "gooseberry": {
    detailedInfo: [
      {
        title: "नाम में अंतर (Name Differences)",
        points: ["Gooseberry शब्द अक्सर 'Indian Gooseberry' यानी आंवला के लिए इस्तेमाल होता है। इसे करौंदा समझने की गलती न करें, क्योंकि करौंदा को अंग्रेजी में 'Cranberry' या 'Carissa carandas' कहा जाता है।"]
      }
    ]
  },
  "cranberry": {
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["क्रैनबेरी को हिंदी में 'करौंदा' कहा जाता है, लेकिन आज के समय में ज्यादातर लोग इसे इसके अंग्रेजी नाम 'क्रैनबेरी' से ही जानते हैं।"]
      }
    ]
  },
  "quince": {
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["Quince को हिंदी में 'सफरजल' या 'बही' कहा जाता है। कई लोग इसे 'श्रीफल' भी कह देते हैं, लेकिन 'श्रीफल' आमतौर पर नारियल या बेल के लिए इस्तेमाल होता है। इसलिए 'सफरजल' इसके लिए सबसे सही शब्द है।"]
      }
    ]
  },
  "lychee": {
    detailedInfo: [
      {
        title: "स्पेलिंग से जुड़ी जानकारी (Spelling Fact)",
        points: [
          "Lychee (मानक): यह इंटरनेशनल लेवल पर और डिक्शनरी में सबसे ज्यादा इस्तेमाल होने वाली सही स्पेलिंग है।",
          "Litchi (वैकल्पिक): यह स्पेलिंग हमारे भारत (Indian English) में काफी ज्यादा चलती है।",
          "Lichi (बोलचाल): लोग अक्सर इसे उच्चारण के हिसाब से ऐसा लिख देते हैं।"
        ]
      }
    ]
  }
};

for (const slug in updates) {
  const filePath = path.join(dictDir, `word-${slug}.json`);
  if (fs.existsSync(filePath)) {
    const rawContent = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(rawContent);
    const updateData = updates[slug];
    
    // Update only detailedInfo with the new natural language text
    data.detailedInfo = updateData.detailedInfo;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated natural language in word-${slug}.json`);
  }
}
