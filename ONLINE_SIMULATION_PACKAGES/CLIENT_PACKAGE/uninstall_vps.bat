@echo off
REM SoftiBridge Automation CLIENT - VPS Cleanup Script
REM Run this script to remove SoftiBridge associations and startup rules.

echo ========================================
echo   SoftiBridge VPS Uninstaller           
echo ========================================
echo.

echo [1/3] Removing Auto-Startup Registry Key...
REG DELETE "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SoftiBridgeClient" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   + Auto-Startup Key Removed successfully.
) else (
    echo   ~ No Auto-Startup Key found or already removed.
)

echo.
echo [2/3] Cleaning up Shared Run Configuration Directory...
set ROOT=%PUBLIC%\Documents\Common\Files

if exist "%ROOT%\softibridge_automation" (
    rmdir /S /Q "%ROOT%\softibridge_automation"
    echo   + Removed: %ROOT%\softibridge_automation
) else (
    echo   ~ Directory already removed: %ROOT%\softibridge_automation
)

if exist "%ROOT%\softibridge" (
    rmdir /S /Q "%ROOT%\softibridge"
    echo   + Removed: %ROOT%\softibridge
) else (
    echo   ~ Directory already removed: %ROOT%\softibridge
)

echo.
echo [3/3] MetaTrader EA Removal...
echo   ! WARNING: This script does not automatically remove the injected .ex4/.ex5 files
echo   ! from your MetaQuotes MQL directories. You can delete them manually from:
echo   ! AppData\Roaming\MetaQuotes\Terminal\...\MQLX\Experts\
echo.

echo ========================================
echo   Cleanup Complete!                     
echo ========================================
echo.
pause
