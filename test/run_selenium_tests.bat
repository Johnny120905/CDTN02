@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "JDK_BIN="
if exist "C:\Program Files\Java\jdk-23\bin\javac.exe" set "JDK_BIN=C:\Program Files\Java\jdk-23\bin"
if "%JDK_BIN%"=="" (
    for /d %%D in ("C:\Program Files\Java\jdk-*") do (
        if exist "%%~fD\bin\javac.exe" set "JDK_BIN=%%~fD\bin"
    )
)

where mvn >nul 2>&1
if %ERRORLEVEL%==0 (
    echo [PARTIME.VN] Phat hien Maven, dang chay mvn test...
    mvn test %*
    exit /b %ERRORLEVEL%
)

if "%JDK_BIN%"=="" (
    set "JAVAC_EXE=javac"
    set "JAVA_EXE=java"
) else (
    set "JAVAC_EXE=%JDK_BIN%\javac.exe"
    set "JAVA_EXE=%JDK_BIN%\java.exe"
)

echo [PARTIME.VN] Dang bien dich va chay Selenium WebDriver Java POM (%JAVA_EXE%)...
if not exist "target\test-classes" mkdir "target\test-classes"

for /f "delims=" %%i in ('python resolve_cp.py') do set "CP=%%i"

dir /s /b src\test\java\*.java > sources.txt
"%JAVAC_EXE%" -encoding UTF-8 -d target\test-classes -cp "%CP%" @sources.txt
if %ERRORLEVEL% NEQ 0 (
    del sources.txt 2>nul
    echo [LOI] Bien dich Java that bai!
    exit /b 1
)
del sources.txt 2>nul

echo [PARTIME.VN] Bien dich thanh cong! Dang khoi chay bo kiem thu Selenium TestNG...
"%JAVA_EXE%" -Dfile.encoding=UTF-8 %* -cp "target\test-classes;%CP%" org.testng.TestNG testng.xml
