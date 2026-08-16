@echo off
title EnglishVidya - Git Auto Backup
color 0B
echo ========================================================
echo         EnglishVidya Git Auto-Backup System
echo ========================================================
echo.
echo Select Auto-Backup Interval:
echo [1] Every 30 Seconds (Ultra-Fast for Rapid Editing)
echo [2] Every 1 Minute (Recommended for active writing)
echo [3] Every 5 Minutes
echo [4] Every 15 Minutes
echo [5] Every 30 Minutes
echo [6] One-time instant Git Backup right now
echo.
set /p CHOICE="Enter option number (1-6): "

set INTERVAL=60
if "%CHOICE%"=="1" set INTERVAL=30
if "%CHOICE%"=="2" set INTERVAL=60
if "%CHOICE%"=="3" set INTERVAL=300
if "%CHOICE%"=="4" set INTERVAL=900
if "%CHOICE%"=="5" set INTERVAL=1800
if "%CHOICE%"=="6" (
    cd /d d:\Englishvidya
    git add .
    git commit -m "Manual Git Backup on %date% %time%"
    echo.
    echo [+] Instant Git Backup Completed!
    timeout /t 3 >nul
    exit /b
)

echo.
echo [+] Git Auto-Backup started (Interval: %INTERVAL% seconds).
echo [+] (Keep this window minimized to auto-save in background)
echo.

:LOOP
cd /d d:\Englishvidya
set "CHANGED="
for /f "tokens=*" %%i in ('git status --porcelain') do set "CHANGED=1"

if defined CHANGED (
    git add . >nul 2>&1
    git commit -m "Auto Git Backup on %date% %time%" >nul 2>&1
    echo [%time%] [SAVED] Changes detected and auto-committed!
) else (
    echo [%time%] [NO CHANGE] No changes detected.
)

timeout /t %INTERVAL% /nobreak >nul
goto LOOP
