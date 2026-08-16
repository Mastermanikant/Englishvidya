# Communication Guidelines (भाषा और संवाद के नियम)

* **Use Normal, Everyday Language:** 
  जब भी छात्रों के लिए कोर्स का कंटेंट (Course Material) लिखें या यूज़र के साथ संवाद (Communication) करें, तो हमेशा बहुत ही आसान, आम बोलचाल वाली भाषा (Normal Hindi/Hinglish) का इस्तेमाल करें। 
* **Avoid Complex Words:** 
  अत्यधिक कठिन हिंदी (जैसे- शुद्ध व्याकरणिक शब्द) या बहुत मुश्किल अंग्रेज़ी शब्दों का इस्तेमाल करने से बचें ताकि "ज़ीरो लेवल" के छात्रों को बात आसानी से समझ में आ जाए।

# File Encoding & Formatting Protection (हिंदी/देवनागरी एनकोडिंग नियम)

* **Strict UTF-8 Encoding on Windows:** 
  Windows पर किसी भी `.md` या कोर्स फ़ाइल को एडिट करते समय हमेशा Explicit `utf-8` एनकोडिंग का ही इस्तेमाल करें (`encoding='utf-8'`)। 
  कभी भी PowerShell Redirection (`>`) या ANSI/CP1252 डिफ़ॉल्ट मोड से फ़ाइल ओवरराइट न करें ताकि हलंत (`्`) या मात्राएँ टूटने से बचाई जा सकें। फ़ाइल एडिट करने के लिए सुरक्षित `replace_file_content` टूल या explicit UTF-8 Python स्क्रिप्ट का उपयोग करें।

# Devanagari Phonics Ordering Rule (ध्वनि अनुक्रम का नियम)

* **Devanagari Natural Sequence for Multi-sound Letters:** 
  जब भी किसी अक्षर (जैसे S, C, G) की एक से ज़्यादा ध्वनियाँ (Sounds) सिखाई जाएँ, तो हिंदी माध्यम के ज़ीरो-लेवल छात्रों की सहूलियत के लिए ध्वनियों का क्रम हमेशा **देवनागरी वर्णमाला के प्राकृतिक क्रम** (जैसे **S = 'स' ➡️ 'श' ➡️ 'ज़'**) में रखें।

# Workspace Backup Strategy (गिट और ज़िप बैकअप नियम)

* **Separate Lightweight Git Tracking from Heavy ZIP Archiving:**
  जब भी प्रोजेक्ट में बैकअप ऑटोमेशन (.bat या स्क्रिप्ट्स) सेट अप करना हो, तो Git Commit और ZIP Archiving को हमेशा दो अलग-अलग टूल में बांटें:
  1. **Git Auto-Backup:** समय अंतराल (5, 15, 30 या 60 मिनट) पर चलने वाला हल्का ऑटो-कमिट टूल (Near-Zero Disk Space), जो काम करते समय हर टेक्स्ट/फ़ाइल बदलाव का हिसाब रखता है।
  2. **Manual ZIP Backup:** केवल यूज़र की इच्छा या बड़े मील के पत्थर (Major Milestones) पर चलने वाला ज़िप आर्काइव टूल, ताकि हार्ड डिस्क स्पेस बेवजह न भरे।

# Windows Batch Scripting & Compression Rules (विंडोज़ स्क्रिप्ट सुरक्षा व स्पीड नियम)

* **Avoid Unescaped Ampersands in Batch Echo:**
  Windows Batch (`.bat`) फ़ाइलों में `echo` टेक्स्ट लिखते समय `&` (Ampersand) का बिना Escape किए उपयोग न करें (`echo text1 & text2` की जगह `echo text1 and text2` या `echo text1 ^& text2` लिखें), ताकि CMD syntax error से बचा जा सके।
* **High-Speed PowerShell Compression:**
  PowerShell से `.zip` बैकअप बनाते समय हमेशा `-CompressionLevel Fastest` फ़्लैग का उपयोग करें ताकि बैकअप प्रोसेस समय 30 सेकंड से घटकर 3-5 सेकंड हो जाए।

