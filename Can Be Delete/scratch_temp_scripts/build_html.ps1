
$json = Get-Content "d:\English Vidya\scratch\grammar_data.json" -Raw -Encoding UTF8 | ConvertFrom-Json

$fileNames = @(
    "1....English basics part 1.    15,5,26.docx",
    "2.. English basic part 2.docx",
    "3.. basic to advance grammar part 3.docx",
    "4..... Basic to Advanced English_.docx",
    "5.... Basi. To advance english.docx",
    "Word meaning prompt list.docx"
)

$sectionTitles = @(
    "Part 1 – English Basics",
    "Part 2 – English Basics (Advanced)",
    "Part 3 – Basic to Advanced Grammar",
    "Part 4 – Basic to Advanced English",
    "Part 5 – Advanced English",
    "Word Meanings & Vocabulary"
)

function Escape-Html($text) {
    $text = $text -replace '&', '&amp;'
    $text = $text -replace '<', '&lt;'
    $text = $text -replace '>', '&gt;'
    $text = $text -replace '"', '&quot;'
    return $text
}

function Build-Section($title, $paragraphs, $idx) {
    $html = "<div class='section' id='sec$idx'>`n"
    $html += "<div class='section-header' onclick='toggleSection(this)'>`n"
    $html += "<span class='section-icon'>&#9654;</span>`n"
    $html += "<h2>$title</h2>`n"
    $html += "<span class='section-count'>$(($paragraphs | Measure-Object).Count) items</span>`n"
    $html += "</div>`n"
    $html += "<div class='section-body' style='display:none'>`n"

    $lastHeading = ""
    $subBuffer = ""
    $subIdx = 0

    foreach ($para in $paragraphs) {
        $style = $para.Style
        $text = Escape-Html($para.Text)

        if ($style -match "Heading1|heading1|Heading 1") {
            if ($subBuffer -ne "") {
                $html += "<div class='subsection' id='sub${idx}_$subIdx'>`n"
                $html += "<div class='sub-header' onclick='toggleSection(this)'>`n"
                $html += "<span class='section-icon'>&#9654;</span>`n"
                $html += "<h3>$lastHeading</h3>`n"
                $html += "</div>`n"
                $html += "<div class='section-body' style='display:none'>$subBuffer</div>`n"
                $html += "</div>`n"
                $subBuffer = ""
                $subIdx++
            }
            $lastHeading = $text
        } elseif ($style -match "Heading2|heading2|Heading 2") {
            $subBuffer += "<h4 class='h2'>$text</h4>`n"
        } elseif ($style -match "Heading3|heading3|Heading 3") {
            $subBuffer += "<h5 class='h3'>$text</h5>`n"
        } elseif ($style -match "List|list|Bullet|bullet") {
            $subBuffer += "<li class='list-item'>$text</li>`n"
        } elseif ($style -match "Table|table") {
            $subBuffer += "<div class='table-row'>$text</div>`n"
        } elseif ($text.Length -gt 200) {
            $subBuffer += "<p class='long-para'>$text</p>`n"
        } else {
            $subBuffer += "<p class='para'>$text</p>`n"
        }
    }

    # flush last sub
    if ($lastHeading -ne "" -and $subBuffer -ne "") {
        $html += "<div class='subsection' id='sub${idx}_$subIdx'>`n"
        $html += "<div class='sub-header' onclick='toggleSection(this)'>`n"
        $html += "<span class='section-icon'>&#9654;</span>`n"
        $html += "<h3>$lastHeading</h3>`n"
        $html += "</div>`n"
        $html += "<div class='section-body' style='display:none'>$subBuffer</div>`n"
        $html += "</div>`n"
    } elseif ($subBuffer -ne "") {
        $html += $subBuffer
    }

    $html += "</div>`n</div>`n"
    return $html
}

