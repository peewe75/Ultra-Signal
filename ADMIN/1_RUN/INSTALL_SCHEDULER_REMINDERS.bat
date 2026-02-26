@echo off
setlocal
cd /d %~dp0
set "TASK_NAME=SOFTI_BRIDGE_REMINDERS"
set "RUN_BAT=%~dp0RUN_REMINDERS.bat"
schtasks /Create /F /TN "%TASK_NAME%" /SC DAILY /ST 09:00 /RL HIGHEST /TR "\"%RUN_BAT%\"" >nul 2>&1
if %errorlevel% NEQ 0 (
  echo [ERR] Avvia come ADMINISTRATOR.
  pause
  exit /b 1
)
echo [OK] Task creato/aggiornato: %TASK_NAME%
pause
exit /b 0
