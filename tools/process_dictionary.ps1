# Dictionary Processing Script v2 - Fixed
# Fixes: slug collisions, search index size, verification

$ErrorActionPreference = "Stop"
$masterFile = "D:\English Vidya\website\data\grammar\master_dictionary_FINAL_v6.json"
$categoriesDir = "D:\English Vidya\website\data\vocabulary\categories"
$siteDir = "D:\English Vidya\website\data\site"

Write-Host "=== Dictionary Processing Script v2 ===" -ForegroundColor Cyan
Write-Host ""

# Ensure output directories exist
if (-not (Test-Path $categoriesDir)) { New-Item -ItemType Directory -Path $categoriesDir -Force | Out-Null }
if (-not (Test-Path $siteDir)) { New-Item -ItemType Directory -Path $siteDir -Force | Out-Null }

# Read master file
Write-Host "Reading master dictionary..."
$raw = [System.IO.File]::ReadAllText($masterFile, [System.Text.Encoding]::UTF8)
$data = $raw | ConvertFrom-Json
Write-Host "Total entries loaded: $($data.Count)"

# For entries without category, use word_type as fallback
foreach ($entry in $data) {
    if (-not $entry.category -or $entry.category -eq "") {
        if ($entry.word_type) {
            $entry | Add-Member -NotePropertyName "category" -NotePropertyValue $entry.word_type -Force
        } else {
            $entry | Add-Member -NotePropertyName "category" -NotePropertyValue "Uncategorized" -Force
        }
    }
}

# Function to create slug from category name
function Get-Slug {
    param([string]$name)
    $slug = $name.ToLower().Trim()
    $slug = $slug -replace '\s+', '_'
    $slug = $slug -replace '[^a-z0-9_-]', ''
    $slug = $slug -replace '_+', '_'
    $slug = $slug.Trim('_')
    if ($slug -eq "") { $slug = "uncategorized" }
    return $slug
}

# Function to get display name from category
function Get-DisplayName {
    param([string]$name)
    $parts = $name -split '[\s_-]+'
    $result = ($parts | ForEach-Object { 
        if ($_.Length -gt 0) { $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() }
    }) -join ' '
    return $result
}

