#!/bin/bash

echo "🚀 Starting Aptora Trading Platform"
echo "==================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run: ./setup-env.sh"
    exit 1
fi

# Check if KANA_API_KEY is set
if grep -q "your-kana-labs-api-key-here" .env; then
    echo "⚠️  Warning: KANA_API_KEY not configured in .env file"
    echo "Please edit .env file and add your Kana Labs API key"
    echo ""
fi

echo "📦 Starting all services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

echo ""
echo "🔍 Checking service status..."
docker compose ps

echo ""
echo "✅ Aptora Trading Platform is starting!"
echo ""
echo "🌐 Access your platform:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080/api/health"
echo "   pgAdmin:  http://localhost:5050 (admin@aptora.com / admin123)"
echo ""
echo "📊 View logs: docker compose logs -f"
echo "🛑 Stop: docker compose down"
