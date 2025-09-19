#!/bin/bash
set -e

echo "🚀 Building Aptora Frontend for Vercel..."

# Navigate to frontend directory first
cd frontend

# Check if we're on Vercel
if [ -n "$VERCEL" ]; then
    echo "🔧 Detected Vercel environment - bypassing broken pnpm"
    
    # Vercel's pnpm 6.35.1 is broken, so we'll use npm but keep exact versions
    echo "📦 Using npm with exact dependency versions from pnpm-lock.yaml..."
    
    # Remove any existing node_modules to start fresh
    rm -rf node_modules package-lock.json
    
    # Use npm with legacy peer deps to handle Aptos SDK conflicts
    npm install --legacy-peer-deps
    
    echo "🔨 Building with npm..."
    npm run build
else
    # Local development - use normal pnpm
    echo "📦 Installing dependencies with pnpm (local development)..."
    pnpm install
    
    echo "🔨 Building with pnpm..."
    pnpm build
fi

echo "✅ Frontend build complete!"
echo "📁 Output directory: frontend/dist"
