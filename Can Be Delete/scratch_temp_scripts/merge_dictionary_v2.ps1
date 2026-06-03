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
                                
                                if ($msgString.StartsWith('"') -and $msgString.EndsWith('"')) {
                                    try {
                                        $msgString = $msgString | ConvertFrom-Json
                                    } catch {}
                                }
                                
                                $start = $msgString.IndexOf('[')
                                if ($start -ge 0) {
                                    $jsonArrayString = $msgString.Substring($start)
                                    
                                    # Try to fix truncated JSON by finding the last complete object
                                    $lastBraceIndex = $jsonArrayString.LastIndexOf('}')
                                    if ($lastBraceIndex -ge 0) {
                                        $jsonArrayString = $jsonArrayString.Substring(0, $lastBraceIndex + 1) + "]"
                                    }
                                    
                                    try {
                                        $parsedArray = $jsonArrayString | ConvertFrom-Json
                                        $parsedArray | ConvertTo-Json -Depth 10 | Set-Content -Path $outFile -Encoding UTF8
                                        $allArrays += $parsedArray
                                        Write-Host "SUCCESS: Extracted $($parsedArray.Count) objects for $id"
                                        $jsonFound = $true
                                        break
                                    } catch {
                                        try {
                                            $unescaped = $jsonArrayString.Replace('\n', '').Replace('\"', '"').Replace('\\', '\')
                                            $lastBraceIndex = $unescaped.LastIndexOf('}')
                                            if ($lastBraceIndex -ge 0) {
                                                $unescaped = $unescaped.Substring(0, $lastBraceIndex + 1) + "]"
                                            }
                                            $parsedArray = $unescaped | ConvertFrom-Json
                                            $parsedArray | ConvertTo-Json -Depth 10 | Set-Content -Path $outFile -Encoding UTF8
                                            $allArrays += $parsedArray
                                            Write-Host "SUCCESS: Extracted $($parsedArray.Count) objects for $id (after unescape)"
                                            $jsonFound = $true
                                            break
                                        } catch {
                                            $err = $_.Exception.Message
                                            Write-Host "FAILED to parse for $id : $err"
                                        }
                                    }
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
