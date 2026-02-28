@echo off
REM Smart Grid System - Quick Start Script (Windows)

echo.
echo ========================================
echo Smart Grid Backend-Frontend Integration
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Python version:
python --version
echo Node.js version:
node --version
echo.

REM Start Backend
echo Starting Smart Grid Backend...
cd backend
pip install -r requirements.txt >nul 2>&1
start cmd /k "python app.py"
timeout /t 3

REM Start Frontend
echo Starting Smart Grid Frontend...
cd ..\frontend
echo Installing frontend dependencies...
call npm install --silent
timeout /t 2
echo.
echo ========================================
echo Starting frontend dev server...
echo ========================================
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
call npm start

pause
