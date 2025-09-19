#!/bin/bash

echo "🚀 Starting Aptora Trading Platform"
echo "==================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run: ./setup-env.sh"
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q "your-neon-host" .env; then
    echo "⚠️  Warning: DATABASE_URL not configured in .env file"
    echo "Please edit .env file and add your Neon database URL"
    echo ""
fi

# Check if KANA_API_KEY is set
if grep -q "your-kana-labs-api-key-here" .env; then
    echo "⚠️  Warning: KANA_API_KEY not configured in .env file"
    echo "Please edit .env file and add your Kana Labs API key"
    echo ""
fi

echo "📦 Starting backend service..."
docker compose up -d

echo ""
echo "⏳ Waiting for backend to start..."
sleep 30

echo ""
echo "🔍 Checking backend status..."
docker compose ps

echo ""
echo "✅ Backend service is starting!"
echo ""
echo "🌐 Access your platform:"
echo "   Backend:  http://localhost:8081/api/health"
echo ""
echo "🚀 To start the frontend (run in a separate terminal):"
echo "   cd frontend && pnpm install && pnpm run dev"
echo "   Frontend will be available at: http://localhost:5173"
echo ""
echo "📊 View logs: docker compose logs -f"
echo "🛑 Stop: docker compose down"


echo "🚀 Starting Aptora Frontend"
echo "==========================="

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:8081/api/health > /dev/null; then
    echo "⚠️  Warning: Backend is not running at http://localhost:8081"
    echo "Please start the backend first with: ./start.sh"
    echo ""
fi

echo "📦 Installing frontend dependencies..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing pnpm dependencies..."
    pnpm install
else
    echo "Dependencies already installed."
fi

echo ""
echo "🌐 Starting frontend development server..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API: http://localhost:8081/api/health"
echo ""
echo "Press Ctrl+C to stop the frontend server"
echo ""

# Start the development server
pnpm run dev
