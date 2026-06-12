@echo off
echo ========================================================
echo EnglishVidya Flashcard Translation Script
echo ========================================================
echo.
echo Installing translation tools (this might take a few seconds)...
call npm install @vitalets/google-translate-api --no-save >nul 2>&1
echo.
echo --------------------------------------------------------
echo Started Translating Categories...
echo --------------------------------------------------------
node scripts\translate-all.js
echo.
echo ========================================================
echo All Done! You can now close this window.
echo ========================================================
pause
