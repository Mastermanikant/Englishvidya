# -*- coding: utf-8 -*-
import os, sys, re

raw_file = r"D:\01_Websites_and_Content\MMY_Website_Project\06_englishvidya.com\08_Raw_Materials_and_Legacy_Backups\Wordpress_Hostinger_Backup\englishvidya_extracted\Indian_Civilization_and_Culture_Line_by_Line_Pronunciation_and_meaning_and_words_meaning_with_Pronun.html"
target_md = r"D:\01_Websites_and_Content\MMY_Website_Project\06_englishvidya.com\01_Website_Code\src\class-12\indian-civilization-and-culture.md"

with open(raw_file, "r", encoding="utf-8", errors="ignore") as f:
    raw_html = f.read()

sections = re.findall(r'<h[23][^>]*>(.*?)</h[23]>(.*?)(?=<h[23]|$)', raw_html, re.DOTALL | re.IGNORECASE)

def clean_html(html_str):
    text = re.sub(r'<br\s*/?>', '\n', html_str, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def parse_tables(content):
    md_tables = []
    tables = re.findall(r'<table>(.*?)</table>', content, re.DOTALL | re.IGNORECASE)
    for t in tables:
        rows = re.findall(r'<tr>(.*?)</tr>', t, re.DOTALL | re.IGNORECASE)
        table_data = []
        for r in rows:
            cols = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r, re.DOTALL | re.IGNORECASE)
            clean_cols = [clean_html(c).replace('|', '\\|').replace('\n', ' ') for c in cols]
            if clean_cols:
                table_data.append(clean_cols)
        if len(table_data) >= 2:
            header = table_data[0]
            if len(header) < 4:
                header = ["Sr No.", "Word", "Pronunciation", "Hindi Meaning"]
            md_t = "| " + " | ".join(header) + " |\n"
            md_t += "| " + " | ".join(["---"] * len(header)) + " |\n"
            for row in table_data[1:]:
                while len(row) < len(header):
                    row.append("")
                row = row[:len(header)]
                md_t += "| " + " | ".join(row) + " |\n"
            md_tables.append(md_t)
    return md_tables

def extract_paragraphs(content):
    no_table = re.sub(r'<table>.*?</table>', '', content, flags=re.DOTALL | re.IGNORECASE)
    p_tags = re.findall(r'<p[^>]*>(.*?)</p>', no_table, re.DOTALL | re.IGNORECASE)
    cleaned_ps = [clean_html(p) for p in p_tags if clean_html(p)]
    return cleaned_ps

output_md = """---
layout: layouts/article.njk
title: "Indian Civilization and Culture — Class 12th English Chapter 1"
description: "Bihar Board Class 12th English Rainbow Prose Chapter 1: Indian Civilization and Culture by Mahatma Gandhi. Complete Line by Line Hindi explanation, pronunciation, vocabulary words, summary, short & long Q&A, and VVI objective MCQs."
permalink: /class-12/indian-civilization-and-culture/
tags: ["article", "class-12"]
chapterNumber: 1
book: "Rainbow Part 2 (Prose)"
author: "Mahatma Gandhi"
noindex: true
date: 2026-08-17
---

# Indian Civilization and Culture (भारतीय सभ्यता और संस्कृति)
**Author:** Mahatma Gandhi (1869–1948) | **Book:** Rainbow Part 2 (Prose Chapter 1)

---

## 🎯 Chapter Overview (पाठ का परिचय)
यह पाठ राष्ट्रपिता **महात्मा गांधी** द्वारा लिखित एक उत्कृष्ट निबंध है। इसमें गांधीजी भारतीय सभ्यता और पश्चिमी (आधुनिक) सभ्यता के बीच की मौलिक भिन्नता को स्पष्ट करते हैं। गांधीजी का मानना है कि भारतीय सभ्यता नैतिकता, आत्म-संयम और कर्तव्य पथ पर आधारित है, जबकि पश्चिमी सभ्यता केवल भौतिक सुख-सुविधाओं और इच्छाओं के विस्तार को बढ़ावा देती है।

> **💡 Master Manikant Core Logic:**  
> "Civilization is that mode of conduct which points out to man the path of duty." — सभ्यता आचरण का वह रूप है जो मनुष्य को कर्तव्य का मार्ग दिखाता है।

---

## ✍️ About the Author: Mahatma Gandhi (लेखक परिचय)

<div class="space-y-6 my-8">
"""

