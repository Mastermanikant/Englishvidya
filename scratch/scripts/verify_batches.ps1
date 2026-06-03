$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$files = Get-ChildItem $batchesDir -Filter "*.json"
$corrupted = @()
$totalEntries = 0

foreach ($f in $files) {
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop
        if (-not $content.Trim()) {
            $corrupted += "$($f.Name) (empty file)"
            continue
        }
        # In PowerShell, ConvertFrom-Json can parse JSON strings.
        # We use -Depth 100 to ensure deep nesting doesn't fail.
        $data = ConvertFrom-Json $content -ErrorAction Stop
        if ($data -isnot [array]) {
            # Sometimes single object is returned if it's not an array, but all our batch files must be arrays.
            $corrupted += "$($f.Name) (not a JSON array, got $($data.GetType().Name))"
        } else {
            $totalEntries += $data.Count
        }
    } catch {
        $corrupted += "$($f.Name) (parse error: $($_.Exception.Message))"
    }
}

Write-Output ""
Write-Output "--- CHECK SUMMARY ---"
Write-Output "Total JSON Files Checked: $($files.Count)"
Write-Output "Total Valid Entries: $totalEntries"
Write-Output "Corrupted Files Count: $($corrupted.Count)"

if ($corrupted.Count -gt 0) {
    Write-Output ""
    Write-Output "Corrupted Files Details:"
    foreach ($c in $corrupted) {
        Write-Output " - $c"
    }
} else {
    Write-Output "All batch files are 100% valid JSON arrays!"
}
