$json = Get-Content "d:\English Vidya\scratch\grammar_data.json" -Raw -Encoding UTF8 | ConvertFrom-Json

# Map: JSON key => output filename
$fileMap = @{
    "1....English basics part 1.    15,5,26.docx" = "part1.md"
    "2.. English basic part 2.docx" = "part2.md"
    "3.. basic to advance grammar part 3.docx" = "part3.md"
    "4..... Basic to Advanced English_.docx" = "part4.md"
    "5.... Basi. To advance english.docx" = "part5.md"
    "Word meaning prompt list.docx" = "word_meanings.md"
}

foreach ($key in $fileMap.Keys) {
    $outFile = $fileMap[$key]
    $outPath = "d:\English Vidya\scratch\$outFile"
    $paras = $json.$key
    
    if ($null -eq $paras) {
        Write-Host "SKIP: $key (not found in JSON)"
        continue
    }
    
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# $outFile")
    [void]$sb.AppendLine("")
    
    foreach ($para in $paras) {
        $text = $para.Text
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        
        $trimmed = $text.Trim()
        
        # Keep separators as horizontal rules
        if ($trimmed -eq "---") {
            [void]$sb.AppendLine("---")
            [void]$sb.AppendLine("")
            continue
        }
        
        # Write each line as-is
        [void]$sb.AppendLine($trimmed)
        [void]$sb.AppendLine("")
    }
    
    [System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "Created: $outFile ($($paras.Count) paragraphs)"
}

Write-Host "All files created!"