author_sections = []
chapter_sections = []

for title, content in sections:
    clean_t = re.sub(r'<[^>]+>', '', title).strip()
    if 'author' in clean_t.lower():
        author_sections.append((clean_t, content))
    else:
        chapter_sections.append((clean_t, content))

for title, content in author_sections:
    ps = extract_paragraphs(content)
    tables = parse_tables(content)
    output_md += f"\n### {title}\n\n"
    for p in ps:
        output_md += f"{p}\n\n"
    for t in tables:
        output_md += f"**कठिन शब्द एवं उच्चारण (Vocabulary & Pronunciation):**\n\n{t}\n\n"

output_md += """</div>

---

## 📖 Complete Line-by-Line Study (संपूर्ण पाठ: हिंदी व्याख्या एवं शब्दार्थ)

<div class="space-y-8 my-8">
"""

for title, content in chapter_sections:
    ps = extract_paragraphs(content)
    tables = parse_tables(content)
    output_md += f"\n### {title}\n\n"
    for p in ps:
        output_md += f"{p}\n\n"
    for t in tables:
        output_md += f"**कठिन शब्द एवं उच्चारण (Vocabulary & Pronunciation):**\n\n{t}\n\n"

output_md += """</div>

---

## 📝 Chapter Summary (पाठ का सारांश)

### Summary in English
'Indian Civilization and Culture' is an essay written by Mahatma Gandhi. In this essay, Gandhiji compares Indian civilization with Western civilization. He says that the civilization India has evolved cannot be beaten in the world because it is founded on morality, spiritualism, and self-restraint. 

Our ancestors lived simple lives in villages and were satisfied with small possessions. They kept away from modern machinery and cities because they believed that true happiness lies in a mental condition rather than physical accumulation. Gandhiji warns us not to blindly imitate Western civilization, which is based on material desires.

### सारांश (हिंदी में)
'Indian Civilization and Culture' महात्मा गांधी द्वारा लिखा गया एक अमर निबंध है। इसमें गांधीजी बताते हैं कि भारत की प्राचीन सभ्यता दुनिया की किसी भी सभ्यता से पराजित नहीं हो सकती क्योंकि इसकी नींव सत्य, नैतिकता और आत्म-नियंत्रण पर टिकी है।

हमारे पूर्वज शहरों के बनावटीपन और मशीनों की गुलामी से दूर रहकर गाँवों में शांति और संतोष का जीवन जीते थे। उनका मानना था कि सच्चा सुख मन की एक स्थिति है, न कि भौतिक विलासिता। गांधीजी भारतीय छात्रों को चेतावनी देते हैं कि हमें पश्चिमी सभ्यता के भौतिकवादी चकाचौंध की अंधी नकल नहीं करनी चाहिए, बल्कि अपनी आध्यात्मिक धरोहर को सहेज कर रखना चाहिए।

---

## ❓ Important Questions & Answers (महत्वपूर्ण प्रश्नोत्तर)

### 🔹 Short Answer Questions (2 Marks)

**Q1. How is Indian civilization different from European civilization?**  
**Ans:** Indian civilization elevates the moral being and focuses on spiritual satisfaction and self-control, whereas European civilization privileges materiality and promotes endless physical desires.

**Q2. Why did our ancestors dissuade us from luxuries and pleasures?**  
**Ans:** Our ancestors knew that the mind is a restless bird; the more it gets, the more it wants, and still remains unsatisfied. Therefore, they set a limit to our indulgences to keep us morally sound and genuinely happy.

**Q3. Why did our ancestors prefer villages to cities?**  
**Ans:** Our ancestors saw that large cities were snares and useless encumbrances where gangs of thieves, robbers, and vices flourished, and rich men robbed poor people. Therefore, they were satisfied with simple village life.

**Q4. What is civilization in the real sense of the term according to Gandhiji?**  
**Ans:** According to Gandhiji, civilization in the real sense of the term consists not in the multiplication, but in the deliberate and voluntary restriction of wants.

---

### 🔹 Long Answer Questions (5 Marks)

**Q1. Write a short note on the salient features of Indian Civilization.**  
**Ans:** The salient features of Indian civilization are:
1. **Immovable and Timeless:** While civilizations of Greece, Rome, Egypt, and Babylon perished, Indian civilization remained unshaken through the ages.
2. **Moral Foundation:** It connects good conduct with the performance of duty and observance of morality.
3. **Limitation of Desires:** It promotes contentment and self-restraint over excessive materialism.
4. **Harmony with Nature:** It advocates a simple life connected to roots and agriculture rather than destructive industrial mechanization.

---

## 🎯 VVI Objective MCQs (वस्तुनिष्ठ प्रश्न अभ्यास)

1. **'Indian Civilization and Culture' is written by —**  
   (A) Dr. Zakir Hussain  
   (B) Mahatma Gandhi  
   (C) Manohar Malgonkar  
   (D) Pearl S. Buck  
   *Answer:* **(B) Mahatma Gandhi** (महात्मा गांधी)

2. **Gandhiji used truth and non-violence as chief weapons against the —**  
   (A) French rule  
   (B) British rule  
   (C) American rule  
   (D) Mughal rule  
   *Answer:* **(B) British rule**

3. **"Civilization is that mode of conduct which points out to man the path of duty" is from —**  
   (A) A Marriage Proposal  
   (B) Bharat is My Home  
   (C) Indian Civilization and Culture  
   (D) The Earth  
   *Answer:* **(C) Indian Civilization and Culture**

4. **The mind is a restless _________, the more it gets the more it wants.**  
   (A) dog  
   (B) bird  
   (C) monkey  
   (D) cow  
   *Answer:* **(B) bird** (पक्षी)

5. **Our ancestors were satisfied with small —**  
   (A) towns  
   (B) cities  
   (C) villages  
   (D) provinces  
   *Answer:* **(C) villages** (गाँव)

6. **Pharaohs were rulers of ancient —**  
   (A) Egypt  
   (B) Greece  
   (C) Rome  
   (D) India  
   *Answer:* **(A) Egypt** (मिस्र)

7. **Gandhiji died at the hands of a fanatic on —**  
   (A) 30th January 1948  
   (B) 15th August 1947  
   (C) 2nd October 1869  
   (D) 26th January 1950  
   *Answer:* **(A) 30th January 1948**

8. **'My Experiments with Truth' is the autobiography of —**  
   (A) Jawaharlal Nehru  
   (B) Sardar Patel  
   (C) Mahatma Gandhi  
   (D) Dr. Rajendra Prasad  
   *Answer:* **(C) Mahatma Gandhi**

9. **The tendency of Indian civilization is to elevate the —**  
   (A) immorality  
   (B) material being  
   (C) moral being  
   (D) dishonesty  
   *Answer:* **(C) moral being** (नैतिक चरित्र)

10. **Gandhiji wrote numerous articles for the journal —**  
    (A) The Times of India  
    (B) Young India  
    (C) Modern Review  
    (D) The Statesman  
    *Answer:* **(B) Young India**

---
"""

with open(target_md, "w", encoding="utf-8") as f:
    f.write(output_md)

print("Successfully generated:", target_md)
print("File size:", os.path.getsize(target_md), "bytes")
