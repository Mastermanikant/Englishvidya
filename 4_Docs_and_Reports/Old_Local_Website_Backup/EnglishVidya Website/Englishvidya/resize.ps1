Add-Type -AssemblyName System.Drawing
$src = "D:\EnglishVidya Website\Englishvidya\website\icons\logo.png"
$dest = "D:\EnglishVidya Website\Englishvidya\website\icons\logo-small.png"

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap 96, 96
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 96, 96)
$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Success"
