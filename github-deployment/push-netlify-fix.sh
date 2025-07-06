#!/bin/bash

echo "=== Pushing Netlify Build Fix ==="
echo ""

# Move to parent directory to commit the root netlify.toml
cd /home/jesse/projects/vasp-legal-assistant

echo "Step 1: Current directory..."
pwd
echo ""

echo "Step 2: Checking git status..."
git status
echo ""

echo "Step 3: Adding netlify.toml..."
git add netlify.toml
echo ""

echo "Step 4: Committing fix..."
git commit -m "Fix Netlify build: Add npm install to build command in root netlify.toml"
echo ""

echo "Step 5: Pushing to GitHub..."
git push origin main || git push origin master
echo ""

echo "=== Done! ==="
echo ""
echo "The root netlify.toml has been updated with the correct build configuration."
echo "Netlify should now run 'npm install' before building your app."
echo ""
echo "Check your Netlify dashboard to see if the build succeeds."