#!/bin/bash

# Environment Setup Script for Vercel Clone
# This script copies the root .env file to all service packages that need it

echo "🔧 Setting up environment files..."

# Check if root .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found in root directory"
  echo "📝 Please copy .env.example to .env and fill in your values:"
  echo "   cp .env.example .env"
  exit 1
fi

# List of services that need .env files
SERVICES=(
  "packages/api-server"
  "packages/build-worker"
  "packages/request-handler"
  "packages/db"
  "packages/dashboard"
)

# Copy .env to each service
for service in "${SERVICES[@]}"; do
  if [ -d "$service" ]; then
    cp .env "$service/.env"
    echo "✅ Copied .env to $service"
  else
    echo "⚠️  Warning: Directory $service not found, skipping..."
  fi
done

echo ""
echo "✨ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review .env file and fill in any missing values"
echo "   2. Generate secrets for JWT_SECRET and NEXTAUTH_SECRET:"
echo "      openssl rand -base64 32"
echo "   3. Start all services:"
echo "      bun run dev"
