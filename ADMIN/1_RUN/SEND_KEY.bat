@echo off

cd /d %~dp0..\app

python telegram_tools.py send_key

pause
