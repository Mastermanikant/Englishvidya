@echo off
title EnglishVidya - Deploy & Push to GitHub
echo ===================================================
echo   EnglishVidya - Deploying changes to GitHub...
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Adding modified files to Git...
git add .

echo [2/3] Committing changes...
git commit -m "Fix login JWT decoding, profile photo sync and performance updates"

echo [3/3] Pushing code to GitHub (origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo  SUCCESS! Changes pushed to GitHub successfully!
    echo  Cloudflare Pages will build & deploy live now.
    echo ===================================================
) else (
    echo ===================================================
    echo  ERROR: Failed to push to GitHub.
    echo ===================================================
)

echo.
pause
