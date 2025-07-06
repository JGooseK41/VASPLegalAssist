#!/bin/bash

echo "=== Alternative Fix: Push from github-deployment directly ==="
echo ""

# This script assumes github-deployment is the actual repository
# and the parent directory structure is causing confusion

DEPLOYMENT_DIR="/home/jesse/projects/vasp-legal-assistant/github-deployment"

echo "Step 1: Moving to github-deployment directory..."
cd "$DEPLOYMENT_DIR"
echo "Current directory: $(pwd)"
echo ""

echo "Step 2: Checking git status..."
git status
echo ""

echo "Step 3: Checking remote configuration..."
git remote -v
echo ""

echo "Step 4: Staging all changes..."
git add .
echo ""

echo "Step 5: Creating commit..."
git commit -m "Add admin portal, FAQ, and VASP submission features" || echo "No changes to commit"
echo ""

echo "Step 6: Checking branch name..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $BRANCH"
echo ""

echo "=== Ready to push ==="
echo ""
echo "To push your changes, run:"
echo "  git push origin $BRANCH"
echo ""
echo "If you haven't set up credentials, use:"
echo "  git config credential.helper store"
echo "  git push origin $BRANCH"
echo "  (then enter your GitHub username and personal access token)"
echo ""
echo "Note: Use a personal access token, not your GitHub password!"