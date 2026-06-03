
# Read JSON data
$jsonRaw = Get-Content "d:\English Vidya\scratch\grammar_data.json" -Raw -Encoding UTF8
$json = $jsonRaw | ConvertFrom-Json

$fileNames = @(
    "1....English basics part 1.    15,5,26.docx",
    "2.. English basic part 2.docx",
    "3.. basic to advance grammar part 3.docx",
    "4..... Basic to Advanced English_.docx",
    "5.... Basi. To advance english.docx",
    "Word meaning prompt list.docx"
)

$sectionTitles = @(
    "Part 1 - English Basics",
    "Part 2 - English Basics (Advanced)",
    "Part 3 - Basic to Advanced Grammar",
    "Part 4 - Basic to Advanced English",
    "Part 5 - Advanced English",
    "Word Meanings and Vocabulary"
)

function Esc($t) {
    $t = $t -replace '&', '[AMP]'
    $t = $t -replace '<', '&lt;'
    $t = $t -replace '>', '&gt;'
    $t = $t -replace '"', '&quot;'
    $t = $t -replace '\[AMP\]', '&amp;'
    return $t
}

$sb = New-Object System.Text.StringBuilder
$totalItems = 0

for ($i = 0; $i -lt $fileNames.Count; $i++) {
    $fname = $fileNames[$i]
    $title = $sectionTitles[$i]
    $paras = $json.$fname
    if ($null -eq $paras) { continue }
    
    $totalItems += $paras.Count
    Write-Host "Building: $title ($($paras.Count) paragraphs)"

    [void]$sb.Append("<div class='section'>")
    [void]$sb.Append("<div class='sec-hdr' onclick='tog(this)'>")
    [void]$sb.Append("<span class='ico'>&#9654;</span>")
    [void]$sb.Append("<h2>$title</h2>")
    [void]$sb.Append("<span class='cnt'>$($paras.Count) items</span>")
    [void]$sb.Append("</div>")
    [void]$sb.Append("<div class='sec-body'>")

    foreach ($para in $paras) {
        $text = Esc($para.Text)
        if ($text.Trim() -eq "") { continue }

        if ($text.Length -lt 100 -and $text -notmatch "[\.\?]$" -and $text -match "^[A-Za-z0-9]") {
            [void]$sb.Append("<h4 class='h2'>$text</h4>")
        } elseif ($text -match "^[-*•]") {
            [void]$sb.Append("<li>$text</li>")
        } else {
            [void]$sb.Append("<p>$text</p>")
        }
    }

    [void]$sb.Append("</div></div>")
}

$bodyContent = $sb.ToString()

$template = Get-Content "d:\English Vidya\scratch\template.html" -Raw -Encoding UTF8
$final = $template -replace '<!--CONTENT-->', $bodyContent
$final = $final -replace '25,537', $totalItems.ToString()
$final = $final -replace 'Sections: <b>15</b>', "Sections: <b>6</b>"

[System.IO.File]::WriteAllText("d:\English Vidya\final study material.html", $final, [System.Text.Encoding]::UTF8)
Write-Host "Done! Total Paragraphs: $totalItems"
