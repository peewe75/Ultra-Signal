@echo off

cd /d %~dp0..\app

if not exist data mkdir data

echo stop> data\stop.flag

echo [OK] Stop richiesto.

pause
