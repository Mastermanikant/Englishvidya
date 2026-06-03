$files = @("emotions.json", "nature_time.json", "actions.json", "objects.json", "people.json", "body_health.json")
$allData = @()

foreach ($f in $files) {
    $path = "D:\English Vidya\website\data\grammar\dictionary_batches\" + $f
    if (Test-Path $path) {
        try {
            $content = Get-Content $path -Raw | ConvertFrom-Json
            if ($content -is [array]) {
                $allData += $content
            } else {
                $allData += ,$content
            }
            Write-Host "Merged $f with $($content.Count) items."
        } catch {
            Write-Host "Failed to parse $f"
        }
    } else {
        Write-Host "File not found: $f"
    }
}

$allData | ConvertTo-Json -Depth 10 | Set-Content "D:\English Vidya\website\data\grammar\dictionary_full.json"
Write-Host "Final dictionary saved to dictionary_full.json with $($allData.Count) items."
