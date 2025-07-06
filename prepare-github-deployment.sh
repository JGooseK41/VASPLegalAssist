#!/bin/bash

echo "📦 Preparing GitHub deployment folder..."

# Set deployment directory
DEPLOY_DIR="github-deployment"

# Clean existing deployment folder
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy source code and configuration files
echo "📄 Copying source files..."

# Frontend files
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/ 2>/dev/null || echo "No package-lock.json found"

# Backend files
mkdir -p $DEPLOY_DIR/backend
cp -r backend/controllers $DEPLOY_DIR/backend/
cp -r backend/routes $DEPLOY_DIR/backend/
cp -r backend/services $DEPLOY_DIR/backend/
cp -r backend/middleware $DEPLOY_DIR/backend/
cp backend/server.js $DEPLOY_DIR/backend/
cp backend/package.json $DEPLOY_DIR/backend/
cp backend/package-lock.json $DEPLOY_DIR/backend/ 2>/dev/null || echo "No backend package-lock.json"

# Prisma files (but not the database)
mkdir -p $DEPLOY_DIR/backend/prisma
cp backend/prisma/schema.prisma $DEPLOY_DIR/backend/prisma/

# Copy main prisma folder if exists
if [ -d "prisma" ]; then
  mkdir -p $DEPLOY_DIR/prisma
  cp prisma/schema.prisma $DEPLOY_DIR/prisma/ 2>/dev/null || true
fi

# Configuration files
echo "⚙️  Copying configuration files..."
cp .gitignore $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp DEPLOYMENT.md $DEPLOY_DIR/
cp PRODUCTION_CHECKLIST.md $DEPLOY_DIR/
cp GITHUB_UPLOAD_GUIDE.md $DEPLOY_DIR/
cp netlify.toml $DEPLOY_DIR/
cp render.yaml $DEPLOY_DIR/
cp vercel.json $DEPLOY_DIR/

# Create necessary empty directories
mkdir -p $DEPLOY_DIR/backend/generated-pdfs
mkdir -p $DEPLOY_DIR/backend/config
mkdir -p $DEPLOY_DIR/backend/models

# Copy example environment files
echo "🔐 Creating example environment files..."
cp .env.example $DEPLOY_DIR/ 2>/dev/null || cat > $DEPLOY_DIR/.env.example << EOL
# Frontend Environment Variables
REACT_APP_API_URL=https://your-backend-api.com/api
EOL

cp backend/.env.example $DEPLOY_DIR/backend/ 2>/dev/null || cat > $DEPLOY_DIR/backend/.env.example << EOL
# Backend Environment Variables
DATABASE_URL="file:./vasp.db"  # Use PostgreSQL for production
JWT_SECRET="CHANGE-THIS-TO-A-SECURE-RANDOM-STRING"
PORT=5000
CLIENT_URL="https://your-frontend.netlify.app"
DEMO_EMAIL="demo@vaspla.gov"
DEMO_PASSWORD="demo2024"
NODE_ENV=development
EOL

# Copy additional configuration files
cp tailwind.config.js $DEPLOY_DIR/ 2>/dev/null || true
cp postcss.config.js $DEPLOY_DIR/ 2>/dev/null || true
cp tsconfig.json $DEPLOY_DIR/ 2>/dev/null || true

# Create a setup script for easy deployment
cat > $DEPLOY_DIR/setup.sh << 'SETUP'
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
SETUP

chmod +x $DEPLOY_DIR/setup.sh

# Create deployment instructions
cat > $DEPLOY_DIR/QUICK_START.md << 'EOL'
# Quick Start Guide

## Local Development

1. Clone this repository
2. Run the setup script:
   ```bash
   ./setup.sh
   ```
3. Update environment variables in `.env` and `backend/.env`
4. Start the application:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Netlify)
1. Connect this repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variable: `REACT_APP_API_URL=your-backend-url`

### Backend (Render)
1. Connect this repository to Render
2. Set root directory: `backend`
3. Set build command: `npm install && npx prisma generate`
4. Set start command: `npx prisma migrate deploy && node server.js`
5. Add environment variables from `backend/.env.example`

## Demo Account
- Email: demo@vaspla.gov
- Password: demo2024

See `DEPLOYMENT.md` for detailed instructions.
EOL

# Create .gitkeep files for empty directories
touch $DEPLOY_DIR/backend/generated-pdfs/.gitkeep
touch $DEPLOY_DIR/backend/config/.gitkeep
touch $DEPLOY_DIR/backend/models/.gitkeep

# Final message
echo ""
echo "✅ GitHub deployment folder prepared!"
echo ""
echo "📁 Location: ./github-deployment/"
echo ""
echo "This folder contains:"
echo "  ✓ All source code"
echo "  ✓ Configuration files"
echo "  ✓ Documentation"
echo "  ✓ Example environment files"
echo "  ✗ NO sensitive data (.env, .db files)"
echo "  ✗ NO node_modules"
echo ""
echo "To upload to GitHub:"
echo "1. Create a new repository on GitHub.com"
echo "2. Upload the contents of ./github-deployment/"
echo "3. Or use git commands inside the github-deployment folder"
echo ""
echo "The folder is ready for direct upload! 🚀"