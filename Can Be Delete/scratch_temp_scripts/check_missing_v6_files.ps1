$expected = @(
  'v6_arts_literature.json', 'v6_music_performing.json', 'v6_news_media.json',
  'v6_media_bias.json', 'v6_workplace_diplomacy.json', 'v6_leadership_accountability.json',
  'v6_public_speaking.json', 'v6_mental_wellbeing.json', 'v6_nutrition_lifestyle.json',
  'v6_diversity_inclusion.json', 'v6_environmental_sustainability.json', 'v6_hedging_softeners.json'
)

$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$missing = @()

foreach ($f in $expected) {
    $path = Join-Path $batchesDir $f
    if (-not (Test-Path $path)) {
        $missing += $f
    } else {
        $len = (Get-Item $path).Length
        if ($len -eq 0) {
            $missing += ($f + " (empty)")
        }
    }
}

Write-Output "Total Phase 6 Expected: $($expected.Count)"
Write-Output "Missing Count: $($missing.Count)"
if ($missing.Count -gt 0) {
    Write-Output "Missing/Empty Files:"
    foreach ($m in $missing) {
        Write-Output " - $m"
    }
} else {
    Write-Output "All 12 files exist!"
}
