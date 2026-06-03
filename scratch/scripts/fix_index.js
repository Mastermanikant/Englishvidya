const fs = require('fs');
const path = require('path');

const filePath = 'd:\\English Vidya\\website\\index.html';

// Read with UTF-8
let content = fs.readFileSync(filePath, 'utf8');

const target = `            <div class="search-placeholder">
                <p cla                <!-- Gorgeous Neon-Orb Hero -->
                <div class="promo-hero">`;

const replacement = `            <div class="search-placeholder">
                <p class="search-hint">🔍 ऊपर टाइप करें — तुरंत results आएंगे</p>
                <div id="recent-searches-container"></div>
            </div>
        </div>
    </div>

    <!-- 4. MAIN SPA CONTENT AREA -->
    <main class="app-main" id="app-content">

        <!-- ── HOME VIEW (Visible by Default) ── -->
        <div id="view-home" class="spa-view active">
            <div class="promo-home">
                
                <!-- Gorgeous Neon-Orb Hero -->
                <div class="promo-hero">`;

// Replace both CRLF and LF versions
const targetLF = target.replace(/\r\n/g, '\n');
const replacementLF = replacement.replace(/\r\n/g, '\n');

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Found and replaced (CRLF)");
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacementLF);
    console.log("Found and replaced (LF)");
} else {
    // Try a generic line-by-line search to match despite spacing/newline discrepancies
    const targetLines = target.split(/\r?\n/).map(line => line.trim());
    const contentLines = content.split(/\r?\n/);
    let found = false;

    for (let i = 0; i < contentLines.length - 2; i++) {
        if (contentLines[i].trim() === targetLines[0] &&
            contentLines[i+1].trim() === targetLines[1] &&
            contentLines[i+2].trim() === targetLines[2]) {
            
            console.log(`Found match via line comparison at line ${i+1}`);
            contentLines.splice(i, 3, ...replacementLF.split('\n'));
            content = contentLines.join('\n');
            found = true;
            break;
        }
    }

    if (!found) {
        console.error("ERROR: Target string not found in index.html!");
        process.exit(1);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Saved file successfully.");
