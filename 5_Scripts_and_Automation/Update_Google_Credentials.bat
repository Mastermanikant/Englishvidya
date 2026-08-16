@echo off
title "EnglishVidya - Update Google OAuth Credentials"
echo =========================================================
echo   EnglishVidya - Update Google Client ID & Client Secret
echo =========================================================
echo.

set /p CLIENT_ID="Paste GOOGLE_CLIENT_ID here: "
set /p CLIENT_SECRET="Paste GOOGLE_CLIENT_SECRET here: "

if "%CLIENT_ID%"=="" (
    echo.
    echo ERROR: Client ID cannot be empty!
    pause
    exit /b
)

if "%CLIENT_SECRET%"=="" (
    echo.
    echo ERROR: Client Secret cannot be empty!
    pause
    exit /b
)

echo.
echo Updating local environment configuration (.dev.vars)...

(
echo GOOGLE_CLIENT_ID="%CLIENT_ID%"
echo GOOGLE_CLIENT_SECRET="%CLIENT_SECRET%"
echo JWT_SECRET="ev_jwt_secret_key_prod_2026_safe_secure"
echo SITE_URL="https://englishvidya.com"
) > "%~dp0Website_Source\.dev.vars"

echo.
echo =========================================================
echo SUCCESS! Credentials updated in .dev.vars
echo =========================================================
echo.
echo Cloudflare Pages Dashboard me Variables update karne ke liye:
echo 1. Cloudflare Dashboard (dash.cloudflare.com) me jaen.
echo 2. Pages ➔ englishvidya ➔ Settings ➔ Environment variables
echo 3. GOOGLE_CLIENT_ID aur GOOGLE_CLIENT_SECRET me new values daalein.
echo.
pause
