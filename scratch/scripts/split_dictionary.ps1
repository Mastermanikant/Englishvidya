$ErrorActionPreference = "Stop"
$masterFile = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"
$outDir = "D:\English Vidya\website\data\vocabulary\categories"
$searchIndexFile = "D:\English Vidya\website\data\site\search-index.json"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}
$siteDir = Split-Path $searchIndexFile
if (!(Test-Path $siteDir)) {
    New-Item -ItemType Directory -Force -Path $siteDir | Out-Null
}

Write-Host "Reading master dictionary..."
$json = Get-Content $masterFile -Raw | ConvertFrom-Json

Write-Host "Grouping by category..."
$grouped = $json | Group-Object -Property category

$searchIndex = @()
$totalGroups = $grouped.Count
$count = 0

foreach ($group in $grouped) {
    $catName = $group.Name
    if ([string]::IsNullOrWhiteSpace($catName)) {
        $catName = "uncategorized"
    }
    
    # Sanitize category name for filename
    $safeName = $catName -replace '[^a-zA-Z0-9_-]', '_'
    $safeName = $safeName.ToLower()
    
    $outFile = Join-Path $outDir "$safeName.json"
    
    # Writing categorized file
    $group.Group | ConvertTo-Json -Compress -Depth 10 | Set-Content -Path $outFile -Encoding UTF8
    
    # Add to search index
    foreach ($item in $group.Group) {
        $searchIndex += [PSCustomObject]@{
            w = $item.word
            m = $item.hindi_meaning
            s = $safeName
        }
    }
    $count++
    if ($count % 10 -eq 0) {
        Write-Host "Processed $count / $totalGroups categories..."
    }
}

Write-Host "Writing search index with $($searchIndex.Count) entries..."
$searchIndex | ConvertTo-Json -Compress -Depth 10 | Set-Content -Path $searchIndexFile -Encoding UTF8
Write-Host "Done!"
