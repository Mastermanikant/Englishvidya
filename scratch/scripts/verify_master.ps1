$f = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"
if (Test-Path $f) {
    try {
        $content = Get-Content $f -Raw -ErrorAction Stop
        $data = ConvertFrom-Json $content -ErrorAction Stop
        if ($data -isnot [array]) {
            Write-Output "Master dictionary is NOT a JSON array!"
        } else {
            Write-Output "Master dictionary is valid. Total entries: $($data.Count)"
        }
    } catch {
        Write-Output "Master dictionary has parse error: $($_.Exception.Message)"
    }
} else {
    Write-Output "Master dictionary does not exist!"
}
