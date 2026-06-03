$files = Get-ChildItem "D:\English Vidya\website\data\grammar\dictionary_batches" -Filter "v5_*.json"
$corrupted = @()

foreach ($f in $files) {
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop
        if (-not $content.Trim()) {
            $corrupted += "$($f.Name) (empty file)"
            continue
        }
        $data = ConvertFrom-Json $content -ErrorAction Stop
        if ($data -isnot [array]) {
            $corrupted += "$($f.Name) (not a JSON array, got $($data.GetType().Name))"
        }
    } catch {
        $corrupted += "$($f.Name) (parse error: $($_.Exception.Message))"
    }
}

Write-Output "Total v5 Files checked: $($files.Count)"
Write-Output "Corrupted Count: $($corrupted.Count)"
if ($corrupted.Count -gt 0) {
    Write-Output "Errors found in files:"
    foreach ($c in $corrupted) {
        Write-Output " - $c"
    }
} else {
    Write-Output "All 6 Phase 5 files are 100% valid JSON arrays!"
}
