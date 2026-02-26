@echo off

cd /d %~dp0..\app

python telegram_tools.py remind

pause
