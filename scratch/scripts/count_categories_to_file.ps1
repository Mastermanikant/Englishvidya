$f = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"
$outPath = "D:\English Vidya\scratch\categories_summary.txt"
if (Test-Path $f) {
    $content = Get-Content $f -Raw
    $data = ConvertFrom-Json $content
    $cats = @{}
    foreach ($entry in $data) {
        $c = $entry.category
        if ($null -eq $c -or [string]::IsNullOrEmpty($c)) {
            $c = "Uncategorized"
        }
        if ($cats.ContainsKey($c)) {
            $cats[$c]++
        } else {
            $cats[$c] = 1
        }
    }
    
    $out = @()
    $out += "Unique Category Count: $($cats.Count)"
    $out += ""
    $sortedCats = $cats.GetEnumerator() | Sort-Object Value -Descending
    foreach ($c in $sortedCats) {
        $out += "$($c.Name): $($c.Value) entries"
    }
    
    # Write as UTF-8 file
    $out | Out-File -FilePath $outPath -Encoding UTF8
    Write-Output "Successfully wrote categories summary to $outPath"
} else {
    Write-Output "File not found"
}
