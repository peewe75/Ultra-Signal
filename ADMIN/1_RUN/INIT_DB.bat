@echo off

cd /d %~dp0..\app

python -c "from db import init_db; init_db(); print('DB OK')"

pause
