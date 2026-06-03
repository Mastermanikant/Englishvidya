
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

# Topics dictionary to hold paragraphs
$topics = [ordered]@{
    "General Basics" = @()
    "Noun" = @()
    "Pronoun" = @()
    "Adjective" = @()
    "Verb" = @()
    "Adverb" = @()
    "Preposition" = @()
    "Conjunction" = @()
    "Interjection" = @()
    "Tense" = @()
    "Voice" = @()
    "Narration" = @()
    "Article" = @()
    "Number & Gender" = @()
    "Vocabulary & Word Meanings" = @()
    "Miscellaneous" = @()
}

$currentTopic = "General Basics"

foreach ($fname in $fileNames) {
    $paras = $json.$fname
    if ($null -eq $paras) { continue }

    if ($fname -match "Word meaning") {
        $currentTopic = "Vocabulary & Word Meanings"
    }

    foreach ($para in $paras) {
        $style = $para.Style
        $text = $para.Text.Trim()
        
        if ($text -eq "") { continue }

        # Detect topic changes based on headings or keywords
        if ($style -match "Heading") {
            $tLower = $text.ToLower()
            if ($tLower -match "\bnoun\b") { $currentTopic = "Noun" }
            elseif ($tLower -match "\bpronoun\b") { $currentTopic = "Pronoun" }
            elseif ($tLower -match "\badjective\b") { $currentTopic = "Adjective" }
            elseif ($tLower -match "\bverb\b") { $currentTopic = "Verb" }
            elseif ($tLower -match "\badverb\b") { $currentTopic = "Adverb" }
            elseif ($tLower -match "\bpreposition\b") { $currentTopic = "Preposition" }
            elseif ($tLower -match "\bconjunction\b") { $currentTopic = "Conjunction" }
            elseif ($tLower -match "\binterjection\b") { $currentTopic = "Interjection" }
            elseif ($tLower -match "\btense\b") { $currentTopic = "Tense" }
            elseif ($tLower -match "\bvoice\b") { $currentTopic = "Voice" }
            elseif ($tLower -match "\bnarration\b") { $currentTopic = "Narration" }
            elseif ($tLower -match "\barticle\b|\barticles\b") { $currentTopic = "Article" }
            elseif ($tLower -match "\bnumber\b|\bgender\b") { $currentTopic = "Number & Gender" }
            elseif ($tLower -match "\bword meaning\b|\bvocabulary\b") { $currentTopic = "Vocabulary & Word Meanings" }
        }

        # Deduplication within topic
        $isDuplicate = $false
        foreach ($existing in $topics[$currentTopic]) {
            if ($existing.Text -eq $text -and $existing.Style -eq $style) {
                $isDuplicate = $true
                break
            }
        }

        if (-not $isDuplicate) {
            $topics[$currentTopic] += $para
        }
    }
}

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
foreach ($topicName in $topics.Keys) {
    $paras = $topics[$topicName]
    if ($paras.Count -eq 0) { continue }
    $totalItems += $paras.Count

    Write-Host "Building: $topicName ($($paras.Count) paragraphs)"

    [void]$sb.Append("<div class='section'>")
    [void]$sb.Append("<div class='sec-hdr' onclick='tog(this)'>")
    [void]$sb.Append("<span class='ico'>&#9654;</span>")
    [void]$sb.Append("<h2>$topicName</h2>")
    [void]$sb.Append("<span class='cnt'>$($paras.Count) items</span>")
    [void]$sb.Append("</div>")
    [void]$sb.Append("<div class='sec-body'>")

    foreach ($para in $paras) {
        $style = $para.Style
        $text = Esc($para.Text)

        if ($style -match "Heading1|Heading 1") {
            [void]$sb.Append("<h3 class='h1'>$text</h3>")
        } elseif ($style -match "Heading2|Heading 2") {
            [void]$sb.Append("<h4 class='h2'>$text</h4>")
        } elseif ($style -match "Heading3|Heading 3") {
            [void]$sb.Append("<h5 class='h3'>$text</h5>")
        } elseif ($style -match "List|Bullet|list|bullet") {
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

[System.IO.File]::WriteAllText("d:\English Vidya\final study material.html", $final, [System.Text.Encoding]::UTF8)
Write-Host "Done! Unique Total Paragraphs: $totalItems"
