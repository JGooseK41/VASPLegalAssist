#!/bin/bash

# Script to apply the VaspUpdateRequest schema migration
# This script handles both local SQLite and production PostgreSQL databases

echo "========================================="
echo "VASP Update Request Schema Migration"
echo "========================================="

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the backend directory"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Determine database type from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in environment"
    echo "Please ensure your .env file contains DATABASE_URL"
    exit 1
fi

if [[ "$DATABASE_URL" == *"postgresql"* ]] || [[ "$DATABASE_URL" == *"postgres"* ]]; then
    echo "Detected PostgreSQL database"
    echo "Running migration for PostgreSQL..."
    
    # Option 1: Use the Node.js migration script
    echo "Using automated migration script..."
    node fix-update-request-schema.js
    
    # If the Node script fails, offer manual migration
    if [ $? -ne 0 ]; then
        echo ""
        echo "Automated migration failed. You can try manual migration:"
        echo "1. Connect to your database"
        echo "2. Run: psql \$DATABASE_URL < prisma/migrations/update_vasp_request_schema_postgres.sql"
    fi
    
elif [[ "$DATABASE_URL" == *"file:"* ]]; then
    echo "Detected SQLite database"
    echo "Running migration for SQLite..."
    
    # Extract the database file path
    DB_FILE=$(echo $DATABASE_URL | sed 's/.*file://')
    
    if [ ! -f "$DB_FILE" ]; then
        echo "Error: Database file not found at $DB_FILE"
        exit 1
    fi
    
    echo "Applying migration to $DB_FILE..."
    sqlite3 "$DB_FILE" < prisma/migrations/update_vasp_request_schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ SQLite migration completed successfully!"
    else
        echo "❌ SQLite migration failed"
        exit 1
    fi
else
    echo "Error: Unable to determine database type from DATABASE_URL"
    exit 1
fi

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Test the VASP update form"
echo ""
echo "If you encounter any issues:"
echo "- Check the server logs for detailed error messages"
echo "- Ensure the database connection is working"
echo "- Verify that all required environment variables are set"