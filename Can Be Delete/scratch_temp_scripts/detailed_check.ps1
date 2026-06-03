$categoriesFile = "D:\English Vidya\scratch\categories_list.txt"
$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"

# Load categories
$categories = Get-Content $categoriesFile | Where-Object { $_.Trim() -ne "" }
Write-Output "Total categories listed: $($categories.Count)"

# Initialize hashtable for word counts
$categoryWords = @{}
foreach ($c in $categories) {
    $categoryWords[$c] = 0
}

# Function to normalize strings for comparison
function Get-Normalized ($str) {
    if (-not $str) { return "" }
    return ($str.ToLower() -replace '[^a-z0-9]', '')
}

# Normalize categories for quick lookup mapping
$normMap = @{}
foreach ($c in $categories) {
    $norm = Get-Normalized $c
    $normMap[$norm] = $c
}

$files = Get-ChildItem $batchesDir -Filter "*.json" | Where-Object { $_.Name -notlike "master_*" }
Write-Output "Found $($files.Count) JSON files in batches directory"

$totalWords = 0
$invalidFiles = @()

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        if (-not $content.Trim()) { continue }
        $data = ConvertFrom-Json $content -ErrorAction Stop
        
        if ($data -isnot [array]) {
            Write-Output "Warning: $($file.Name) is not a JSON array!"
            $invalidFiles += $file.Name
            continue
        }
        
        foreach ($entry in $data) {
            if ($null -eq $entry -or -not (Get-Member -InputObject $entry -Name "category") -or -not (Get-Member -InputObject $entry -Name "word")) {
                continue
            }
            
            $cat = $entry.category
            $normCat = Get-Normalized $cat
            
            # Match
            if ($normMap.ContainsKey($normCat)) {
                $origCat = $normMap[$normCat]
                $categoryWords[$origCat] += 1
            } else {
                # Try substring matching using pre-normalized keys
                $matched = $false
                foreach ($normC in $normMap.Keys) {
                    if ($normCat.Contains($normC) -or $normC.Contains($normCat)) {
                        $origC = $normMap[$normC]
                        $categoryWords[$origC] += 1
                        $normMap[$normCat] = $origC  # Cache for next time
                        $matched = $true
                        break
                    }
                }
            }
            $totalWords++
        }
    }
    catch {
        Write-Output "Error parsing $($file.Name): $_"
        $invalidFiles += $file.Name
    }
}

# Summarize
$completed = @()
$insufficient = @()
$missing = @()

foreach ($c in $categories) {
    $count = $categoryWords[$c]
    if ($count -ge 80) {
        $completed += [PSCustomObject]@{ Category = $c; Count = $count }
    } elseif ($count -gt 0) {
        $insufficient += [PSCustomObject]@{ Category = $c; Count = $count }
    } else {
        $missing += $c
    }
}

Write-Output ""
Write-Output "--- SUMMARY ---"
Write-Output "Total Words Counted: $totalWords"
Write-Output "Completed Categories (>= 80 words): $($completed.Count)"
Write-Output "Insufficient Categories (< 80 words): $($insufficient.Count)"
Write-Output "Missing Categories (0 words): $($missing.Count)"
if ($invalidFiles.Count -gt 0) {
    Write-Output "Invalid/Corrupted Files: $($invalidFiles -join ', ')"
}

Write-Output ""
Write-Output "--- MISSING CATEGORIES ($($missing.Count)) ---"
for ($i = 0; $i -lt $missing.Count; $i++) {
    Write-Output "$($i + 1). $($missing[$i])"
}

Write-Output ""
Write-Output "--- INSUFFICIENT CATEGORIES ($($insufficient.Count)) ---"
foreach ($c in $insufficient) {
    Write-Output "- $($c.Category) ($($c.Count) words)"
}

# Save missing categories to detailed_missing.txt
$missing | Out-File -FilePath "D:\English Vidya\scratch\detailed_missing.txt" -Encoding utf8
