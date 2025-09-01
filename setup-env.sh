#!/bin/bash

echo "🚀 Setting up Aptora Trading Platform Environment"
echo "================================================"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://aptora_user:aptora_password@localhost:5432/aptora_db

# Server Configuration
HOST=127.0.0.1
PORT=8080

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
echo "1. Edit .env file and add your Kana Labs API key"
echo "2. Run: docker compose up -d"
echo "3. Access:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend: http://localhost:8080/api/health"
echo "   - pgAdmin: http://localhost:5050 (admin@aptora.com / admin123)"
echo ""
echo "🎯 Your Aptora Trading Platform will be ready!"

