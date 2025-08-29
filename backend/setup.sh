#!/bin/bash

echo "🚀 Setting up Aptora Backend..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first: https://rustup.rs/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if Diesel CLI is installed
if ! command -v diesel &> /dev/null; then
    echo "📦 Installing Diesel CLI..."
    cargo install diesel_cli --no-default-features --features postgres
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials and JWT secret"
fi

# Build the project
echo "🔨 Building the project..."
cargo build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Create a PostgreSQL database: createdb aptora_db"
echo "3. Run migrations: diesel migration run"
echo "4. Start the server: cargo run"
echo ""
echo "For more information, see README.md"
