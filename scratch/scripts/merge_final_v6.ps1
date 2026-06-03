$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$outputFile = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"

# Legitimate base files that do not start with a batch prefix
$baseFiles = @("actions.json", "body_health.json", "emotions.json", "nature_time.json", "objects.json", "people.json")

# Find all JSON files in the batches directory
$files = Get-ChildItem -Path $batchesDir -Filter "*.json"

$mergedCount = 0
$totalWordsCount = 0
$allWords = @()

foreach ($f in $files) {
    $name = $f.Name
    
    # Check if file has a legitimate prefix (mp, v2, v3, v4, v5, v6) or is one of the base files
    $isValid = $false
    if ($name -match "^(mp\d+|v2_|v3_|v4_|v5_|v6_)\w+\.json$") {
        $isValid = $true
    } elseif ($baseFiles -contains $name) {
        $isValid = $true
    }
    
    if (-not $isValid) {
        Write-Output "Skipping non-batch or unrecognized file: $name"
        continue
    }
    
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop
        if (-not $content.Trim()) { continue }
        
        $data = ConvertFrom-Json $content -ErrorAction Stop
        
        if ($data -is [array]) {
            $allWords += $data
            $mergedCount++
            $totalWordsCount += $data.Count
            Write-Output "Merged $($f.Name) ($($data.Count) words)"
        } elseif ($null -ne $data) {
            # Single object
            $allWords += $data
            $mergedCount++
            $totalWordsCount += 1
            Write-Output "Merged $($f.Name) (1 word)"
        }
    } catch {
        Write-Output "Error reading/parsing $($f.Name): $_"
    }
}

# Serialize the combined array to the master file
Write-Output "Serializing $totalWordsCount words to $outputFile..."
$jsonString = $allWords | ConvertTo-Json -Depth 10
$jsonString | Set-Content -Path $outputFile -Encoding utf8

Write-Output ""
Write-Output "--- MERGE COMPLETED SUCCESSFULY ---"
Write-Output "Total files merged: $mergedCount"
Write-Output "Total words in master dictionary: $totalWordsCount"
Write-Output "Saved to: $outputFile"
