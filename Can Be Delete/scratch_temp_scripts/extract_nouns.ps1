param(
    [string]$InputFile = "d:\English Vidya\scratch\grammar_data.json",
    [string]$OutputFile = "d:\English Vidya\website\data\grammar\nouns.json"
)

Write-Host "Reading JSON data..."
$rawData = Get-Content -Path $InputFile -Raw -Encoding UTF8 | ConvertFrom-Json
$lines = $rawData."2.. English basic part 2.docx"

$inNounSection = $false
$nouns = @()
$currentNoun = $null

$nounDoc = [ordered]@{
    topic = "Noun System Deep Study"
    topic_hi = "संज्ञा प्रणाली का गहन अध्ययन"
    introduction = [ordered]@{ text = ""; text_hi = ""; important = "" }
    teacher_note = ""
    types = @()
}

$state = "SEARCHING"

foreach ($lineObj in $lines) {
    $text = $lineObj.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($text) -or $text -eq "---") { continue }

    if ($text -match 'Part 17.*Noun System Deep Study') {
        $inNounSection = $true
        $state = "TOPIC_START"
        continue
    }
    
    if ($inNounSection -and ($text -match 'Part 18')) { break }
    if (-not $inNounSection) { continue }

    if ($text -eq "Teacher Introduction") { $state = "TEACHER_NOTE"; continue }
    if ($text -eq "English Definition") {
        if ($currentNoun) { $state = "NOUN_ENG_DEF" } else { $state = "MAIN_ENG_DEF" }
        continue
    }
    if ($text -eq "Hindi Definition") {
        if ($currentNoun) { $state = "NOUN_HI_DEF" } else { $state = "MAIN_HI_DEF" }
        continue
    }
    if ($text -eq "Important Understanding") {
        if ($currentNoun) { $state = "NOUN_IMPORTANT" } else { $state = "MAIN_IMPORTANT" }
        continue
    }
    if ($text -eq "Examples") { $state = "NOUN_EXAMPLES"; continue }
    
    if ($text -match '^\d+\.\s+(.+ Noun)$') {
        if ($currentNoun) { $nouns += $currentNoun }
        $currentNoun = [ordered]@{
            name = $matches[1]
            name_hi = ""
            definition = ""
            definition_hi = ""
            important_understanding = ""
            examples = @()
        }
        $state = "NOUN_START"
        continue
    }

    switch ($state) {
        "TEACHER_NOTE" { $nounDoc.teacher_note += "$text " }
        "MAIN_ENG_DEF" { $nounDoc.introduction.text += "$text " }
        "MAIN_HI_DEF" { $nounDoc.introduction.text_hi += "$text " }
        "MAIN_IMPORTANT" { $nounDoc.introduction.important += "$text " }
        "NOUN_START" { if ($text -match '^\((.+)\)$') { $currentNoun.name_hi = $matches[1] } }
        "NOUN_ENG_DEF" { $currentNoun.definition += "$text " }
        "NOUN_HI_DEF" { $currentNoun.definition_hi += "$text " }
        "NOUN_IMPORTANT" { $currentNoun.important_understanding += "$text " }
        "NOUN_EXAMPLES" {
            if ($text -match '(.+?)\s*\W+\s*(.+)') {
                $currentNoun.examples += [ordered]@{ english = $matches[1].Trim(); hindi = $matches[2].Trim() }
            } elseif ($text -match '^[a-zA-Z\s]+$') {
                # Just an English word, assume Hindi comes next or it's just a word
                $currentNoun.examples += [ordered]@{ english = $text; hindi = "" }
            }
        }
    }
}

if ($currentNoun) { $nouns += $currentNoun }

# Clean up types array (remove duplicates or empties)
$uniqueNouns = @()
foreach ($n in $nouns) {
    if ($n.definition -ne "") { $uniqueNouns += $n }
}

$nounDoc.types = $uniqueNouns

Write-Host "Extraction complete. Writing to JSON..."
$jsonString = $nounDoc | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($OutputFile, $jsonString, [System.Text.Encoding]::UTF8)
Write-Host "Done! Saved to $OutputFile"
