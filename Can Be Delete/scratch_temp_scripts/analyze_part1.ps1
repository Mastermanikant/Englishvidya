$f = "d:\English Vidya\scratch\part1.md"
$lines = Get-Content $f -Encoding UTF8
$output = @()

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
        $output += "Line $($i+1): $line"
    }
}

$output | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Total Part 1 lines: $($lines.Count)"
Write-Host "Total structural headings: $($output.Count)"
