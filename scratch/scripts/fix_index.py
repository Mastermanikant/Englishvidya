import io

path = r"d:\English Vidya\website\index.html"

# Read with UTF-8
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <div class="search-placeholder">
                <p cla                <!-- Gorgeous Neon-Orb Hero -->
                <div class="promo-hero">"""

replacement = """            <div class="search-placeholder">
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
                <div class="promo-hero">"""

# Replace both CRLF and LF versions
target_lf = target.replace("\r\n", "\n")
replacement_lf = replacement.replace("\r\n", "\n")

if target in content:
    content = content.replace(target, replacement)
    print("Found and replaced (CRLF)")
elif target_lf in content:
    content = content.replace(target_lf, replacement_lf)
    print("Found and replaced (LF)")
else:
    # Try generic line ending split search
    target_clean = "\n".join([line.strip() for line in target.splitlines()])
    content_lines = content.splitlines()
    found = False
    for i in range(len(content_lines) - 2):
        chunk = "\n".join([content_lines[i].strip(), content_lines[i+1].strip(), content_lines[i+2].strip()])
        if chunk == target_clean:
            # We found the index where the broken part starts!
            # Let's replace the lines
            print(f"Found match via clean line comparison at line {i+1}")
            # Let's reconstruct
            before = "\n".join(content_lines[:i])
            after = "\n".join(content_lines[i+3:])
            content = before + "\n" + replacement_lf + "\n" + after
            found = True
            break
    if not found:
        print("ERROR: Target string not found in index.html!")

# Save with UTF-8
with io.open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print("Saved file successfully.")
