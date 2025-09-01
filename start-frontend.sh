#!/bin/bash

echo "🚀 Starting Aptora Frontend"
echo "==========================="

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:8080/api/health > /dev/null; then
    echo "⚠️  Warning: Backend is not running at http://localhost:8080"
    echo "Please start the backend first with: ./start.sh"
    echo ""
fi

echo "📦 Installing frontend dependencies..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi

echo ""
echo "🌐 Starting frontend development server..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API: http://localhost:8080/api/health"
echo ""
echo "Press Ctrl+C to stop the frontend server"
echo ""

# Start the development server
npm run dev
