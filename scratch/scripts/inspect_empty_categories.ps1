$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$files = Get-ChildItem -Path $batchesDir -Filter "*.json"

$filesWithNullCat = @{}

foreach ($f in $files) {
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop
        if (-not $content.Trim()) { continue }
        $data = ConvertFrom-Json $content
        $nullCount = 0
        if ($data -is [array]) {
            foreach ($item in $data) {
                if ($null -eq $item.category -or [string]::IsNullOrEmpty($item.category)) {
                    $nullCount++
                }
            }
            if ($nullCount -gt 0) {
                $filesWithNullCat[$f.Name] = "$nullCount / $($data.Count) entries have null category"
            }
        }
    } catch {
        # ignore
    }
}

Write-Output "Files with missing/empty category fields:"
foreach ($key in $filesWithNullCat.Keys) {
    $val = $filesWithNullCat[$key]
    Write-Output " - $key : $val"
}
