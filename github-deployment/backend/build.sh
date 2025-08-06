#!/bin/bash

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Create analytics tables if they don't exist
echo "Ensuring analytics tables exist..."
node scripts/create-analytics-tables.js || echo "Analytics tables script failed, but continuing..."

echo "Build process completed!"