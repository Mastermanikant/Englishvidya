$ErrorActionPreference = "Continue"
$mdFiles = @("part1.md", "part2.md", "part3.md", "part4.md", "part5.md")
$outDir = "D:\English Vidya\website\data\grammar\lessons"
$siteDir = "D:\English Vidya\website\data\site"

if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
if (!(Test-Path $siteDir)) { New-Item -ItemType Directory -Force -Path $siteDir | Out-Null }

$articlesIndex = @()

foreach ($file in $mdFiles) {
    $filePath = Join-Path "D:\English Vidya\scratch" $file
    if (!(Test-Path $filePath)) { Continue }
    
    Write-Host "Parsing $file..."
    $content = Get-Content $filePath -Encoding UTF8 -Raw
    
    $pattern = '(?m)^(?:\#+\s*)?(?:Topic|Part)\s+(\d+)[^\w\r\n]+([^\r\n(]+)(?:\(([^)\r\n]+)\))?'
    $topicMatches = [regex]::Matches($content, $pattern)
    Write-Host "Found $($topicMatches.Count) matches in $file"
    
    for ($i = 0; $i -lt $topicMatches.Count; $i++) {
        $m = $topicMatches[$i]
        $partNum = [int]$m.Groups[1].Value
        $titleEn = $m.Groups[2].Value.Trim()
        $titleHi = ""
        if ($m.Groups[3].Success) { $titleHi = $m.Groups[3].Value.Trim() }
        
        Write-Host "  -> Processing Part $partNum : $titleEn"
        
        $startIndex = $m.Index + $m.Length
        $endIndex = $content.Length
        if ($i -lt ($topicMatches.Count - 1)) {
            $endIndex = $topicMatches[$i+1].Index
        }
        $body = $content.Substring($startIndex, $endIndex - $startIndex)
        
        $lesson = @{
            part = $partNum
            title_en = $titleEn
            title_hi = $titleHi
            title = "$titleEn ($titleHi)"
            teacher_note = ""
            definition_en = ""
            definition_hi = ""
            categories = @()
        }
        
        $sections = $body -split '(?m)^---+\s*$'
        foreach ($section in $sections) {
            $lines = @($section.Trim() -split "`n" | Where-Object { $_.Trim() -ne "" })
            if ($lines.Count -gt 0) {
                $header = $lines[0].Trim()
                $text = ""
                if ($lines.Count -gt 1) {
                    $text = ($lines[1..($lines.Count-1)] -join "`n").Trim()
                }
                
                if ($header -match "Teacher Introduction") {
                    $lesson.teacher_note = $text
                }
                elseif ($header -match "English Definition") {
                    $lesson.definition_en = $text
                }
                elseif ($header -match "Hindi Definition") {
                    $lesson.definition_hi = $text
                }
                elseif ($header -match "Simple Classroom Explanation") {
                    $lesson.classroom_explanation = $text
                }
                else {
                    $lesson.categories += @{
                        name = $header
                        intro = $text
                        examples = @()
                    }
                }
            }
        }
        
        if ($lesson.teacher_note -eq "" -and $lesson.categories.Count -eq 0) {
            $lesson.raw_content = $body.Trim()
        }
        
        $slug = ($titleEn -replace '[^a-zA-Z0-9]', '-').ToLower() -replace '-+', '-'
        $slug = $slug.Trim('-')
        
        $articlesIndex += [PSCustomObject]@{
            part = $partNum
            title = $lesson.title
            slug = $slug
        }
        
        $outFile = Join-Path $outDir "part_$partNum.json"
        $lesson | ConvertTo-Json -Depth 10 | Set-Content -Path $outFile -Encoding UTF8
        Write-Host "End of loop for i=$i"
    }
}

Write-Host "Writing articles-index.json..."
$articlesIndex = $articlesIndex | Sort-Object part
$articlesIndex | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $siteDir "articles-index.json") -Encoding UTF8
Write-Host "Done parsing lessons!"
