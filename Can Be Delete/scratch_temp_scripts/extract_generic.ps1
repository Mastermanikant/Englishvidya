param(
    [string]$InputFile = "d:\English Vidya\scratch\grammar_data.json",
    [string]$OutputFile,
    [string]$TopicTitle,
    [string]$TopicTitleHi,
    [string]$StartRegex,
    [string]$EndRegex
)

Write-Host "Extracting $TopicTitle..."
$rawData = Get-Content -Path $InputFile -Raw -Encoding UTF8 | ConvertFrom-Json
$lines = $rawData."2.. English basic part 2.docx"

$inSection = $false
$items = @()
$currentItem = $null

$docData = [ordered]@{
    topic = $TopicTitle
    topic_hi = $TopicTitleHi
    introduction = [ordered]@{ text = ""; text_hi = ""; important = "" }
    teacher_note = ""
    types = @()
}

$state = "SEARCHING"

foreach ($lineObj in $lines) {
    $text = $lineObj.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($text) -or $text -eq "---") { continue }

    if ($text -match $StartRegex) {
        $inSection = $true
        $state = "TOPIC_START"
        continue
    }
    
    if ($inSection -and ($text -match $EndRegex)) { break }
    if (-not $inSection) { continue }

    if ($text -match 'Teacher Introduction') { $state = "TEACHER_NOTE"; continue }
    if ($text -match 'English Definition') {
        if ($currentItem) { $state = "ITEM_ENG_DEF" } else { $state = "MAIN_ENG_DEF" }
        continue
    }
    if ($text -match 'Hindi Definition') {
        if ($currentItem) { $state = "ITEM_HI_DEF" } else { $state = "MAIN_HI_DEF" }
        continue
    }
    if ($text -match 'Important Understanding') {
        if ($currentItem) { $state = "ITEM_IMPORTANT" } else { $state = "MAIN_IMPORTANT" }
        continue
    }
    if ($text -match 'Examples') { $state = "ITEM_EXAMPLES"; continue }
    
    # Matching types like "1. Qualitative Adjective" or "1. Transitive Verb"
    if ($text -match '^\d+\.\s+([A-Za-z\s]+)$') {
        if ($currentItem) { $items += $currentItem }
        $currentItem = [ordered]@{
            name = $matches[1].Trim()
            name_hi = ""
            definition = ""
            definition_hi = ""
            important_understanding = ""
            examples = @()
        }
        $state = "ITEM_START"
        continue
    }

    switch ($state) {
        "TEACHER_NOTE" { $docData.teacher_note += "$text " }
        "MAIN_ENG_DEF" { $docData.introduction.text += "$text " }
        "MAIN_HI_DEF" { $docData.introduction.text_hi += "$text " }
        "MAIN_IMPORTANT" { $docData.introduction.important += "$text " }
        "ITEM_START" { if ($text -match '^\((.+)\)$') { $currentItem.name_hi = $matches[1] } }
        "ITEM_ENG_DEF" { $currentItem.definition += "$text " }
        "ITEM_HI_DEF" { $currentItem.definition_hi += "$text " }
        "ITEM_IMPORTANT" { $currentItem.important_understanding += "$text " }
        "ITEM_EXAMPLES" {
            if ($text -match '(.+?)\s*\W+\s*(.+)') {
                $currentItem.examples += [ordered]@{ english = $matches[1].Trim(); hindi = $matches[2].Trim() }
            } elseif ($text -match '^[a-zA-Z\s]+$') {
                $currentItem.examples += [ordered]@{ english = $text; hindi = "" }
            }
        }
    }
}

if ($currentItem) { $items += $currentItem }

$uniqueItems = @()
foreach ($n in $items) {
    if ($n.definition -ne "") { $uniqueItems += $n }
}

$docData.types = $uniqueItems

$jsonString = $docData | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($OutputFile, $jsonString, [System.Text.Encoding]::UTF8)
Write-Host "Saved to $OutputFile"
