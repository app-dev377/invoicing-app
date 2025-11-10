#!/bin/bash

# InvoiceHub Start Script
echo "🚀 Starting InvoiceHub..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

# Install Python dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start Flask backend in background
echo "🔧 Starting Flask backend on port 5000..."
python3 app.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend on port 3000..."
npm start

# Cleanup on exit
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID" EXIT