# Function to assign emoji icon
function Get-CategoryIcon {
    param([string]$cat)
    $c = $cat.ToLower()
    switch -Wildcard ($c) {
        "*verb*"          { return [char]::ConvertFromUtf32(0x1F3C3) }
        "*noun*"          { return [char]::ConvertFromUtf32(0x1F4E6) }
        "*adjective*"     { return [char]::ConvertFromUtf32(0x1F308) }
        "*adverb*"        { return [char]::ConvertFromUtf32(0x26A1) }
        "*pronoun*"       { return [char]::ConvertFromUtf32(0x1F464) }
        "*preposition*"   { return [char]::ConvertFromUtf32(0x27A1) }
        "*conjunction*"   { return [char]::ConvertFromUtf32(0x1F517) }
        "*interjection*"  { return [char]::ConvertFromUtf32(0x2757) }
        "*article*"       { return [char]::ConvertFromUtf32(0x1F4C4) }
        "*determiner*"    { return [char]::ConvertFromUtf32(0x1F50D) }
        "*modal*"         { return [char]::ConvertFromUtf32(0x2699) }
        "*auxiliary*"     { return [char]::ConvertFromUtf32(0x1F527) }
        "*phrasal*"       { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*idiom*"         { return [char]::ConvertFromUtf32(0x1F4A1) }
        "*slang*"         { return [char]::ConvertFromUtf32(0x1F525) }
        "*formal*"        { return [char]::ConvertFromUtf32(0x1F3A9) }
        "*informal*"      { return [char]::ConvertFromUtf32(0x1F60E) }
        "*emotion*"       { return [char]::ConvertFromUtf32(0x2764) }
        "*feel*"          { return [char]::ConvertFromUtf32(0x1F49B) }
        "*food*"          { return [char]::ConvertFromUtf32(0x1F354) }
        "*cloth*"         { return [char]::ConvertFromUtf32(0x1F455) }
        "*body*"          { return [char]::ConvertFromUtf32(0x1F4AA) }
        "*health*"        { return [char]::ConvertFromUtf32(0x1F3E5) }
        "*medical*"       { return [char]::ConvertFromUtf32(0x2695) }
        "*animal*"        { return [char]::ConvertFromUtf32(0x1F43E) }
        "*nature*"        { return [char]::ConvertFromUtf32(0x1F33F) }
        "*plant*"         { return [char]::ConvertFromUtf32(0x1F331) }
        "*weather*"       { return [char]::ConvertFromUtf32(0x26C5) }
        "*time*"          { return [char]::ConvertFromUtf32(0x23F0) }
        "*number*"        { return [char]::ConvertFromUtf32(0x1F522) }
        "*color*"         { return [char]::ConvertFromUtf32(0x1F3A8) }
        "*colour*"        { return [char]::ConvertFromUtf32(0x1F3A8) }
        "*family*"        { return [char]::ConvertFromUtf32(0x1F46A) }
        "*relation*"      { return [char]::ConvertFromUtf32(0x1F91D) }
        "*house*"         { return [char]::ConvertFromUtf32(0x1F3E0) }
        "*home*"          { return [char]::ConvertFromUtf32(0x1F3E0) }
        "*school*"        { return [char]::ConvertFromUtf32(0x1F3EB) }
        "*education*"     { return [char]::ConvertFromUtf32(0x1F393) }
        "*work*"          { return [char]::ConvertFromUtf32(0x1F4BC) }
        "*job*"           { return [char]::ConvertFromUtf32(0x1F477) }
        "*travel*"        { return [char]::ConvertFromUtf32(0x2708) }
        "*transport*"     { return [char]::ConvertFromUtf32(0x1F697) }
        "*sport*"         { return [char]::ConvertFromUtf32(0x26BD) }
        "*music*"         { return [char]::ConvertFromUtf32(0x1F3B5) }
        "*technology*"    { return [char]::ConvertFromUtf32(0x1F4BB) }
        "*tech*"          { return [char]::ConvertFromUtf32(0x1F4BB) }
        "*computer*"      { return [char]::ConvertFromUtf32(0x1F5A5) }
        "*money*"         { return [char]::ConvertFromUtf32(0x1F4B0) }
        "*business*"      { return [char]::ConvertFromUtf32(0x1F4C8) }
        "*law*"           { return [char]::ConvertFromUtf32(0x2696) }
        "*legal*"         { return [char]::ConvertFromUtf32(0x2696) }
        "*science*"       { return [char]::ConvertFromUtf32(0x1F52C) }
        "*math*"          { return [char]::ConvertFromUtf32(0x2795) }
        "*religion*"      { return [char]::ConvertFromUtf32(0x1F54A) }
        "*politic*"       { return [char]::ConvertFromUtf32(0x1F3DB) }
        "*military*"      { return [char]::ConvertFromUtf32(0x1F396) }
        "*war*"           { return [char]::ConvertFromUtf32(0x2694) }
        "*space*"         { return [char]::ConvertFromUtf32(0x1F680) }
        "*ocean*"         { return [char]::ConvertFromUtf32(0x1F30A) }
        "*water*"         { return [char]::ConvertFromUtf32(0x1F4A7) }
        "*fire*"          { return [char]::ConvertFromUtf32(0x1F525) }
        "*earth*"         { return [char]::ConvertFromUtf32(0x1F30D) }
        "*geography*"     { return [char]::ConvertFromUtf32(0x1F5FA) }
        "*communication*" { return [char]::ConvertFromUtf32(0x1F4E2) }
        "*greet*"         { return [char]::ConvertFromUtf32(0x1F44B) }
        "*direction*"     { return [char]::ConvertFromUtf32(0x1F9ED) }
        "*shape*"         { return [char]::ConvertFromUtf32(0x1F536) }
        "*size*"          { return [char]::ConvertFromUtf32(0x1F4CF) }
        "*taste*"         { return [char]::ConvertFromUtf32(0x1F445) }
        "*sound*"         { return [char]::ConvertFromUtf32(0x1F50A) }
        "*material*"      { return [char]::ConvertFromUtf32(0x1F9F1) }
        "*tool*"          { return [char]::ConvertFromUtf32(0x1F6E0) }
        "*furniture*"     { return [char]::ConvertFromUtf32(0x1FA91) }
        "*kitchen*"       { return [char]::ConvertFromUtf32(0x1F37D) }
        "*garden*"        { return [char]::ConvertFromUtf32(0x1F33B) }
        "*farm*"          { return [char]::ConvertFromUtf32(0x1F33E) }
        "*crime*"         { return [char]::ConvertFromUtf32(0x1F46E) }
        "*dance*"         { return [char]::ConvertFromUtf32(0x1F483) }
        "*book*"          { return [char]::ConvertFromUtf32(0x1F4D6) }
        "*write*"         { return [char]::ConvertFromUtf32(0x270D) }
        "*read*"          { return [char]::ConvertFromUtf32(0x1F4D6) }
        "*think*"         { return [char]::ConvertFromUtf32(0x1F4AD) }
        "*mind*"          { return [char]::ConvertFromUtf32(0x1F9E0) }
        "*move*"          { return [char]::ConvertFromUtf32(0x1F3C3) }
        "*action*"        { return [char]::ConvertFromUtf32(0x1F3AC) }
        "*place*"         { return [char]::ConvertFromUtf32(0x1F4CD) }
        "*country*"       { return [char]::ConvertFromUtf32(0x1F30D) }
        "*city*"          { return [char]::ConvertFromUtf32(0x1F3D9) }
        "*market*"        { return [char]::ConvertFromUtf32(0x1F6D2) }
        "*shop*"          { return [char]::ConvertFromUtf32(0x1F6CD) }
        "*beauty*"        { return [char]::ConvertFromUtf32(0x1F484) }
        "*fashion*"       { return [char]::ConvertFromUtf32(0x1F457) }
        "*festival*"      { return [char]::ConvertFromUtf32(0x1F389) }
        "*celebration*"   { return [char]::ConvertFromUtf32(0x1F38A) }
        "*game*"          { return [char]::ConvertFromUtf32(0x1F3AE) }
        "*play*"          { return [char]::ConvertFromUtf32(0x1F3AE) }
        "*child*"         { return [char]::ConvertFromUtf32(0x1F476) }
        "*sleep*"         { return [char]::ConvertFromUtf32(0x1F634) }
        "*daily*"         { return [char]::ConvertFromUtf32(0x2600) }
        "*routine*"       { return [char]::ConvertFromUtf32(0x1F4C5) }
        "*season*"        { return [char]::ConvertFromUtf32(0x1F342) }
        "*fruit*"         { return [char]::ConvertFromUtf32(0x1F34E) }
        "*vegetable*"     { return [char]::ConvertFromUtf32(0x1F966) }
        "*drink*"         { return [char]::ConvertFromUtf32(0x1F964) }
        "*bird*"          { return [char]::ConvertFromUtf32(0x1F426) }
        "*fish*"          { return [char]::ConvertFromUtf32(0x1F41F) }
        "*insect*"        { return [char]::ConvertFromUtf32(0x1F41B) }
        "*flower*"        { return [char]::ConvertFromUtf32(0x1F33A) }
        "*tree*"          { return [char]::ConvertFromUtf32(0x1F333) }
        "*mountain*"      { return [char]::ConvertFromUtf32(0x26F0) }
        "*river*"         { return [char]::ConvertFromUtf32(0x1F3DE) }
        "*construct*"     { return [char]::ConvertFromUtf32(0x1F3D7) }
        "*build*"         { return [char]::ConvertFromUtf32(0x1F3D7) }
        "*photo*"         { return [char]::ConvertFromUtf32(0x1F4F7) }
        "*media*"         { return [char]::ConvertFromUtf32(0x1F4F0) }
        "*news*"          { return [char]::ConvertFromUtf32(0x1F4F0) }
        "*film*"          { return [char]::ConvertFromUtf32(0x1F3AC) }
        "*movie*"         { return [char]::ConvertFromUtf32(0x1F3AC) }
        "*pain*"          { return [char]::ConvertFromUtf32(0x1FA79) }
        "*disaster*"      { return [char]::ConvertFromUtf32(0x1F30B) }
        "*emergency*"     { return [char]::ConvertFromUtf32(0x1F6A8) }
        "*accident*"      { return [char]::ConvertFromUtf32(0x26A0) }
        "*danger*"        { return [char]::ConvertFromUtf32(0x2620) }
        "*report*"        { return [char]::ConvertFromUtf32(0x1F4DD) }
        "*government*"    { return [char]::ConvertFromUtf32(0x1F3DB) }
        "*election*"      { return [char]::ConvertFromUtf32(0x1F5F3) }
        "*civic*"         { return [char]::ConvertFromUtf32(0x1F3D8) }
        "*polic*"         { return [char]::ConvertFromUtf32(0x1F46E) }
        "*court*"         { return [char]::ConvertFromUtf32(0x2696) }
        "*right*"         { return [char]::ConvertFromUtf32(0x2696) }
        "*retail*"        { return [char]::ConvertFromUtf32(0x1F6CD) }
        "*bargain*"       { return [char]::ConvertFromUtf32(0x1F4B2) }
        "*discount*"      { return [char]::ConvertFromUtf32(0x1F4B2) }
        "*bank*"          { return [char]::ConvertFromUtf32(0x1F3E6) }
        "*payment*"       { return [char]::ConvertFromUtf32(0x1F4B3) }
        "*transaction*"   { return [char]::ConvertFromUtf32(0x1F4B3) }
        "*fitness*"       { return [char]::ConvertFromUtf32(0x1F3CB) }
        "*outdoor*"       { return [char]::ConvertFromUtf32(0x1F3D5) }
        "*indoor*"        { return [char]::ConvertFromUtf32(0x1F3AE) }
        "*air*"           { return [char]::ConvertFromUtf32(0x2708) }
        "*accommod*"      { return [char]::ConvertFromUtf32(0x1F3E8) }
        "*sightse*"       { return [char]::ConvertFromUtf32(0x1F4F8) }
        "*logistic*"      { return [char]::ConvertFromUtf32(0x1F4E6) }
        "*literary*"      { return [char]::ConvertFromUtf32(0x1F4DC) }
        "*cinema*"        { return [char]::ConvertFromUtf32(0x1F3AC) }
        "*visual*"        { return [char]::ConvertFromUtf32(0x1F3A8) }
        "*creative*"      { return [char]::ConvertFromUtf32(0x270D) }
        "*dei*"           { return [char]::ConvertFromUtf32(0x1F91D) }
        "*inclus*"        { return [char]::ConvertFromUtf32(0x1F91D) }
        "*justice*"       { return [char]::ConvertFromUtf32(0x2696) }
        "*equity*"        { return [char]::ConvertFromUtf32(0x2696) }
        "*cultur*"        { return [char]::ConvertFromUtf32(0x1F30D) }
        "*empathy*"       { return [char]::ConvertFromUtf32(0x1F49C) }
        "*renew*"         { return [char]::ConvertFromUtf32(0x267B) }
        "*eco*"           { return [char]::ConvertFromUtf32(0x1F33F) }
        "*sustain*"       { return [char]::ConvertFromUtf32(0x267B) }
        "*hedge*"         { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*polite*"        { return [char]::ConvertFromUtf32(0x1F64F) }
        "*soft*"          { return [char]::ConvertFromUtf32(0x1F64F) }
        "*stance*"        { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*vague*"         { return [char]::ConvertFromUtf32(0x1F32B) }
        "*leader*"        { return [char]::ConvertFromUtf32(0x1F451) }
        "*strateg*"       { return [char]::ConvertFromUtf32(0x1F451) }
        "*delegat*"       { return [char]::ConvertFromUtf32(0x1F4CB) }
        "*perform*"       { return [char]::ConvertFromUtf32(0x1F4CA) }
        "*feedback*"      { return [char]::ConvertFromUtf32(0x1F4CA) }
        "*account*"       { return [char]::ConvertFromUtf32(0x1F4CA) }
        "*corpor*"        { return [char]::ConvertFromUtf32(0x1F3E2) }
        "*fake*"          { return [char]::ConvertFromUtf32(0x1F6AB) }
        "*misinform*"     { return [char]::ConvertFromUtf32(0x1F6AB) }
        "*bias*"          { return [char]::ConvertFromUtf32(0x1F9E0) }
        "*cognit*"        { return [char]::ConvertFromUtf32(0x1F9E0) }
        "*verif*"         { return [char]::ConvertFromUtf32(0x2705) }
        "*manipul*"       { return [char]::ConvertFromUtf32(0x1F6AB) }
        "*mindful*"       { return [char]::ConvertFromUtf32(0x1F9D8) }
        "*wellness*"      { return [char]::ConvertFromUtf32(0x1F33F) }
        "*mental*"        { return [char]::ConvertFromUtf32(0x1F9E0) }
        "*coping*"        { return [char]::ConvertFromUtf32(0x1F4AA) }
        "*notation*"      { return [char]::ConvertFromUtf32(0x1F3B6) }
        "*instrument*"    { return [char]::ConvertFromUtf32(0x1F3B8) }
        "*theater*"       { return [char]::ConvertFromUtf32(0x1F3AD) }
        "*theatre*"       { return [char]::ConvertFromUtf32(0x1F3AD) }
        "*edit*"          { return [char]::ConvertFromUtf32(0x270D) }
        "*broadcast*"     { return [char]::ConvertFromUtf32(0x1F4FA) }
        "*press*"         { return [char]::ConvertFromUtf32(0x1F4F0) }
        "*print*"         { return [char]::ConvertFromUtf32(0x1F4F0) }
        "*nutri*"         { return [char]::ConvertFromUtf32(0x1F34E) }
        "*diet*"          { return [char]::ConvertFromUtf32(0x1F957) }
        "*recover*"       { return [char]::ConvertFromUtf32(0x1F4AA) }
        "*hook*"          { return [char]::ConvertFromUtf32(0x1F3A4) }
        "*intro*"         { return [char]::ConvertFromUtf32(0x1F3A4) }
        "*transit*"       { return [char]::ConvertFromUtf32(0x1F504) }
        "*delivery*"      { return [char]::ConvertFromUtf32(0x1F3A4) }
        "*tone*"          { return [char]::ConvertFromUtf32(0x1F3A4) }
        "*diplom*"        { return [char]::ConvertFromUtf32(0x1F54A) }
        "*conflict*"      { return [char]::ConvertFromUtf32(0x1F91D) }
        "*negotiat*"      { return [char]::ConvertFromUtf32(0x1F91D) }
        "*consensus*"     { return [char]::ConvertFromUtf32(0x1F91D) }
        "*discourse*"     { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*grammar*"       { return [char]::ConvertFromUtf32(0x1F4D0) }
        "*filler*"        { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*intensity*"     { return [char]::ConvertFromUtf32(0x26A1) }
        "*necessity*"     { return [char]::ConvertFromUtf32(0x2699) }
        "*logic*"         { return [char]::ConvertFromUtf32(0x1F9E9) }
        "*argument*"      { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*debate*"        { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*fallac*"        { return [char]::ConvertFromUtf32(0x26A0) }
        "*pitfall*"       { return [char]::ConvertFromUtf32(0x26A0) }
        "*opener*"        { return [char]::ConvertFromUtf32(0x1F44B) }
        "*casual*"        { return [char]::ConvertFromUtf32(0x1F60A) }
        "*weekend*"       { return [char]::ConvertFromUtf32(0x1F389) }
        "*plan*"          { return [char]::ConvertFromUtf32(0x1F4C5) }
        "*topic*"         { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*light*"         { return [char]::ConvertFromUtf32(0x2600) }
        "*gadget*"        { return [char]::ConvertFromUtf32(0x1F4F1) }
        "*belonging*"     { return [char]::ConvertFromUtf32(0x1F392) }
        "*stationery*"    { return [char]::ConvertFromUtf32(0x270F) }
        "*sweet*"         { return [char]::ConvertFromUtf32(0x1F36C) }
        "*sour*"          { return [char]::ConvertFromUtf32(0x1F34B) }
        "*bitter*"        { return [char]::ConvertFromUtf32(0x2615) }
        "*savory*"        { return [char]::ConvertFromUtf32(0x1F372) }
        "*umami*"         { return [char]::ConvertFromUtf32(0x1F372) }
        "*spicy*"         { return [char]::ConvertFromUtf32(0x1F336) }
        "*texture*"       { return [char]::ConvertFromUtf32(0x1F445) }
        "*instruct*"      { return [char]::ConvertFromUtf32(0x1F4CB) }
        "*evaluat*"       { return [char]::ConvertFromUtf32(0x1F4CA) }
        "*question*"      { return [char]::ConvertFromUtf32(0x2753) }
        "*pedagog*"       { return [char]::ConvertFromUtf32(0x1F393) }
        "*classroom*"     { return [char]::ConvertFromUtf32(0x1F3EB) }
        "*comput*"        { return [char]::ConvertFromUtf32(0x1F4BB) }
        "*network*"       { return [char]::ConvertFromUtf32(0x1F310) }
        "*internet*"      { return [char]::ConvertFromUtf32(0x1F310) }
        "*hardware*"      { return [char]::ConvertFromUtf32(0x1F5A5) }
        "*security*"      { return [char]::ConvertFromUtf32(0x1F512) }
        "*software*"      { return [char]::ConvertFromUtf32(0x1F4BF) }
        "*context*"       { return [char]::ConvertFromUtf32(0x1F50E) }
        "*inference*"     { return [char]::ConvertFromUtf32(0x1F50E) }
        "*deduct*"        { return [char]::ConvertFromUtf32(0x1F50E) }
        "*etymolog*"      { return [char]::ConvertFromUtf32(0x1F4DC) }
        "*digital*"       { return [char]::ConvertFromUtf32(0x1F4BB) }
        "*data*"          { return [char]::ConvertFromUtf32(0x1F4CA) }
        "*system*"        { return [char]::ConvertFromUtf32(0x2699) }
        "*develop*"       { return [char]::ConvertFromUtf32(0x1F4BB) }
        "*cyber*"         { return [char]::ConvertFromUtf32(0x1F512) }
        "*ui*"            { return [char]::ConvertFromUtf32(0x1F5A5) }
        "*ux*"            { return [char]::ConvertFromUtf32(0x1F5A5) }
        "*content*"       { return [char]::ConvertFromUtf32(0x1F4DD) }
        "*profess*"       { return [char]::ConvertFromUtf32(0x1F4BC) }
        "*road*"          { return [char]::ConvertFromUtf32(0x1F6E3) }
        "*rail*"          { return [char]::ConvertFromUtf32(0x1F682) }
        "*premise*"       { return [char]::ConvertFromUtf32(0x1F9E9) }
        "*proposit*"      { return [char]::ConvertFromUtf32(0x1F9E9) }
        "*connect*"       { return [char]::ConvertFromUtf32(0x1F517) }
        "*truth*"         { return [char]::ConvertFromUtf32(0x2705) }
        "*valid*"         { return [char]::ConvertFromUtf32(0x2705) }
        "*comprehens*"    { return [char]::ConvertFromUtf32(0x1F4D6) }
        "*synthes*"       { return [char]::ConvertFromUtf32(0x1F9EA) }
        "*learn*"         { return [char]::ConvertFromUtf32(0x1F4D6) }
        "*study*"         { return [char]::ConvertFromUtf32(0x1F4D6) }
        "*language*"      { return [char]::ConvertFromUtf32(0x1F4AC) }
        "*uncategorized*" { return [char]::ConvertFromUtf32(0x1F4DA) }
        default           { return [char]::ConvertFromUtf32(0x1F4DA) }
    }
}

# ---- Pre-compute slug for each entry and build slug-based groups ----
Write-Host "Computing slugs and grouping..."

# Build a hashtable: slug -> list of entries, and slug -> display name
$slugGroups = [ordered]@{}
$slugDisplayNames = @{}

foreach ($entry in $data) {
    $catName = $entry.category
    $slug = Get-Slug $catName
    
    if (-not $slugGroups.Contains($slug)) {
        $slugGroups[$slug] = [System.Collections.ArrayList]::new()
        $slugDisplayNames[$slug] = Get-DisplayName $catName
    }
    [void]$slugGroups[$slug].Add($entry)
}

Write-Host "Unique slugs (category files): $($slugGroups.Count)"

# ---- TASK 1: Split by Category ----
Write-Host ""
Write-Host "=== TASK 1: Splitting by Category ===" -ForegroundColor Yellow

# Clear existing category files
Get-ChildItem -Path $categoriesDir -Filter "*.json" -ErrorAction SilentlyContinue | Remove-Item -Force

$totalWritten = 0
$categoryInfo = [System.Collections.ArrayList]::new()

foreach ($slug in $slugGroups.Keys) {
    $entries = $slugGroups[$slug]
    $displayName = $slugDisplayNames[$slug]
    $icon = Get-CategoryIcon $slug
    $filePath = Join-Path $categoriesDir "$slug.json"
    
    # Build JSON manually using .NET serializer for reliability
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($entries | ConvertTo-Json -Depth 10))
    $jsonStr = [System.Text.Encoding]::UTF8.GetString($jsonBytes)
    
    # If only one entry, ConvertTo-Json won't produce array brackets
    if ($entries.Count -eq 1) {
        $jsonStr = "[$jsonStr]"
    }
    
    [System.IO.File]::WriteAllText($filePath, $jsonStr, [System.Text.Encoding]::UTF8)
    $totalWritten += $entries.Count
    
    [void]$categoryInfo.Add([PSCustomObject]@{
        name  = $displayName
        slug  = $slug
        count = $entries.Count
        icon  = $icon
    })
}

Write-Host "Category files created: $($slugGroups.Count)" -ForegroundColor Green
Write-Host "Total entries written: $totalWritten" -ForegroundColor Green

# ---- TASK 2: Create Search Index (compact) ----
Write-Host ""
Write-Host "=== TASK 2: Creating Search Index ===" -ForegroundColor Yellow

# Build search index using StringBuilder for speed, and truncate hindi meaning
$sb = [System.Text.StringBuilder]::new()
[void]$sb.Append('[')

$first = $true
foreach ($entry in $data) {
    if (-not $first) { [void]$sb.Append(',') }
    $first = $false
    
    $w = if ($entry.word) { $entry.word } else { "" }
    # Truncate hindi meaning: take only up to the first parenthesis or 30 chars
    $m = if ($entry.hindi_meaning) { $entry.hindi_meaning } else { "" }
    # Extract just the Hindi script portion (before parentheses)
    if ($m -match '^([^(]+)') {
        $m = $Matches[1].Trim()
    }
    # Cap at 40 chars
    if ($m.Length -gt 40) { $m = $m.Substring(0, 40) }
    
    $s = Get-Slug $entry.category
    
    # Escape JSON strings
    $w = $w -replace '\\', '\\' -replace '"', '\"'
    $m = $m -replace '\\', '\\' -replace '"', '\"'
    $s = $s -replace '\\', '\\' -replace '"', '\"'
    
    [void]$sb.Append("{`"w`":`"$w`",`"m`":`"$m`",`"s`":`"$s`"}")
}
[void]$sb.Append(']')

$searchJson = $sb.ToString()
$searchPath = Join-Path $siteDir "search-index.json"
[System.IO.File]::WriteAllText($searchPath, $searchJson, [System.Text.Encoding]::UTF8)

$searchSize = (Get-Item $searchPath).Length
$searchSizeKB = [math]::Round($searchSize / 1024, 1)
Write-Host "Search index created: $searchPath" -ForegroundColor Green
Write-Host "Search index entries: $($data.Count)"
Write-Host "Search index size: $searchSizeKB KB"

# ---- TASK 3: Create Categories Index ----
Write-Host ""
Write-Host "=== TASK 3: Creating Categories Index ===" -ForegroundColor Yellow

$catIndex = $categoryInfo | Sort-Object -Property name
$catJson = $catIndex | ConvertTo-Json -Depth 5
$catPath = Join-Path $siteDir "categories-index.json"
[System.IO.File]::WriteAllText($catPath, $catJson, [System.Text.Encoding]::UTF8)

$catSize = (Get-Item $catPath).Length
$catSizeKB = [math]::Round($catSize / 1024, 1)
Write-Host "Categories index created: $catPath" -ForegroundColor Green
Write-Host "Categories in index: $($catIndex.Count)"
Write-Host "Categories index size: $catSizeKB KB"

# ---- VERIFICATION ----
Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Cyan

$catFiles = Get-ChildItem -Path $categoriesDir -Filter "*.json"
$verifyTotal = 0
foreach ($f in $catFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $verifyTotal += @($content).Count
}

Write-Host "Category files on disk: $($catFiles.Count)"
Write-Host "Total entries across all category files: $verifyTotal"
Write-Host "Original master file entries: $($data.Count)"

if ($verifyTotal -eq $data.Count) {
    Write-Host "VERIFICATION PASSED: All entries accounted for!" -ForegroundColor Green
} else {
    Write-Host "VERIFICATION FAILED: Mismatch! Expected $($data.Count), got $verifyTotal" -ForegroundColor Red
}

# Validate search-index.json is valid JSON
try {
    $null = [System.IO.File]::ReadAllText($searchPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    Write-Host "Search index JSON: VALID" -ForegroundColor Green
} catch {
    Write-Host "Search index JSON: INVALID - $($_.Exception.Message)" -ForegroundColor Red
}

# Validate categories-index.json is valid JSON
try {
    $null = [System.IO.File]::ReadAllText($catPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    Write-Host "Categories index JSON: VALID" -ForegroundColor Green
} catch {
    Write-Host "Categories index JSON: INVALID - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Master entries:        $($data.Count)"
Write-Host "Category files:        $($catFiles.Count)"
Write-Host "Verified entries:      $verifyTotal"
Write-Host "Search index size:     $searchSizeKB KB"
Write-Host "Categories index size: $catSizeKB KB"
Write-Host "=== DONE ===" -ForegroundColor Cyan
