@echo off
title EnglishVidya - GitHub Live and Complete Backup Sync
color 0A
echo ========================================================
echo   EnglishVidya - Full Backup and GitHub Live Sync
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Adding all .md files, code and course materials...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "Backup and Live Update: %date% %time%"

echo.
echo [3/3] Pushing to GitHub (origin main and origin master)...
git push origin main master
if %errorlevel% neq 0 (
    echo.
    echo [!] Warning: Push failed or remote origin is not connected.
    echo [!] Please ensure your GitHub remote URL is set using:
    echo     git remote add origin https://github.com/USERNAME/REPO-NAME.git
) else (
    echo.
    echo ========================================================
    echo   SUCCESS! All data and .md files are safe and live on GitHub!
    echo ========================================================
)

echo.
pause
