#!/bin/bash

# Smart Grid System - Quick Start Script (Unix/macOS)

echo ""
echo "========================================"
echo "Smart Grid Backend-Frontend Integration"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "Python version:"
python3 --version
echo "Node.js version:"
node --version
echo ""

# Create backend virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    cd ..
fi

# Start Backend in background
echo "Starting Smart Grid Backend..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..
sleep 3

# Start Frontend
echo "Starting Smart Grid Frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --silent
fi

echo ""
echo "========================================"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start frontend
npm start

# Kill backend when frontend exits
kill $BACKEND_PID 2>/dev/null

echo "Smart Grid system stopped"
