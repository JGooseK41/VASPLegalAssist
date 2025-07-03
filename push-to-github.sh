#!/bin/bash

# Git Push Commands for Jesse Gossman
# Run these commands in order

echo "Setting up git identity..."
git config --global user.email "jesse@theblockaudit.com"
git config --global user.name "Jesse Gossman"

echo "Creating commit..."
git add .
git commit -m "Implement all frontend features - VASPSearch, DocumentBuilder, DocumentHistory, TemplateManager, and Profile components"

echo "Adding GitHub remote..."
git remote add origin https://github.com/JGooseK41/VASPLegalAssist.git

echo "Pushing to GitHub..."
echo "NOTE: When prompted for password, use your Personal Access Token (not your GitHub password)"
git push -u origin main

echo "Done! Your code should now be on GitHub."