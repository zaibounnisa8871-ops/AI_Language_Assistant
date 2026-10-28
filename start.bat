@echo off
cd /d "%~dp0"

title TranslateAI - Language Assistant

echo ==========================================
echo       Starting TranslateAI...
echo ==========================================

if not exist ".venv\Scripts\python.exe" (
    echo Creating Python environment...
    py -m venv .venv

    if errorlevel 1 (
        echo Failed to create environment.
        pause
        exit /b 1
    )
)

echo Checking dependencies...

".venv\Scripts\python.exe" -c "import flask, requests, langdetect" >nul 2>&1

if errorlevel 1 (
    echo Installing dependencies...

    ".venv\Scripts\python.exe" -m pip install -r requirements.txt

    if errorlevel 1 (
        echo Installation failed.
        pause
        exit /b 1
    )
)

echo Starting website...

start "" "http://127.0.0.1:5000"

".venv\Scripts\python.exe" app.py

pause