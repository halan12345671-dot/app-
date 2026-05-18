@echo off
echo Checking Sales & Warehouse Management System status...

pm2 status > temp_status.txt 2>&1
findstr "online" temp_status.txt > nul
if %errorlevel% equ 0 (
    echo ✅ Services are running
) else (
    echo ❌ Services not running, starting...
    pm2 start ecosystem.config.js
    echo ✅ Services started
)

del temp_status.txt
pause