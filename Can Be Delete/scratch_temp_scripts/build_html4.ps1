
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

$topics = [ordered]@{
    "General Basics" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Noun" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Pronoun" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Adjective" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Verb" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Adverb" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Preposition" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Conjunction" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Interjection" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Tense" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Voice" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Narration" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Article" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Number & Gender" = New-Object System.Collections.Generic.List[PSCustomObject]
    "Vocabulary & Word Meanings" = New-Object System.Collections.Generic.List[PSCustomObject]
}

$seenSets = @{}
foreach ($k in $topics.Keys) {
    $seenSets[$k] = New-Object System.Collections.Generic.HashSet[string]
}

$currentTopic = "General Basics"

foreach ($fname in $fileNames) {
    $paras = $json.$fname
    if ($null -eq $paras) { continue }

    if ($fname -match "Word meaning") {
        $currentTopic = "Vocabulary & Word Meanings"
    } else {
        $currentTopic = "General Basics" # Reset for new file
    }

    foreach ($para in $paras) {
        $style = $para.Style
        $text = $para.Text.Trim()
        
        if ($text -eq "") { continue }

        # Topic detection logic
        if ($text.Length -lt 100 -and $text -notmatch "[\.\?]$") {
            $tLower = $text.ToLower()
            if ($tLower -match "\bnoun\b" -and $tLower -notmatch "\bpronoun\b") { $currentTopic = "Noun" }
            elseif ($tLower -match "\bpronoun\b") { $currentTopic = "Pronoun" }
            elseif ($tLower -match "\badjective\b") { $currentTopic = "Adjective" }
            elseif ($tLower -match "\bverb\b" -and $tLower -notmatch "\badverb\b") { $currentTopic = "Verb" }
            elseif ($tLower -match "\badverb\b") { $currentTopic = "Adverb" }
            elseif ($tLower -match "\bpreposition\b") { $currentTopic = "Preposition" }
            elseif ($tLower -match "\bconjunction\b") { $currentTopic = "Conjunction" }
            elseif ($tLower -match "\binterjection\b") { $currentTopic = "Interjection" }
            elseif ($tLower -match "\btense\b") { $currentTopic = "Tense" }
            elseif ($tLower -match "\bvoice\b") { $currentTopic = "Voice" }
            elseif ($tLower -match "\bnarration\b") { $currentTopic = "Narration" }
            elseif ($tLower -match "\barticle\b|\barticles\b") { $currentTopic = "Article" }
            elseif ($tLower -match "\bnumber\b|\bgender\b") { $currentTopic = "Number & Gender" }
        }

        # Deduplication using HashSet (O(1) lookup)
        if (-not $seenSets[$currentTopic].Contains($text)) {
            $seenSets[$currentTopic].Add($text) > $null
            $topics[$currentTopic].Add($para)
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

    Write-Host "Building: $topicName ($($paras.Count) unique paragraphs)"

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

        # Style heuristics since docx styles were lost
        if ($text.Length -lt 100 -and $text -notmatch "[\.\?]$" -and $text -match "^[A-Z0-9]") {
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
$final = $final -replace 'Sections: <b>6</b>', "Sections: <b>$($topics.Keys.Where({$topics[$_].Count -gt 0}).Count)</b>"

[System.IO.File]::WriteAllText("d:\English Vidya\final study material.html", $final, [System.Text.Encoding]::UTF8)
Write-Host "Done! Unique Total Paragraphs: $totalItems"
