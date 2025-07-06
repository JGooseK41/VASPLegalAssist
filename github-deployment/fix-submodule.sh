#!/bin/bash

echo "=== Fixing GitHub Submodule Issue ==="
echo ""

# Store current directory
CURRENT_DIR=$(pwd)
PARENT_DIR="/home/jesse/projects/vasp-legal-assistant"
DEPLOYMENT_DIR="/home/jesse/projects/vasp-legal-assistant/github-deployment"

echo "Step 1: Checking current location..."
echo "Current directory: $CURRENT_DIR"
echo ""

# First, let's commit any changes in the github-deployment directory
echo "Step 2: Saving any uncommitted changes in github-deployment..."
cd "$DEPLOYMENT_DIR"
git add .
git commit -m "Save work before fixing submodule issue" || echo "No changes to commit"
echo ""

# Now move to parent directory
echo "Step 3: Moving to parent directory..."
cd "$PARENT_DIR"

# Check if .gitmodules exists
echo "Step 4: Checking for .gitmodules file..."
if [ -f .gitmodules ]; then
    echo "Found .gitmodules file. Removing it..."
    rm .gitmodules
    echo "Removed .gitmodules"
else
    echo "No .gitmodules file found"
fi
echo ""

# Remove github-deployment from git index
echo "Step 5: Removing github-deployment from git index..."
git rm --cached github-deployment 2>/dev/null || echo "github-deployment not in git index"
echo ""

# Remove any submodule references in .git/config
echo "Step 6: Cleaning git config..."
git config --file .git/config --remove-section submodule.github-deployment 2>/dev/null || echo "No submodule config found"
echo ""

# Remove .git/modules/github-deployment if it exists
echo "Step 7: Removing submodule git directory..."
if [ -d .git/modules/github-deployment ]; then
    rm -rf .git/modules/github-deployment
    echo "Removed .git/modules/github-deployment"
else
    echo "No .git/modules/github-deployment found"
fi
echo ""

# Add github-deployment as a regular directory
echo "Step 8: Adding github-deployment as regular directory..."
git add github-deployment/
echo ""

# Commit the fix
echo "Step 9: Committing the fix..."
git commit -m "Fix: Remove github-deployment submodule configuration and add as regular directory"
echo ""

# Show status
echo "Step 10: Current git status:"
git status
echo ""

echo "=== Fix Complete ==="
echo ""
echo "Now you can push to GitHub with:"
echo "  git push origin main"
echo ""
echo "If you get an error about 'main' branch, try:"
echo "  git push origin master"
echo ""
echo "Or check your branch name with:"
echo "  git branch"