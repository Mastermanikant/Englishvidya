$outputFile = "D:\English Vidya\website\data\grammar\master_dictionary_v2.json"
$files = Get-ChildItem -Path "D:\English Vidya\website\data\grammar\dictionary_batches" -Filter "v2_*.json"
$first = $true

Set-Content -Path $outputFile -Value "[" -Encoding UTF8
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $content = $content.Trim()
    if ($content.StartsWith("[")) { $content = $content.Substring(1) }
    if ($content.EndsWith("]")) { $content = $content.Substring(0, $content.Length - 1) }
    
    if (-not $first -and $content.Trim().Length -gt 0) {
        Add-Content -Path $outputFile -Value "," -Encoding UTF8
    }
    
    if ($content.Trim().Length -gt 0) {
        Add-Content -Path $outputFile -Value $content -Encoding UTF8
        $first = $false
    }
}
Add-Content -Path $outputFile -Value "`n]" -Encoding UTF8
Write-Output "Merged $($files.Count) files successfully to $outputFile"
