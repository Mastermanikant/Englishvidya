@echo off
:: ============================================================
:: English Vidya — Build Script
:: ============================================================
:: Double-click this file to:
::   1. Install npm dependencies (fast, safe)
::   2. Run Eleventy build → creates _site/ folder
::
:: Iske baad GitHub Desktop kholo → changes review karo →
:: Commit + Push karo
:: ============================================================

cd /d "%~dp0"

echo.
echo  English Vidya — Build Starting...
echo  ====================================
echo.

echo  [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: npm ci failed!
    pause
    exit /b 1
)

echo.
echo  [2/2] Building site with Eleventy...
call npm run build
if %errorlevel% neq 0 (
    echo  ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo  ====================================
echo  Build complete!
echo.
echo  Ab GitHub Desktop kholo aur:
echo    1. Changes review karo
echo    2. Commit message likho
echo    3. Push karo
echo  ====================================
echo.
pause
