$content = Get-Content 'D:\English Vidya\Archive\SourceFiles\clean_prompts.txt'
$cats = @()
foreach ($line in $content) {
    if ($line -match '^\d+\.\s+([A-Z][A-Z\s&,-]+(VOCABULARY|WORDS|LANGUAGE))$') {
        $cats += $matches[1].Trim()
    }
}
$cats | Select-Object -Unique | Set-Content 'D:\English Vidya\scratch\categories_list.txt' -Encoding UTF8
