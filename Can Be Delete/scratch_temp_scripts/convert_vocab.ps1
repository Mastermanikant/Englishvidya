$pyPath = "D:\English Vidya\scratch\generate_sports_vocabulary.py"
$jsonPath = "D:\English Vidya\website\data\grammar\dictionary_batches\v5_sports_athletics.json"

# Read all lines from the python file
$lines = Get-Content -Path $pyPath

# Filter out comments and non-array lines
$jsonLines = @()
$inArray = $false

foreach ($line in $lines) {
    # Check if we are starting the array
    if ($line -match "vocabulary\s*=\s*\[") {
        $inArray = $true
        $jsonLines += "["
        continue
    }
    
    # Check if we are ending the array
    if ($inArray -and $line -match "^\]") {
        $jsonLines += "]"
        $inArray = $false
        break
    }
    
    if ($inArray) {
        # Trim leading and trailing spaces
        $trimmed = $line.Trim()
        # Skip comment lines
        if ($trimmed.StartsWith("#")) {
            continue
        }
        # Skip inline comments or empty lines
        if ($trimmed -eq "") {
            continue
        }
        $jsonLines += $line
    }
}

# Join the lines into a single string
$jsonText = $jsonLines -join "`r`n"

# Verify it parses correctly by converting to custom object
try {
    $data = $jsonText | ConvertFrom-Json
    Write-Host "Successfully parsed $($data.Count) elements from Python script."
    
    # Ensure directory exists
    $dir = Split-Path -Parent $jsonPath
    if (!(Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    
    # Write the raw JSON string directly to the target path
    [System.IO.File]::WriteAllText($jsonPath, $jsonText, [System.Text.Encoding]::UTF8)
    Write-Host "Successfully wrote JSON array directly to $jsonPath"
} catch {
    Write-Error "Failed to parse or write JSON: $_"
}
