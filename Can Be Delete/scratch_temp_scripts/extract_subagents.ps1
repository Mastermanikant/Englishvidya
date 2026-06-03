$subagents = @(
    "bdf7c5f4-d35e-4edc-881b-37d63988b12e",
    "af3712c2-b36f-4029-bee1-f22668a28b5c",
    "53ebb6bb-a815-40fd-8405-6a65512457f8",
    "b06308ef-55f6-4902-8364-34390a7efd12",
    "3fcfc5cb-e88c-4599-825c-397a8b0c8223"
)

$basePath = "C:\Users\IT CARE SAHARSA\.gemini\antigravity\brain"
$outDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

foreach ($id in $subagents) {
    $logPath = "$basePath\$id\.system_generated\logs\transcript.jsonl"
    if (Test-Path $logPath) {
        $outFile = "$outDir\$id.json"
        # We need to read the JSONL and extract the last model output that contains a JSON array
        # This is a bit complex in pure PowerShell, so we'll use a simple regex matching `\[\s*\{.*\}\s*\]`
        $content = Get-Content $logPath -Raw
        if ($content -match '\[\s*\{\s*"word"(?s).*\}\s*\]') {
            $jsonArray = $matches[0]
            Set-Content -Path $outFile -Value $jsonArray -Encoding utf8
            Write-Host "Extracted JSON for $id"
        } else {
            Write-Host "No JSON array found for $id"
        }
    } else {
        Write-Host "Log not found for $id"
    }
}
Write-Host "Extraction complete."
