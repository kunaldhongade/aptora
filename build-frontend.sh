#!/bin/bash
set -e

echo "🚀 Building Aptora Frontend for Vercel..."

# Check if we're on Vercel and try to upgrade pnpm
if [ -n "$VERCEL" ]; then
    echo "🔧 Detected Vercel environment"
    echo "📋 Current PNPM version: $(pnpm --version)"
    
    # Try to upgrade pnpm, but don't fail if it doesn't work
    echo "🔄 Attempting to upgrade pnpm..."
    npm install -g pnpm@8 || echo "⚠️ Could not upgrade pnpm, using existing version"
    echo "📋 Final PNPM version: $(pnpm --version)"
fi

# Navigate to frontend directory
cd frontend

# Install dependencies using pnpm with retry logic
echo "📦 Installing dependencies with pnpm..."
pnpm install || {
    echo "⚠️ PNPM install failed, trying with different registry..."
    pnpm install --registry https://registry.npmjs.org/ || {
        echo "❌ PNPM install failed completely"
        exit 1
    }
}

# Build the application
echo "🔨 Building application..."
pnpm build

echo "✅ Frontend build complete!"
echo "📁 Output directory: frontend/dist"
