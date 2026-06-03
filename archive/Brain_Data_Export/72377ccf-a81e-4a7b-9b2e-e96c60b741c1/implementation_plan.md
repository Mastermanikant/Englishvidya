# संपूर्ण बैकएंड और डिक्शनरी निर्माण योजना (Final Backend Phase)

यह योजना उन सभी कार्यों को बुद्धिमानी (wisely and smartly) से पूरा करने के लिए है, जो Gemini (Backend) के हिस्से में आते हैं। हम Claude (Frontend/UI) का कोई काम नहीं करेंगे। चूँकि काम बहुत बड़ा है, हम इसे **Multiple Agents** (Subagents) में बाँटेंगे ताकि यह तेज़ी और सटीकता से हो सके।

> [!IMPORTANT]
> **Approval Required (आपकी मंज़ूरी)**
> चूँकि इस काम में हज़ारों शब्द (Dictionary) और बहुत सारे नियम (Advanced Grammar) AI द्वारा जनरेट और पार्स किए जाने हैं, इसलिए काम शुरू करने से पहले कृपया इस योजना को पढ़ें और अपनी अनुमति दें।

## 1. Foundation Parser Agent (बुनियादी नियम)
**लक्ष्य:** `part1.md` में मौजूद बुनियादी विषयों को JSON में बदलना।
* Topics 1-6 (Language & Grammar Basics)
* Topics 7-11 (Sound Foundation, Vowels, Consonants, Phonics)
* Topics 12-16 (Word, Sentence, Parts of Speech Overview)
* **Action:** एक Subagent इन सबको `foundation.json` और `phonics.json` में एक्सट्रैक्ट करेगा।

## 2. Advanced Grammar & Mastery Agent (उच्च-स्तरीय नियम)
**लक्ष्य:** `part2.md`, `part3.md`, `part4.md` और `part5.md` के एडवांस्ड टॉपिक्स को JSON में बदलना।
* Part 30-31 (Voice, Narration, Conditionals)
* Part 32-48 (Spoken English, Idioms, AI, Teaching)
* Part 49-70 (IELTS, Business, Content Creator)
* **Action:** दूसरा Subagent इन सबको `advanced_grammar.json`, `mastery.json` आदि में एक्सट्रैक्ट करेगा।

## 3. The Dictionary Agents (स्मार्ट डिक्शनरी - 3 Subagents)
**लक्ष्य:** `word_meanings.md` के रिसर्च प्रॉम्ट्स के आधार पर पूरी डिक्शनरी का डेटा जनरेट करना।
* **Wikipedia Image Integration:** जहाँ भी शब्द को समझाने के लिए चित्र (image) की ज़रूरत होगी, वहाँ हम `wikipedia.org` या `wikimedia.org` के publicly available, stable URLs का इस्तेमाल करेंगे।
* **Hindi Meanings & Real-Life Usage:** हर शब्द का सटीक हिंदी अर्थ, असली ज़िंदगी का उपयोग (real-life use), और collocations शामिल होंगे।
* **Action:** काम बड़ा होने के कारण 3 अलग-अलग Subagents एक साथ काम करेंगे:
  - Agent A: Daily-Life & Core Vocabulary
  - Agent B: Emotional & Internet Vocabulary
  - Agent C: Professional & Academic Vocabulary
* ये तीनों Agents मिलकर एक विशाल `dictionary.json` तैयार करेंगे।

## Verification Plan (जाँच प्रक्रिया)
1. **JSON Validation:** सभी एक्सट्रैक्ट की गई फाइलों को चेक किया जाएगा कि क्या वे सही JSON फॉर्मेट में हैं।
2. **Wikipedia Links Check:** यह सुनिश्चित किया जाएगा कि इस्तेमाल किए गए Image URLs काम कर रहे हैं (Broken Links न हों)।
3. **Hindi Updates:** जैसे ही हर Agent अपना काम पूरा करेगा, मैं आपको हिंदी (देवनागरी) में अपडेट दूँगा कि कौन-सी फाइल बन गई है।

> [!TIP]
> क्या मैं इन **5 Subagents** को एक साथ काम पर लगा दूँ? अगर आप तैयार हैं तो बस "हाँ (Yes)" कहें।
