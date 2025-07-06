#!/bin/bash

echo "🧹 Cleaning project for GitHub upload..."

# Backup env files
echo "📋 Backing up .env files..."
cp .env .env.backup 2>/dev/null || echo "No root .env found"
cp backend/.env backend/.env.backup 2>/dev/null || echo "No backend .env found"

# Remove sensitive files
echo "🗑️  Removing sensitive files..."
rm -f .env
rm -f backend/.env
rm -f *.db
rm -f backend/*.db
rm -f backend/prisma/*.db
rm -f vasp.db
rm -f backend/vasp.db

# Remove node_modules (will be reinstalled during deployment)
echo "📦 Removing node_modules..."
rm -rf node_modules
rm -rf backend/node_modules

# Remove generated files
echo "📄 Removing generated files..."
rm -rf backend/generated-pdfs/*
rm -rf generated-pdfs/*
rm -rf backend/generated

# Create .env.example if it doesn't exist
echo "📝 Creating .env.example files..."
if [ ! -f .env.example ]; then
  echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.example
fi

if [ ! -f backend/.env.example ]; then
  cat > backend/.env.example << EOL
DATABASE_URL="file:./vasp.db"
JWT_SECRET="your-secret-here"
PORT=5000
CLIENT_URL="http://localhost:3000"
DEMO_EMAIL="demo@vaspla.gov"
DEMO_PASSWORD="demo2024"
EOL
fi

echo "✅ Project cleaned!"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "1. Your .env files have been backed up as .env.backup"
echo "2. Review 'git status' before committing"
echo "3. Never commit .env or .db files"
echo "4. Set up environment variables in your deployment platform"
echo ""
echo "Ready to upload to GitHub! 🚀"