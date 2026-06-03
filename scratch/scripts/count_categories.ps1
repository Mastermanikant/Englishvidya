$f = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"
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
    Write-Output "Unique Category Count: $($cats.Count)"
    Write-Output ""
    $sortedCats = $cats.GetEnumerator() | Sort-Object Value -Descending
    foreach ($c in $sortedCats) {
        Write-Output "$($c.Name): $($c.Value) words"
    }
} else {
    Write-Output "File not found"
}
