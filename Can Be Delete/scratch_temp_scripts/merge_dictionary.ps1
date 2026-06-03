$basePath = "C:\Users\IT CARE SAHARSA\.gemini\antigravity\brain"
$mainId = "72377ccf-a81e-4a7b-9b2e-e96c60b741c1"
$outDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$finalJsonPath = "D:\English Vidya\website\data\grammar\dictionary_full.json"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$allArrays = @()

$subagentDirs = Get-ChildItem -Path $basePath -Directory | Where-Object { $_.Name -ne $mainId }
foreach ($dir in $subagentDirs) {
    $id = $dir.Name
    $logPath = "$($dir.FullName)\.system_generated\logs\transcript.jsonl"
    
    if (Test-Path $logPath) {
        $outFile = "$outDir\$id.json"
        
        $lines = Get-Content $logPath -Encoding UTF8
        $jsonFound = $false
        
        foreach ($line in $lines) {
            if (-not [string]::IsNullOrWhiteSpace($line)) {
                try {
                    $obj = $line | ConvertFrom-Json
                    if ($obj.source -eq "MODEL" -and $obj.tool_calls) {
                        foreach ($call in $obj.tool_calls) {
                            if ($call.name -eq "send_message" -and $call.args.Message) {
                                $msgString = $call.args.Message
                                $start = $msgString.IndexOf('[')
                                $end = $msgString.LastIndexOf(']')
                                if ($start -ge 0 -and $end -gt $start) {
                                    $jsonArrayString = $msgString.Substring($start, $end - $start + 1)
                                    Set-Content -Path $outFile -Value $jsonArrayString -Encoding UTF8
                                    Write-Host "SUCCESS: Extracted JSON for $id"
                                    $jsonFound = $true
                                    
                                    try {
                                        $parsedArray = $jsonArrayString | ConvertFrom-Json
                                        $allArrays += $parsedArray
                                    } catch {}
                                    
                                    break
                                }
                            }
                        }
                    }
                } catch {}
            }
            if ($jsonFound) { break }
        }
    }
}

$allArrays | ConvertTo-Json -Depth 10 | Set-Content -Path $finalJsonPath -Encoding UTF8
Write-Host "Total objects merged: $($allArrays.Count)"
