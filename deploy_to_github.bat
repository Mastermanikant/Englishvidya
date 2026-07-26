@echo off
title EnglishVidya - Build, Deploy and Push
echo ===================================================
echo   EnglishVidya - Building and Deploying Live...
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/4] Building static site (Eleventy)...
call npm run build

echo [2/4] Deploying directly to Cloudflare Pages...
call npx wrangler pages deploy _site --project-name=englishvidya

echo [3/4] Adding changes to Git...
git add .

echo [4/4] Committing and Pushing to GitHub...
git commit -m "Auto Build and Direct Deploy"
git push origin main

echo.
echo ===================================================
echo  SUCCESS! Site built, deployed to Cloudflare and pushed to GitHub!
echo ===================================================
echo.
pause
