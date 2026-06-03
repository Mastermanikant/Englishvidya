$json = Get-Content "d:\English Vidya\scratch\grammar_data.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$json.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $count = $_.Value.Count
    Write-Host "$name => $count paragraphs"
}
