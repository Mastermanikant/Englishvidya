$path = "d:\English Vidya\website\index.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$target = "            <div class=`"search-placeholder`">" + [char]13 + [char]10 + "                <p cla                <!-- Gorgeous Neon-Orb Hero -->" + [char]13 + [char]10 + "                <div class=`"promo-hero`">"

$replacement = "            <div class=`"search-placeholder`">" + [char]13 + [char]10 + "                <p class=`"search-hint`">🔍 ऊपर टाइप करें — तुरंत results आएंगे</p>" + [char]13 + [char]10 + "                <div id=`"recent-searches-container`"></div>" + [char]13 + [char]10 + "            </div>" + [char]13 + [char]10 + "        </div>" + [char]13 + [char]10 + "    </div>" + [char]13 + [char]10 + [char]13 + [char]10 + "    <!-- 4. MAIN SPA CONTENT AREA -->" + [char]13 + [char]10 + "    <main class=`"app-main`" id=`"app-content`">" + [char]13 + [char]10 + [char]13 + [char]10 + "        <!-- ── HOME VIEW (Visible by Default) ── -->" + [char]13 + [char]10 + "        <div id=`"view-home`" class=`"spa-view active`">" + [char]13 + [char]10 + "            <div class=`"promo-home`">" + [char]13 + [char]10 + "                " + [char]13 + [char]10 + "                <!-- Gorgeous Neon-Orb Hero -->" + [char]13 + [char]10 + "                <div class=`"promo-hero`">"

if ($content.Contains($target)) {
    $content = $content.Replace($target, $replacement)
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Output "Replacement Succeeded (CRLF)"
} else {
    $targetLF = $target.Replace(([char]13), "")
    $replacementLF = $replacement.Replace(([char]13), "")
    if ($content.Contains($targetLF)) {
        $content = $content.Replace($targetLF, $replacementLF)
        [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
        Write-Output "Replacement Succeeded (LF)"
    } else {
        Write-Error "Target string not found in index.html!"
    }
}
