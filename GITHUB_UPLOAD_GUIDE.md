# GitHub Upload Guide

## BEFORE Uploading to GitHub

### 1. Check for Sensitive Files
**CRITICAL**: Never upload these files:
- `.env` files (contains secrets)
- `*.db` files (contains data)
- `generated-pdfs/` folder (contains documents)
- `node_modules/` folders (too large)

### 2. Verify .gitignore
Run this command to see what will be uploaded:
```bash
git status
```

If you see any `.env` or `.db` files, STOP and fix .gitignore first!

### 3. Clean Your Project
```bash
# Remove any generated files
rm -rf backend/generated-pdfs/*
rm -rf backend/vasp.db
rm -rf backend/prisma/*.db
rm -rf backend/node_modules
rm -rf node_modules

# Remove any .env files (KEEP A BACKUP FIRST!)
mv .env .env.backup
mv backend/.env backend/.env.backup
```

## Uploading to GitHub

### Option 1: GitHub Desktop (Easiest)
1. Download GitHub Desktop
2. Click "File" → "Add Local Repository"
3. Select your project folder
4. Review the files (ensure no .env or .db files)
5. Commit with message "Initial commit"
6. Click "Publish repository"

### Option 2: Command Line
```bash
# Initialize git (if not already done)
git init

# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# IMPORTANT: Verify no sensitive files are listed!
# If you see .env or .db files, fix .gitignore and run:
git rm --cached .env
git rm --cached backend/.env
git rm --cached *.db

# Commit
git commit -m "Initial commit - VASP Legal Assistant"

# Create repository on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Option 3: GitHub Web Upload
1. Create new repository on GitHub.com
2. Click "uploading an existing file"
3. Drag files EXCEPT:
   - .env files
   - node_modules folders
   - .db files
   - generated-pdfs folder

## After Uploading

### 1. Add Security Warning to README
Add this to your README.md:
```markdown
## ⚠️ Security Notice
This repository does not contain:
- Environment variables (.env files)
- Database files
- Generated documents
- API keys or secrets

See `.env.example` for required environment variables.
```

### 2. Create Release
```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### 3. Set Repository Settings
On GitHub.com:
1. Go to Settings → Secrets and variables → Actions
2. Add secrets for deployment:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `DEMO_PASSWORD`

## What TO Include

✅ Include these:
- All source code (src/, backend/)
- package.json files
- Configuration files (.gitignore, netlify.toml, etc.)
- Documentation (README.md, etc.)
- Public assets (public/ComplianceGuide.csv)
- Schema files (prisma/schema.prisma)
- Example env files (.env.example)

❌ Never include:
- .env files (real ones)
- node_modules/
- Database files (*.db)
- Generated PDFs
- Build folders (optional)
- Personal data
- API keys/secrets

## Deployment After GitHub

Once on GitHub, deployment is easy:
1. Netlify: Connect GitHub → Auto-deploy
2. Render: Connect GitHub → Auto-deploy
3. Updates: Push to GitHub → Auto-redeploy

## Troubleshooting

### "File too large" error
- You're trying to upload node_modules
- Run: `rm -rf node_modules backend/node_modules`
- They'll be reinstalled during deployment

### ".env file visible"
- IMMEDIATELY delete the repository
- Fix .gitignore
- Remove from git history:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

### "Database included"
- Remove with: `git rm --cached *.db`
- Add to .gitignore
- Commit and push