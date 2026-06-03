$all = Get-Content "D:\English Vidya\scratch\categories_list.txt"
$completedKeywords = @("NUMBERS", "TIME", "COLORS", "FAMILY MEMBER", "HUMAN IDENTITY", "RELATIONSHIP", "SOCIAL INTERACTION", "APPEARANCE", "BEHAVIOR", "EMOTIONAL RELATIONSHIP", "BODY PARTS", "HEALTH", "Physical action", "Pain and feeling", "Fitness and", "KITCHEN", "BEDROOM", "BATHROOM", "FOOD", "DRINKS", "INGREDIENTS", "BIRDS", "BASIC EMOTION", "POSITIVE EMOTION", "NEGATIVE EMOTION", "MENTAL STATE", "INTRODUCTION", "DAILY RESPONSE", "CLOSING", "SOCIAL MEDIA", "Internet language", "CLASSROOM", "EXAM", "ANSWER-WRITING", "READING COMPREHENSION", "PHYSICS", "CHEMISTRY", "BIOLOGY", "MATHEMATICS", "HISTORY", "GEOGRAPHY", "SUBJECT EXPLANATION", "BUSINESS", "PSYCHOLOGY", "PHILOSOPHY", "AI-ERA", "Most-used spoken", "Most-used beginner", "Most-used real conversation", "Most-used household", "Most-used school", "Most-used human interaction", "Most-used daily action")

$missing = @()
$completedCount = 0

foreach ($line in $all) {
    $line = $line.Trim()
    if ($line -eq "") { continue }
    
    $isCompleted = $false
    foreach ($kw in $completedKeywords) {
        if ($line.ToLower().Contains($kw.ToLower())) {
            $isCompleted = $true
            break
        }
    }
    
    if ($isCompleted) {
        $completedCount++
    } else {
        $missing += $line
    }
}

$missing | Set-Content "D:\English Vidya\scratch\missing_categories.txt"
Write-Output "Completed: $completedCount"
Write-Output "Missing: $($missing.Count)"
