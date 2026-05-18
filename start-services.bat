@echo off
echo Starting Sales & Warehouse Management System...
cd C:\Users\Acer\Downloads\ai
pm2 start ecosystem.config.js
echo Services started. Check status with: pm2 status
echo View logs with: pm2 logs
echo Stop services with: pm2 stop all
pause