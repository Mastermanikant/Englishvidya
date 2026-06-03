$subagents = @(
    "bdf7c5f4-d35e-4edc-881b-37d63988b12e",
    "af3712c2-b36f-4029-bee1-f22668a28b5c",
    "53ebb6bb-a815-40fd-8405-6a65512457f8",
    "b06308ef-55f6-4902-8364-34390a7efd12",
    "3fcfc5cb-e88c-4599-825c-397a8b0c8223"
)

$basePath = "C:\Users\IT CARE SAHARSA\.gemini\antigravity\brain"
$outDir = "D:\English Vidya\website\data\grammar\dictionary_batches"

foreach ($id in $subagents) {
    $logPath = "$basePath\$id\.system_generated\logs\transcript.jsonl"
    if (Test-Path $logPath) {
        $outFile = "$outDir\$id.json"
        
        $lines = Get-Content $logPath -Encoding UTF8
        $lastModelContent = ""
        
        foreach ($line in $lines) {
            if (-not [string]::IsNullOrWhiteSpace($line)) {
                try {
                    $obj = $line | ConvertFrom-Json
                    if ($obj.source -eq "MODEL") {
                        $lastModelContent = $obj.content
                    }
                } catch {}
            }
        }
        
        if ($lastModelContent -match '(?s)\[\s*\{.*?\}\s*\]') {
            $jsonArray = $matches[0]
            try {
                $parsed = $jsonArray | ConvertFrom-Json
                Set-Content -Path $outFile -Value $jsonArray -Encoding UTF8
                Write-Host "SUCCESS: Extracted JSON for $id"
            } catch {
                Write-Host "FAILED: Invalid JSON for $id"
            }
        } else {
            Write-Host "FAILED: No JSON array found for $id"
        }
    }
}
