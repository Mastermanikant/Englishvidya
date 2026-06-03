# Read all MD files and extract topic headings to understand the full scope
$files = @(
    "d:\English Vidya\scratch\part1.md",
    "d:\English Vidya\scratch\part2.md",
    "d:\English Vidya\scratch\part3.md",
    "d:\English Vidya\scratch\part4.md",
    "d:\English Vidya\scratch\part5.md",
    "d:\English Vidya\scratch\word_meanings.md"
)

$output = @()
foreach ($f in $files) {
    $fname = [System.IO.Path]::GetFileName($f)
    $lines = Get-Content $f -Encoding UTF8
    $lineCount = $lines.Count
    $output += ""
    $output += "========================================="
    $output += "FILE: $fname ($lineCount lines)"
    $output += "========================================="
    
    # Extract topics, parts, phases, and major headings
    $topicCount = 0
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i].Trim()
        if ($line -match "^(Topic|TOPIC)\s+\d+" -or 
            $line -match "^(PART|Part)\s+\d+" -or 
            $line -match "^(PHASE|Phase)\s+\d+" -or
            $line -match "^={5,}" -or
            $line -match "^(MODULE|Module)\s+\d+" -or
            $line -match "^#\s+" -or
            $line -match "^(INDEX|SUMMARY|TABLE OF CONTENTS)" -or
            $line -match "^(SECTION|Section)\s+\d+") {
            $output += "  Line $($i+1): $line"
            $topicCount++
        }
    }
    $output += "  --- Found $topicCount structural headings ---"
}

$output | Out-File "d:\English Vidya\scratch\full_structure.txt" -Encoding UTF8
Write-Host "Structure analysis complete. Written to full_structure.txt"
Write-Host "Total lines in output: $($output.Count)"
