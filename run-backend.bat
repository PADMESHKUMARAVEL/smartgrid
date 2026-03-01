@echo off
REM Smart Grid Backend Startup Script for Windows

echo.
echo ============================================================
echo   SMART GRID BACKEND - STARTUP SCRIPT
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo    Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

echo ✅ Python found

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Check if dependencies are installed
echo.
echo Checking dependencies...
python -c "import flask, flask_cors, torch, numpy, networkx, xgboost, sklearn" >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Missing dependencies. Installing now...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ All dependencies found
)

echo.
echo ============================================================
echo   🚀 STARTING BACKEND SERVER
echo ============================================================
echo.
echo The backend will be running at:
echo   http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the Flask app
python app.py

pause
