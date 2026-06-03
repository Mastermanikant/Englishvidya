$batchDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$outputFile = "D:\English Vidya\website\data\grammar\master_dictionary.json"

$allWords = @()
Get-ChildItem -Path $batchDir -Filter "*.json" | ForEach-Object {
    try {
        $content = Get-Content $_.FullName -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        if ($content) {
            $allWords += $content
        }
    } catch {
        Write-Warning "Failed to parse JSON in file: $_.Name"
    }
}

$allWords | ConvertTo-Json -Depth 10 | Set-Content $outputFile -Encoding UTF8
Write-Output "Successfully merged $($allWords.Count) words into $outputFile"
