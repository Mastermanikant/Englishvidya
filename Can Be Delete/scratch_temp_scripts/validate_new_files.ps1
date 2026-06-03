# validate_new_files.ps1
$batchDir = "D:\English Vidya\website\data\grammar\dictionary_batches"

$files = @("v6_diversity_inclusion.json", "v6_environmental_sustainability.json")

foreach ($f in $files) {
    $path = "$batchDir\$f"
    try {
        $data = Get-Content $path -Raw | ConvertFrom-Json
        Write-Host "VALID: $f - $($data.Count) entries"
    } catch {
        Write-Host "ERROR: $f - $_"
    }
}
