# cleanup_useless_files.ps1
# Finds and moves all useless/duplicate files to an "archive" folder

$baseDir = "D:\English Vidya"
$uselessDir = "$baseDir\archive"
$grammarDir = "$baseDir\website\data\grammar"
$batchesDir = "$grammarDir\dictionary_batches"
$scratchDir = "$baseDir\scratch"

# Create "archive" folder
New-Item -ItemType Directory -Path $uselessDir -Force | Out-Null
New-Item -ItemType Directory -Path "$uselessDir\old_master_versions" -Force | Out-Null
New-Item -ItemType Directory -Path "$uselessDir\uuid_draft_logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$uselessDir\old_partial_dictionaries" -Force | Out-Null
New-Item -ItemType Directory -Path "$uselessDir\scratch_temp_scripts" -Force | Out-Null

$movedCount = 0

# =============================================
# 1. UUID-named draft JSON files in batches/
# =============================================
Write-Host "`n=== Moving UUID draft files from dictionary_batches/ ===" -ForegroundColor Cyan
$uuidFiles = Get-ChildItem -Path $batchesDir -Filter "*.json" | Where-Object {
    $_.Name -match "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$"
}
foreach ($f in $uuidFiles) {
    Move-Item -Path $f.FullName -Destination "$uselessDir\uuid_draft_logs\$($f.Name)" -Force
    Write-Host "  Moved (UUID): $($f.Name)"
    $movedCount++
}

# =============================================
# 2. Old master dictionary versions (superseded by v6)
# =============================================
Write-Host "`n=== Moving old master dictionary versions from grammar/ ===" -ForegroundColor Cyan
$oldMasters = @(
    "master_dictionary.json",
    "master_dictionary_v2.json",
    "master_dictionary_FINAL.json",
    "master_dictionary_FINAL_v3.json",
    "master_dictionary_FINAL_v4.json",
    "master_dictionary_FINAL_v5.json"
)
foreach ($name in $oldMasters) {
    $path = "$grammarDir\$name"
    if (Test-Path $path) {
        Move-Item -Path $path -Destination "$uselessDir\old_master_versions\$name" -Force
        Write-Host "  Moved (old master): $name"
        $movedCount++
    }
}

# =============================================
# 3. Old partial/experimental dictionary files in grammar/
# =============================================
Write-Host "`n=== Moving old partial dictionary files from grammar/ ===" -ForegroundColor Cyan
$oldPartials = @(
    "dictionary.json",
    "dictionary_full.json",
    "dictionary_people.json",
    "foundation.json",
    "real_english.json",
    "mastery.json",
    "advanced_grammar_deep.json"
)
foreach ($name in $oldPartials) {
    $path = "$grammarDir\$name"
    if (Test-Path $path) {
        Move-Item -Path $path -Destination "$uselessDir\old_partial_dictionaries\$name" -Force
        Write-Host "  Moved (old partial): $name"
        $movedCount++
    }
}

# =============================================
# 4. Scratch temporary scripts (one-time use scripts, now done)
# =============================================
Write-Host "`n=== Moving used/temporary scratch scripts ===" -ForegroundColor Cyan
$scratchUseless = @(
    "analyze_part1.ps1",
    "analyze_structure.ps1",
    "build_html.ps1",
    "build_html2.ps1",
    "build_html3.ps1",
    "build_html4.ps1",
    "build_html5.ps1",
    "convert_vocab.js",
    "convert_vocab.ps1",
    "create_md_files.ps1",
    "detailed_check.ps1",
    "detailed_check.py",
    "detailed_mapping_report.ps1",
    "detailed_missing.txt",
    "extract.js",
    "extract_cats.ps1",
    "extract_docx.ps1",
    "extract_foundation.ps1",
    "extract_foundation.py",
    "extract_generic.ps1",
    "extract_json.ps1",
    "extract_json_from_tool.ps1",
    "extract_nouns.ps1",
    "extract_pronouns.ps1",
    "extract_subagents.ps1",
    "full_structure.txt",
    "full_toc.txt",
    "gen_vocab.js",
    "gen_vocab.py",
    "generate.py",
    "generate_sports_vocabulary.py",
    "get_toc.ps1",
    "list_files.ps1",
    "merge_all.ps1",
    "merge_dictionary.ps1",
    "merge_dictionary_v2.ps1",
    "merge_final.ps1",
    "merge_final_v3.ps1",
    "merge_final_v4.ps1",
    "merge_final_v5.ps1",
    "merge_master.ps1",
    "merge_v2.ps1",
    "missing_categories.txt",
    "read_log.ps1",
    "read_log2.ps1",
    "run_extractions.ps1",
    "check_sizes.ps1",
    "check_missing_files.ps1",
    "check_missing_v6_files.ps1",
    "check_completed.ps1",
    "template.html",
    "generate_dei.py",
    "generate_vocabulary.py",
    "build_vocab.py",
    "write_vocab.py",
    "validate_new_files.ps1"
)
foreach ($name in $scratchUseless) {
    $path = "$scratchDir\$name"
    if (Test-Path $path) {
        Move-Item -Path $path -Destination "$uselessDir\scratch_temp_scripts\$name" -Force
        Write-Host "  Moved (scratch): $name"
        $movedCount++
    }
}

# =============================================
# Summary
# =============================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "Total files moved: $movedCount" -ForegroundColor Green
Write-Host "Archive folder: $uselessDir" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Show what remains in key directories
Write-Host "Remaining files in grammar/:" -ForegroundColor Yellow
Get-ChildItem $grammarDir -Filter "*.json" | Select-Object Name, Length | Format-Table -AutoSize

Write-Host "Remaining files in grammar/dictionary_batches/ (count):" -ForegroundColor Yellow
$remaining = (Get-ChildItem $batchesDir -Filter "*.json").Count
Write-Host "  $remaining clean batch files remaining"
