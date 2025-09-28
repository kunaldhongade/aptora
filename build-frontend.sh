#!/bin/bash
set -e

echo "🚀 Building Aptora Frontend for Vercel..."

# Navigate to frontend directory
cd frontend

# Install dependencies using pnpm
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm build

echo "✅ Frontend build complete!"
echo "📁 Output directory: frontend/dist"
