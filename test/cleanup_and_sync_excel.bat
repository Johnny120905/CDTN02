@echo off
chcp 65001 >nul
cd /d "%~dp0"

if exist "TestCases_Selenium_PARTIME_VN_LATEST_RUN.xlsx" (
    del /f /q "TestCases_Selenium_PARTIME_VN_LATEST_RUN.xlsx" 2>nul
    if exist "TestCases_Selenium_PARTIME_VN_LATEST_RUN.xlsx" (
        echo [LOI] Ban dang mo 'TestCases_Selenium_PARTIME_VN_LATEST_RUN.xlsx' trong Excel! Hay dong Excel roi chay lai.
        exit /b 1
    )
    echo [OK] Da xoa file Excel phu TestCases_Selenium_PARTIME_VN_LATEST_RUN.xlsx
)

set "JDK_BIN=C:\Program Files\Java\jdk-23\bin"
for /f "delims=" %%i in ('python resolve_cp.py') do set "CP=%%i"
"%JDK_BIN%\java.exe" -Dfile.encoding=UTF-8 -cp "target\test-classes;%CP%" com.partime.utils.ExcelTestManager
