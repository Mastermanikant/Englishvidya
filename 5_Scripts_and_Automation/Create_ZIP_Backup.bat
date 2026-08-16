@echo off
title EnglishVidya - Manual ZIP Backup (Fast Mode)
color 0A
echo ========================================================
echo       EnglishVidya Manual ZIP Archive Backup (Super Fast)
echo ========================================================
echo.

set SOURCE_DIR=d:\Englishvidya
set BACKUP_DIR=d:\Englishvidya backup

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

for /f "tokens=*" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%I
set ZIP_FILE=%BACKUP_DIR%\Englishvidya_Backup_%TIMESTAMP%.zip

echo [+] Creating High-Speed ZIP Archive in "%BACKUP_DIR%"...
powershell -NoProfile -Command "Get-ChildItem -Path '%SOURCE_DIR%' -Force | Compress-Archive -DestinationPath '%ZIP_FILE%' -CompressionLevel Fastest -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo ========================================================
    echo SUCCESS! Super-Fast ZIP Backup Created:
    echo %ZIP_FILE%
    echo ========================================================
) else (
    echo.
    echo [!] ERROR: Failed to create ZIP file.
)

echo.
echo Press any key to exit...
pause >nul
