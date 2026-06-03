$logFile = "C:\Users\IT CARE SAHARSA\.gemini\antigravity\brain\72377ccf-a81e-4a7b-9b2e-e96c60b741c1\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $logFile
$total = $lines.Count
Write-Host "Total steps: $total"
# Show steps 650-675 range to find the last meaningful work
$start = [Math]::Max(0, $total - 80)
$end = [Math]::Min($total - 1, $start + 50)
for ($i = $start; $i -le $end; $i++) {
    try {
        $obj = ConvertFrom-Json $lines[$i]
        $contentPreview = ""
        if ($obj.content) {
            $len = [Math]::Min(250, $obj.content.Length)
            $contentPreview = $obj.content.Substring(0, $len) -replace "`n", " "
        }
        Write-Host "[$($obj.step_index)] $($obj.type) | $contentPreview"
    } catch {
        Write-Host "PARSE_ERROR at line $i"
    }
}
