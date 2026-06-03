$logFile = "C:\Users\IT CARE SAHARSA\.gemini\antigravity\brain\72377ccf-a81e-4a7b-9b2e-e96c60b741c1\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $logFile -Tail 25
foreach ($line in $lines) {
    try {
        $obj = ConvertFrom-Json $line
        $contentPreview = ""
        if ($obj.content) {
            $len = [Math]::Min(200, $obj.content.Length)
            $contentPreview = $obj.content.Substring(0, $len) -replace "`n", " "
        }
        Write-Host "[$($obj.step_index)] $($obj.type) | $contentPreview"
    } catch {
        Write-Host "PARSE_ERROR"
    }
}
