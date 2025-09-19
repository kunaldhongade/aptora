#!/bin/bash

echo "🚀 Starting Aptora Trading Platform"
echo "==================================="

# Check if .env exists (only for local development)
if [ ! -f .env ] && [ -z "$DATABASE_URL" ]; then
    echo "❌ .env file not found and no environment variables set!"
    echo "For local development, please run: ./setup-env.sh"
    echo "For production deployment, ensure environment variables are set in your platform."
    exit 1
fi

# Skip .env checks if we're in production (environment variables are set by platform)
if [ -n "$DATABASE_URL" ]; then
    echo "✅ Production environment detected - using platform environment variables"
else
    echo "✅ Local development environment detected - using .env file"
fi

# Only check .env file contents if we're in local development
if [ -f .env ] && [ -z "$DATABASE_URL" ]; then
    # Check if DATABASE_URL is set in .env
    if grep -q "your-neon-host" .env; then
        echo "⚠️  Warning: DATABASE_URL not configured in .env file"
        echo "Please edit .env file and add your Neon database URL"
        echo ""
    fi

    # Check if KANA_API_KEY is set in .env
    if grep -q "your-kana-labs-api-key-here" .env; then
        echo "⚠️  Warning: KANA_API_KEY not configured in .env file"
        echo "Please edit .env file and add your Kana Labs API key"
        echo ""
    fi
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
