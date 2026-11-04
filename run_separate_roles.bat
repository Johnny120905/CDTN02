@echo off
chcp 65001 > nul
title PARTIME.VN - Khoi chay 3 Role Doc Lap (CDTN02)
cls
echo ====================================================================
echo   KHOI CHAY BACKEND VA 3 GIAO DIEN WEB RIENG BIET CHO 3 ROLE
echo ====================================================================
echo   1. Backend API:         http://localhost:8002
echo   2. Web Sinh vien:       http://localhost:3001
echo   3. Web Nha tuyen dung:  http://localhost:3002
echo   4. Web Quan tri vien:   http://localhost:3003
echo ====================================================================
echo   Dang mo cac tien trinh... Vui long giu cac cua so dang chay!
echo ====================================================================

start "Backend API (Port 8002)" cmd /k "cd Backend && python server.py"
timeout /t 2 > nul

start "Web Sinh Vien (Port 3001)" cmd /k "cd frontend && npm run dev:student"
timeout /t 1 > nul

start "Web Nha Tuyen Dung (Port 3002)" cmd /k "cd frontend && npm run dev:employer"
timeout /t 1 > nul

start "Web Quan Tri Vien (Port 3003)" cmd /k "cd frontend && npm run dev:admin"
timeout /t 2 > nul

start "" http://localhost:3001
start "" http://localhost:3002
start "" http://localhost:3003

echo Hoan tat! 3 Web doc lap va Backend da san sang.
pause

