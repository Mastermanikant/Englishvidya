$ErrorActionPreference = "Stop"

$filePath = "d:\English Vidya\scratch\part1.md"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Regex to match Topic pattern
$pattern = '(?m)^Topic\s+(\d+[A-Z]?)\s+[—\-]+\s+([^\n\(]+)(?:\n\n)?(?:\(([^\)]+)\))?'
$matches = [regex]::Matches($content, $pattern)

$topics = @()

for ($i = 0; $i -lt $matches.Count; $i++) {
    $match = $matches[$i]
    $num = $match.Groups[1].Value.Trim()
    $engName = $match.Groups[2].Value.Trim()
    $hiName = $match.Groups[3].Value.Trim()

    if ([string]::IsNullOrWhiteSpace($hiName)) {
        # Check next few lines for hindi name in parens
        $start = $match.Index + $match.Length
        $length = [math]::Min(100, $content.Length - $start)
        $nextStr = $content.Substring($start, $length)
        if ($nextStr -match '^\((.*?)\)') {
            $hiName = $matches.Groups[1].Value.Trim()
        } else {
            $hiName = ""
        }
    }

    $startPos = $match.Index + $match.Length
    $endPos = if ($i + 1 -lt $matches.Count) { $matches[$i+1].Index } else { $content.Length }

    $topicContent = $content.Substring($startPos, $endPos - $startPos).Trim()
    
    $sectionsRaw = $topicContent -split '(?m)^---$' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    $introduction = @{}
    $types = @()

    foreach ($sec in $sectionsRaw) {
        $sec = $sec.Trim()
        if ([string]::IsNullOrWhiteSpace($sec)) { continue }

        $lines = $sec -split '\r?\n' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        if ($lines.Count -eq 0) { continue }

        $heading = $lines[0].Trim()
        $body = ($lines[1..($lines.Count - 1)] -join "`n").Trim()

        if ($body -match '(?m)^\d+\.' -or $heading -match 'Types|Main Parts') {
            $typeObj = @{}
            $typeObj[$heading] = $body
            $types += $typeObj
        } else {
            $introduction[$heading] = $body
        }
    }

    $topicObj = @{
        num = $num
        topic = $engName
        topic_hi = $hiName
        introduction = $introduction
        types = $types
    }
    $topics += $topicObj
}

$foundation = $topics | Where-Object { [int]$_.num -ge 1 -and [int]$_.num -le 6 }
$phonics = $topics | Where-Object { [int]$_.num -ge 7 -and [int]$_.num -le 11 }
$wordSentence = $topics | Where-Object { $_.num -match '^(1[2-6]|14A)$' }

$outDir = "d:\English Vidya\website\data\grammar"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$foundation | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $outDir "foundation.json") -Encoding UTF8
$phonics | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $outDir "phonics.json") -Encoding UTF8
$wordSentence | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $outDir "word_sentence.json") -Encoding UTF8

Write-Host "Successfully created foundation.json, phonics.json, and word_sentence.json"
