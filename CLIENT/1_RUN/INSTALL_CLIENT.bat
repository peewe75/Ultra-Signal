@echo off
REM SoftiBridge Automation CLIENT - creates folders (Common Files)
set ROOT=%PUBLIC%\Documents\Common\Files

mkdir "%ROOT%\softibridge_automation\run" 2>nul
mkdir "%ROOT%\softibridge_automation\cfg" 2>nul
mkdir "%ROOT%\softibridge_automation\log" 2>nul

REM Legacy queues path used by EA
mkdir "%ROOT%\softibridge\inbox" 2>nul
mkdir "%ROOT%\softibridge\state" 2>nul

echo ✅ Cartelle pronte in: %ROOT%
pause
