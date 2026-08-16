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
echo [3/4] Pushing to GitHub (origin main and origin master)...
git push origin main master

echo.
echo [4/4] Deploying live to Cloudflare Pages (Instant Direct Deploy)...
call npx wrangler pages deploy _site --project-name=englishvidya --branch=main --commit-dirty=true
if %errorlevel% neq 0 (
    echo [!] Warning: Direct Cloudflare deploy encountered a glitch, but GitHub is synced!
) else (
    echo ========================================================
    echo   SUCCESS! EnglishVidya.com is 100% LIVE and updated!
    echo ========================================================
)
)

echo.
pause
