@echo off
title EnglishVidya Project Backup System
color 0A
echo ========================================================
echo         EnglishVidya Project Auto-Backup System
echo ========================================================
echo.

set SOURCE_DIR=d:\Englishvidya
set BACKUP_DIR=d:\Englishvidya backup

:: Create backup directory if it does not exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [+] Created Backup Directory: %BACKUP_DIR%
)

echo [1/2] Saving Git Commit (Tracking all file and text changes)...
cd /d "%SOURCE_DIR%"
git add .
git commit -m "Backup on %date% %time%" >nul 2>&1
echo [+] Git tracking complete! All text and file changes saved in Git history.

echo.
echo [2/2] Creating Timestamped ZIP Archive in "%BACKUP_DIR%"...

:: Get timestamp YYYY-MM-DD_HH-mm-ss via PowerShell
for /f "tokens=*" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%I

set ZIP_FILE=%BACKUP_DIR%\Englishvidya_Backup_%TIMESTAMP%.zip

:: Create ZIP archive using PowerShell Get-ChildItem and Compress-Archive
powershell -NoProfile -Command "Get-ChildItem -Path '%SOURCE_DIR%' -Force | Compress-Archive -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo ========================================================
    echo SUCCESS! Backup completed successfully.
    echo Saved Location: %ZIP_FILE%
    echo ========================================================
) else (
    echo.
    echo [!] ERROR: Zip file creation failed!
)

echo.
echo Press any key to exit...
pause >nul
