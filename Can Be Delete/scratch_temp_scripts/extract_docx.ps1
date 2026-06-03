Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText {
    param([string]$Path)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()

    # Parse XML
    [xml]$doc = $xml

    # Extract text with basic structure
    $nsmgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $nsmgr.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

    $result = @()
    $paragraphs = $doc.SelectNodes("//w:p", $nsmgr)

    foreach ($para in $paragraphs) {
        $style = ""
        $styleNode = $para.SelectSingleNode("w:pPr/w:pStyle", $nsmgr)
        if ($styleNode) { $style = $styleNode.GetAttribute("w:val", "http://schemas.openxmlformats.org/wordprocessingml/2006/main") }

        $runs = $para.SelectNodes("w:r/w:t | w:ins/w:r/w:t", $nsmgr)
        $text = ($runs | ForEach-Object { $_.InnerText }) -join ""
        
        if ($text.Trim() -ne "") {
            $result += [PSCustomObject]@{ Style = $style; Text = $text.Trim() }
        }
    }
    return $result
}

$sourceDir = "d:\English Vidya\Archive\SourceFiles"
$files = @(
    "1....English basics part 1.    15,5,26.docx",
    "2.. English basic part 2.docx",
    "3.. basic to advance grammar part 3.docx",
    "4..... Basic to Advanced English_.docx",
    "5.... Basi. To advance english.docx",
    "Word meaning prompt list.docx"
)

$allData = @{}
foreach ($file in $files) {
    $fullPath = Join-Path $sourceDir $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        $data = Get-DocxText -Path $fullPath
        $allData[$file] = $data
        Write-Host "  -> $($data.Count) paragraphs extracted"
    }
}

# Save as JSON for HTML generation
$allData | ConvertTo-Json -Depth 5 | Out-File "d:\English Vidya\scratch\grammar_data.json" -Encoding UTF8
Write-Host "Done! Saved to grammar_data.json"
