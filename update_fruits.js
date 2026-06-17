const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'website', 'data', 'dictionary', 'fruits');

const updates = {
  "blueberry": {
    pron: "ब्लूबेरी",
    meaning: "नीलबदरी",
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["ब्लूबेरी (Blueberry) को हिंदी में तकनीकी रूप से 'नीलबदरी' कहा जाता है। हालाँकि, चूँकि यह भारत का मूल फल नहीं है, इसलिए इसे हिंदी और आम बोलचाल में आमतौर पर 'ब्लूबेरी' के नाम से ही जाना जाता है।"]
      },
      {
        title: "स्वास्थ्य लाभ और विशेषताएँ (Health Benefits)",
        points: [
          "सुपरफूड: यह एक बेहतरीन एंटीऑक्सीडेंट, विटामिन C, और फाइबर से भरपूर सुपरफूड है।",
          "त्वचा और हृदय: नियमित सेवन से त्वचा जवान रहती है और दिल की सेहत में सुधार होता है।",
          "स्मृति: यह मस्तिष्क की कार्यप्रणाली और याददाश्त को बढ़ाने में भी काफी मददगार है।"
        ]
      },
      {
        title: "कहाँ से खरीदें? (Where to Buy)",
        points: ["आप इसे सुपरमार्केट्स, ऑनलाइन ग्रोसरी प्लेटफॉर्म्स या अपने नजदीकी फ्रूट मार्केट से आसानी से खरीद सकते हैं।"]
      }
    ]
  },
  "avocado": {
    pron: "एवोकाडो",
    meaning: "रुचिरा",
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["इसे हिंदी शब्दकोशों में 'रुचिरा' कहा जाता है, लेकिन आम बोलचाल में यह 'एवोकाडो' या 'मक्खन फल' (Butter fruit) के नाम से ही सबसे ज्यादा जाना जाता है।"]
      }
    ]
  },
  "passion-fruit": {
    pron: "पैशन फ्रूट",
    meaning: "कृष्णकमल फल",
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["इसे तकनीकी रूप से 'कृष्णकमल फल' कहा जाता है क्योंकि इसके फूल कृष्णकमल के होते हैं, लेकिन बाजार और आम बोलचाल में छात्र और लोग इसे 'पैशन फ्रूट' (Passion fruit) ही कहते हैं।"]
      }
    ]
  },
  "gooseberry": {
    pron: "गूसबेरी",
    meaning: "आंवला",
    detailedInfo: [
      {
        title: "नाम में अंतर (Name Differences)",
        points: ["Gooseberry अक्सर 'Indian Gooseberry' (आंवला) के लिए उपयोग होता है। इसे करौंदा न समझें, करौंदा को 'Cranberry' या 'Carissa carandas' कहा जाता है।"]
      }
    ]
  },
  "cranberry": {
    pron: "क्रैनबेरी",
    meaning: "करौंदा",
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["क्रैनबेरी को हिंदी में 'करौंदा' कहा जाता है, लेकिन ज्यादातर लोग इसे क्रैनबेरी नाम से ही जानते हैं।"]
      }
    ]
  },
  "quince": {
    pron: "क्विंस",
    meaning: "सफरजल",
    detailedInfo: [
      {
        title: "आम बोलचाल में उपयोग (Common Usage)",
        points: ["Quince को हिंदी में 'सफरजल' या 'बही' कहा जाता है। 'श्रीफल' आमतौर पर नारियल या बेल के लिए इस्तेमाल होता है, इसलिए सफरजल इसके लिए सबसे सटीक शब्द है।"]
      }
    ]
  },
  "lychee": {
    pron: "लीची",
    meaning: "लीची",
    detailedInfo: [
      {
        title: "स्पेलिंग से जुड़ी जानकारी (Spelling Fact)",
        points: [
          "Lychee (मानक): यह अंतरराष्ट्रीय स्तर पर और डिक्शनरी में सबसे ज्यादा इस्तेमाल होने वाली स्पेलिंग है।",
          "Litchi (वैकल्पिक): यह स्पेलिंग भारत (Indian English) में काफी प्रचलित है।",
          "Lichi (बोलचाल): यह केवल उच्चारण के आधार पर लिखी जाती है।"
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
    
    // Update basic fields
    data.pron = updateData.pron;
    data.meaning = updateData.meaning;
    
    // Add detailedInfo
    data.detailedInfo = updateData.detailedInfo;
    
    // Attempt to fix garbled Hindi in examples if they look like ` `
    data.usages.forEach(u => {
      u.examples.forEach(ex => {
        if (ex.hi && ex.hi.includes('')) {
            // we can't fully restore it automatically here, 
            // but we can set a fallback placeholder if heavily corrupted
            ex.hi = "[Hindi translation needs update]";
        }
      });
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated word-${slug}.json`);
  }
}
