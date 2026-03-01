#!/bin/bash

# Smart Grid Backend Startup Script for Linux/Mac

echo ""
echo "============================================================"
echo "  SMART GRID BACKEND - STARTUP SCRIPT"
echo "============================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "   Please install Python 3.8+ from https://www.python.org"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if dependencies are installed
echo ""
echo "Checking dependencies..."
python3 -c "import flask, flask_cors, torch, numpy, networkx, xgboost, sklearn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ Missing dependencies. Installing now..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ All dependencies found"
fi

echo ""
echo "============================================================"
echo "  🚀 STARTING BACKEND SERVER"
echo "============================================================"
echo ""
echo "The backend will be running at:"
echo "  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the Flask app
python3 app.py
