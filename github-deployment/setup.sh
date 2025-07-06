#!/bin/bash

echo "🚀 Setting up VASP Legal Assistant..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create .env files from examples
if [ ! -f ../.env ]; then
  cp ../.env.example ../.env
  echo "✅ Created frontend .env file - please update with your values"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend .env file - please update with your values"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env files with your configuration"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Or deploy to Netlify (frontend) and Render (backend)"
