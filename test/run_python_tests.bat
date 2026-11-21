@echo off
REM [Them 20/11/2026 - Ngan] Chay toan bo test Python (Unit + Integration tren du lieu RAM, KHONG cham MongoDB Atlas / Render)
REM Them --excel de ghi ket qua vao sheet TestCases_Python:  run_python_tests.bat --excel
chcp 65001 >nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python -X utf8 python\run_python_tests.py %*
exit /b %ERRORLEVEL%
