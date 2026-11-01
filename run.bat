@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8
title PARTIME.VN - Unified Localhost Server (CDTN02)
cls
echo ====================================================================
echo   Đang khởi động PARTIME.VN trên cùng 1 localhost:8002...
echo   Trình duyệt web sẽ tự động mở tại http://localhost:8002
echo   LƯU Ý: Vui lòng GIỮ NGUYÊN cửa sổ này trong khi sử dụng website!
echo ====================================================================
start "" http://localhost:8002
python run.py
pause
