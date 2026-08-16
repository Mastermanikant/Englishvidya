import os, json, glob

brain_dir = r'C:\Users\IT CARE SAHARSA\.gemini\antigravity-ide\brain'
files = glob.glob(os.path.join(brain_dir, '*', '.system_generated', 'logs', 'transcript_full.jsonl'))

found = False
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fp:
            for line in fp:
                data = json.loads(line)
                data_str = json.dumps(data, ensure_ascii=False)
                if '10 अतिरिक्त अभ्यास शब्द' in data_str:
                    print("\n[SUCCESS] Extracted from:", f)
                    idx = data_str.find('10 अतिरिक्त')
                    print("Snippet:")
                    print(data_str[max(0, idx-50) : idx+250])
                    found = True
                    break
        if found: break
    except Exception as e:
        pass
