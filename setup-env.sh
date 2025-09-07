#!/bin/bash

echo "🚀 Setting up Aptora Trading Platform Environment"
echo "================================================"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Neon Database Configuration
DATABASE_URL=postgresql://username:password@your-neon-host:5432/neondb?sslmode=require

# Server Configuration
HOST=127.0.0.1
PORT=8081

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Logging
RUST_LOG=info

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Kana Labs API Configuration (Testnet)
KANA_API_KEY=your-kana-labs-api-key-here
KANA_API_BASE_URL=https://perps-tradeapi.kanalabs.io

# Aptos Configuration
APTOS_API_KEY=your-aptos-api-key-here
APTOS_NETWORK=testnet
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Edit .env file and add your Neon database URL"
echo "2. Edit .env file and add your Kana Labs API key"
echo "3. Start backend: ./start.sh"
echo "4. Start frontend (in separate terminal): cd frontend && npm install && npm run dev"
echo "5. Access:"
echo "   - Backend: http://localhost:8081/api/health"
echo "   - Frontend: http://localhost:5173"
echo ""
echo "🎯 Your Aptora Trading Platform will be ready!"

