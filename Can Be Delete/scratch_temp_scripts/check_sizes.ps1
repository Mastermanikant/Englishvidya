$files = Get-ChildItem "d:\English Vidya\scratch\*.md"
foreach ($f in $files) {
    $lines = (Get-Content $f.FullName -Encoding UTF8).Count
    $sizeKB = [math]::Round($f.Length / 1024, 1)
    Write-Host "$($f.Name) => $sizeKB KB, $lines lines"
}
