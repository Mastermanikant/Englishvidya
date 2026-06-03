$files = Get-ChildItem "d:\English Vidya\scratch\*.md"
$out = "d:\English Vidya\scratch\full_toc.txt"
Clear-Content $out -ErrorAction SilentlyContinue

foreach ($f in $files) {
    Add-Content $out "=== $($f.Name) ==="
    $lines = Get-Content $f.FullName -Encoding UTF8
    foreach ($line in $lines) {
        if ($line -match "^(Topic|PART|Part|Phase|PHASE)\s*\d+") {
            Add-Content $out $line
        }
    }
    Add-Content $out ""
}