$bodyContent = ""
for ($i = 0; $i -lt $fileNames.Count; $i++) {
    $fname = $fileNames[$i]
    $title = $sectionTitles[$i]
    $paras = $json.$fname
    if ($null -ne $paras) {
        Write-Host "Building section: $title ($($paras.Count) paras)"
        $bodyContent += Build-Section $title $paras $i
    }
}

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>English Vidya – Complete Grammar Study Material</title>
<style>
  :root {
    --bg: #0f1117;
    --surface: #1a1d2e;
    --surface2: #252840;
    --accent: #6c63ff;
    --accent2: #ff6584;
    --accent3: #43e97b;
    --text: #e0e0f0;
    --text-muted: #9090b0;
    --border: #2e3154;
    --header-h: 60px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.7;
  }

  /* TOP NAV */
  .topbar {
    position: sticky; top: 0; z-index: 100;
    background: linear-gradient(135deg, #1a1d2e 0%, #252840 100%);
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    height: var(--header-h);
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 2px 20px rgba(108,99,255,0.15);
  }
  .topbar .logo { font-size: 1.4rem; font-weight: 800; background: linear-gradient(90deg,#6c63ff,#ff6584); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .topbar .controls { display:flex; gap:10px; align-items:center; }
  .btn {
    padding: 6px 16px; border-radius: 20px; border: none; cursor: pointer;
    font-size: 13px; font-weight: 600; transition: all 0.2s;
  }
  .btn-outline { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
  .btn-outline:hover { background: var(--accent); color: #fff; }
  .btn-solid { background: var(--accent); color: #fff; }
  .btn-solid:hover { background: #5a52e0; transform: translateY(-1px); }

  /* SEARCH */
  .search-wrap {
    padding: 20px 20px 10px;
    max-width: 900px; margin: 0 auto;
  }
  .search-box {
    width: 100%; padding: 12px 20px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 30px; color: var(--text);
    font-size: 15px; outline: none; transition: border 0.2s;
  }
  .search-box:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }

  /* STATS */
  .stats-bar {
    display: flex; gap: 20px; padding: 10px 20px 20px;
    max-width: 900px; margin: 0 auto; flex-wrap: wrap;
  }
  .stat-chip {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 4px 14px; font-size: 12px;
    color: var(--text-muted);
  }
  .stat-chip span { color: var(--accent); font-weight: 700; }

  /* MAIN CONTAINER */
  .container { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; }

  /* SECTIONS */
  .section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    margin-bottom: 16px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .section:hover { box-shadow: 0 4px 20px rgba(108,99,255,0.12); }

  .section-header, .sub-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; cursor: pointer;
    user-select: none;
    transition: background 0.2s;
  }
  .section-header:hover { background: var(--surface2); }
  .sub-header { padding: 12px 20px; border-top: 1px solid var(--border); background: rgba(108,99,255,0.05); }
  .sub-header:hover { background: rgba(108,99,255,0.12); }

  .section-icon {
    font-size: 11px; color: var(--accent);
    transition: transform 0.3s;
    flex-shrink: 0;
  }
  .section-icon.open { transform: rotate(90deg); }

  .section-header h2 { font-size: 1.1rem; font-weight: 700; flex: 1; }
  .sub-header h3 { font-size: 0.95rem; font-weight: 600; flex: 1; color: var(--text); }
  .section-count {
    font-size: 11px; color: var(--text-muted);
    background: var(--surface2); padding: 2px 10px;
    border-radius: 20px;
  }

  .section-body { padding: 0 20px 16px; }
  .subsection { border-top: 1px solid var(--border); }
  .subsection .section-body { padding: 12px 20px 16px; }

  /* CONTENT STYLES */
  .para, .long-para {
    margin: 8px 0; padding: 8px 12px;
    background: rgba(255,255,255,0.02);
    border-radius: 6px; border-left: 3px solid transparent;
    transition: border-color 0.2s;
  }
  .para:hover, .long-para:hover { border-left-color: var(--accent); }
  .long-para { border-left-color: rgba(108,99,255,0.3); }

  .list-item {
    display: list-item; margin: 5px 0 5px 24px;
    color: var(--text);
  }
  .list-item::marker { color: var(--accent3); }

  h4.h2 {
    margin: 16px 0 8px;
    color: var(--accent);
    font-size: 1rem; font-weight: 700;
    border-bottom: 1px solid var(--border);
    padding-bottom: 4px;
  }
  h5.h3 {
    margin: 12px 0 6px;
    color: var(--accent3);
    font-size: 0.9rem; font-weight: 600;
  }
  .table-row {
    padding: 6px 10px; background: var(--surface2);
    border-radius: 4px; margin: 3px 0;
    font-family: monospace; font-size: 13px;
  }

  /* HIGHLIGHT */
  .highlight { background: rgba(255,220,50,0.25); border-radius: 2px; }

  /* SCROLL TO TOP */
  .scroll-top {
    position: fixed; bottom: 30px; right: 30px;
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--accent); color: #fff;
    border: none; cursor: pointer; font-size: 20px;
    box-shadow: 0 4px 15px rgba(108,99,255,0.4);
    display: none; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .scroll-top:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(108,99,255,0.5); }
  .scroll-top.visible { display: flex; }

  /* PROGRESS */
  .progress-bar {
    position: fixed; top: 0; left: 0; height: 3px;
    background: linear-gradient(90deg, #6c63ff, #ff6584);
    transition: width 0.1s; z-index: 200;
  }
</style>
</head>
<body>

<div class="progress-bar" id="progressBar"></div>

<header class="topbar">
  <div class="logo">&#128218; English Vidya</div>
  <div class="controls">
    <button class="btn btn-outline" onclick="expandAll()">Expand All</button>
    <button class="btn btn-outline" onclick="collapseAll()">Collapse All</button>
    <button class="btn btn-solid" onclick="printPage()">&#128438; Print</button>
  </div>
</header>

<div class="search-wrap">
  <input type="text" class="search-box" id="searchBox" placeholder="&#128269;  Search grammar topics, rules, examples..." oninput="searchContent(this.value)">
</div>

<div class="stats-bar">
  <div class="stat-chip">Sections: <span>6</span></div>
  <div class="stat-chip">Total Paragraphs: <span>25,537</span></div>
  <div class="stat-chip">Parts: <span>5 Grammar + 1 Vocab</span></div>
  <div class="stat-chip">Level: <span>Basic → Advanced</span></div>
</div>

<div class="container" id="mainContent">
$bodyContent
</div>

<button class="scroll-top" id="scrollTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#8679;</button>

<script>
  function toggleSection(header) {
    var icon = header.querySelector('.section-icon');
    var body = header.nextElementSibling;
    if (!body) return;
    var isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    icon.classList.toggle('open', !isOpen);
  }

  function expandAll() {
    document.querySelectorAll('.section-body').forEach(function(b) { b.style.display = 'block'; });
    document.querySelectorAll('.section-icon').forEach(function(i) { i.classList.add('open'); });
  }

  function collapseAll() {
    document.querySelectorAll('.section-body').forEach(function(b) { b.style.display = 'none'; });
    document.querySelectorAll('.section-icon').forEach(function(i) { i.classList.remove('open'); });
  }

  function printPage() { window.print(); }

  // Search
  function searchContent(query) {
    query = query.trim().toLowerCase();
    var paras = document.querySelectorAll('.para, .long-para, .list-item, .table-row, h4.h2, h5.h3');
    if (!query) {
      paras.forEach(function(p) {
        p.innerHTML = p.innerHTML.replace(/<mark class="highlight">([^<]*)<\/mark>/gi, '$1');
        p.style.display = '';
      });
      return;
    }
    paras.forEach(function(p) {
      var text = p.textContent.toLowerCase();
      if (text.includes(query)) {
        p.style.display = '';
        // Show parent sections
        var el = p;
        while (el) {
          if (el.classList && el.classList.contains('section-body')) {
            el.style.display = 'block';
            var icon = el.previousElementSibling && el.previousElementSibling.querySelector('.section-icon');
            if (icon) icon.classList.add('open');
          }
          el = el.parentElement;
        }
        // Highlight
        var re = new RegExp('(' + query.replace(/[.*+?^`${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        p.innerHTML = p.textContent.replace(re, '<mark class="highlight">$1</mark>');
      } else {
        p.style.display = 'none';
      }
    });
  }

  // Scroll progress & top button
  window.addEventListener('scroll', function() {
    var scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
    var btn = document.getElementById('scrollTop');
    btn.classList.toggle('visible', window.scrollY > 400);
  });
</script>
</body>
</html>
"@

$html | Out-File "d:\English Vidya\final study material.html" -Encoding UTF8
Write-Host "HTML file created successfully!"
Write-Host "Size: $((Get-Item 'd:\English Vidya\final study material.html').Length) bytes"
