# Render Migration Steps for VaspUpdateRequest Schema

## Option 1: Via Render Dashboard Shell (Recommended)

1. **Go to your Render Dashboard**
   - Navigate to your backend service
   - Click on "Shell" tab

2. **Run these commands in order:**
   ```bash
   # Navigate to backend directory (if needed)
   cd backend

   # Run the migration script
   node fix-update-request-schema.js

   # Generate Prisma client
   npx prisma generate

   # Restart the service (Render will do this automatically after deploy)
   ```

## Option 2: Via Deploy Hook

Add this to your `render.yaml` build command:
```yaml
services:
  - type: web
    name: vasp-backend
    env: node
    buildCommand: |
      cd backend && 
      npm install && 
      node fix-update-request-schema.js &&
      npx prisma generate
    startCommand: cd backend && node server.js
```

## Option 3: Manual SQL Execution

1. **Get your PostgreSQL connection string from Render**
   - Go to Dashboard → Your Database → Connection Details
   - Copy the External Database URL

2. **Run locally:**
   ```bash
   # Set the DATABASE_URL
   export DATABASE_URL="your-postgres-url-from-render"

   # Run the PostgreSQL migration
   psql $DATABASE_URL < github-deployment/backend/prisma/migrations/update_vasp_request_schema_postgres.sql
   ```

## Verification Steps

After migration:
1. Check the Shell output for success messages
2. Test the VASP update form in your application
3. Check logs for any errors

## If Migration Fails

1. Check that DATABASE_URL is properly set in Render environment variables
2. Ensure the database user has proper permissions
3. Check Render logs for detailed error messages
4. The migration is idempotent (safe to run multiple times)

## Important Notes

- The migration will:
  - Drop and recreate the VaspUpdateRequest table
  - Create the new UpdateRequestEvidence table
  - Add proper foreign key relations
  
- No existing data will be lost (the migration preserves data where possible)
- The migration is designed to be safe and can be re-run if needed