const fs = require('fs');
const path = require('path');

const basePath = 'C:\\Users\\IT CARE SAHARSA\\.gemini\\antigravity\\brain';
const mainId = '72377ccf-a81e-4a7b-9b2e-e96c60b741c1';
const outDir = 'D:\\English Vidya\\website\\data\\grammar\\dictionary_batches';
const finalJsonPath = 'D:\\English Vidya\\website\\data\\grammar\\dictionary_full.json';

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

let allArrays = [];

const dirs = fs.readdirSync(basePath);
for (const dir of dirs) {
    if (dir === mainId) continue;
    
    const logPath = path.join(basePath, dir, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        
        let jsonFound = false;
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const obj = JSON.parse(line);
                if (obj.source === 'MODEL' && obj.tool_calls) {
                    for (const call of obj.tool_calls) {
                        if (call.name === 'send_message' && call.args && call.args.Message) {
                            let msgString = call.args.Message;
                            
                            // It might be a string that contains the JSON
                            if (typeof msgString === 'string') {
                                // Try parsing it in case it's a JSON encoded string
                                try {
                                    // Some agents send stringified json
                                    const parsedOnce = JSON.parse(msgString);
                                    if (typeof parsedOnce === 'string') {
                                        msgString = parsedOnce;
                                    }
                                } catch (e) {}
                                
                                const start = msgString.indexOf('[');
                                const end = msgString.lastIndexOf(']');
                                
                                if (start >= 0 && end > start) {
                                    const jsonArrayString = msgString.substring(start, end + 1);
                                    // Clean up any weird escaping if needed, but JSON.parse should handle it if valid.
                                    try {
                                        // Some stringified jsons have literal \n or \" inside them if they were double escaped
                                        // Let's try parsing directly first
                                        const parsedArray = JSON.parse(jsonArrayString);
                                        
                                        if (Array.isArray(parsedArray)) {
                                            fs.writeFileSync(path.join(outDir, `${dir}.json`), JSON.stringify(parsedArray, null, 2));
                                            allArrays = allArrays.concat(parsedArray);
                                            console.log(`SUCCESS: Extracted ${parsedArray.length} objects for ${dir}`);
                                            jsonFound = true;
                                            break;
                                        }
                                    } catch (e) {
                                        // If parsing fails, try unescaping literal \n and \"
                                        console.log(`WARN: Standard parse failed for ${dir}, trying unescape`);
                                        try {
                                            const unescaped = jsonArrayString.replace(/\\n/g, '').replace(/\\"/g, '"');
                                            const parsedArray = JSON.parse(unescaped);
                                            if (Array.isArray(parsedArray)) {
                                                fs.writeFileSync(path.join(outDir, `${dir}.json`), JSON.stringify(parsedArray, null, 2));
                                                allArrays = allArrays.concat(parsedArray);
                                                console.log(`SUCCESS: Extracted ${parsedArray.length} objects for ${dir} (after unescaping)`);
                                                jsonFound = true;
                                                break;
                                            }
                                        } catch (e2) {
                                            console.log(`FAILED to parse JSON for ${dir}:`, e2.message);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors for individual lines
            }
            if (jsonFound) break;
        }
    }
}

fs.writeFileSync(finalJsonPath, JSON.stringify(allArrays, null, 2));
console.log(`Total objects merged: ${allArrays.length}`);