# Pattern-Based Word Learning & Mnemonic Strategy (पैटर्न व शब्द विच्छेदन नियम)

* **Mnemonic & Pattern-Based Breakdown:**
  ज़ीरो-लेवल छात्रों को स्पेलिंग या शब्द रटाने की जगह हमेशा पैटर्न और मज़ाकिया विच्छेदन (Word Breakdown) से सिखाएँ:
  - **कम्पाउंड शब्द तोड़ना:** जैसे `man` (आदमी) + `go` (जाना) ➔ **`mango`** (आम)।
  - **साउंड पैटर्न टिप:** जैसे `C/T = श` और `-us = स` ➔ मिलकर अंत में हमेशा **"शस"** बोलेगा।
  - **राइमिंग ग्रुपिंग:** एक जैसे अंत वाले शब्दों (जैसे `-cial` वाले पहले, फिर `-cian` वाले) को क्रम से रखें।

# Devanagari Matra HTML Protection Rule (देवनागरी मात्रा व अनुस्वार HTML सुरक्षा नियम)

* **Keep Consonants and Matras/Bindis Inside Same HTML Tag:**
  हिंदी/देवनागरी शब्दों में रंग (Colors) लगाते समय कभी भी अक्षर (`श`) और उसकी मात्रा (`ि`, `ी`, `े`) या बिंदी (`ं`) को HTML टैग बंद करके अलग न करें (`<font>श</font>ेंट` गलत है)।
  हमेशा पूरे अक्षर+मात्रा को एक साथ टैग में रखें (`<font>शें</font>ट` सही है), ताकि यूनिकोड रेंडरिंग में **डॉटेड गोला (`◌`)** न बने।

# No Complex IPA Symbols in Phonics (सरल देवनागरी ध्वनियाँ)

* **Replace IPA with Simple Devanagari Phonetics:**
  कोर्स में कहीं भी अंतर्राष्ट्रीय ध्वन्यात्मक संकेतों (IPA / International Phonetic Alphabet symbols जैसे `/ɪ/`, `/e/`, `/æ/`, `/ɒ/`, `/eɪ/`) का प्रयोग न करें। ज़ीरो-लेवल हिंदी माध्यम के छात्रों के लिए हमेशा सरल देवनागरी ध्वनियों (जैसे 'इ', 'ए', 'ऐ', 'ऑ', 'एइ', 'आइ') और स्पष्ट उदाहरणों का प्रयोग करें।

# Explicit Devanagari Pronunciation Invariant (हर मुख्य शब्द का देवनागरी उच्चारण)

* **Mandatory Pronunciation for Primary Examples:**
  A से Z की लिस्ट तथा मुख्य उदाहरण पंक्तियों में प्रत्येक अंग्रेजी शब्द के साथ उसका देवनागरी उच्चारण `(उच्चारण)` लिखना अनिवार्य है (जैसे `Boy (बॉय) - लड़का`, `Fire (फ़ायर) - आग`, `House (हाउस) - घर`)। कभी भी उच्चारण छोड़कर सीधे हिंदी अर्थ न लिखें।

# Structured Multi-Sound Pattern Formula (बहु-ध्वनि अक्षर सूत्र नियम)

* **3-Step Rule Formulas for Complex Consonants:**
  जब किसी अक्षर (जैसे C) की स्थिति के अनुसार अलग-अलग ध्वनियाँ बनती हों, तो उसे 3 आसान नियमों (Step-by-step formula) में प्रस्तुत करें:
  - **Soft Sound:** जब e, i, y आए ➔ (जैसे C = 'स')
  - **Hard Sound:** जब e, i, y को छोड़कर दूसरा अक्षर आए ➔ (जैसे C = 'क')
  - **Special Sound:** जब स्वर जोड़ियाँ (ia, ea, ie, io) आएं ➔ (जैसे C = 'श')



