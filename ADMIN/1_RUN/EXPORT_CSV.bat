@echo off

cd /d %~dp0..\app

python export_csv.py

pause
