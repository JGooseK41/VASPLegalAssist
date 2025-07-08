# Document Stats Tracking Implementation

## Overview
This implementation adds historical document count tracking to ensure that the total document count displayed in platform statistics reflects the total number of documents ever created, not just the current count (which decreases when documents are deleted).

## Changes Made

### 1. Database Schema
- Added new `DocumentStats` table to track historical statistics
- The table has a single row with ID `global-stats` that stores `totalDocumentsCreated`

### 2. Database Migration
- Created migration file: `prisma/migrations/20250108_add_document_stats/migration.sql`
- The migration:
  - Creates the `DocumentStats` table
  - Initializes it with the current document count
  - Creates a PostgreSQL function `increment_document_count()`
  - Creates a trigger that automatically increments the counter when documents are inserted

### 3. Prisma Schema Update
- Added `DocumentStats` model to `prisma/schema.prisma`

### 4. API Update
- Modified `getTotalDocumentCount` in `documentController.js` to:
  - Query the `DocumentStats` table for the historical count
  - Fallback to actual document count if stats don't exist (shouldn't happen after migration)

## How It Works

1. **Automatic Tracking**: A PostgreSQL trigger automatically increments the counter whenever a new document is created, regardless of which controller or method creates it.

2. **Deletion-Safe**: When documents are deleted, the historical count remains unchanged, preserving the true total.

3. **Performance**: The count is pre-calculated and stored, making it very fast to retrieve.

## Running the Migration

1. Run the Prisma migration:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. Or use the provided script:
   ```bash
   cd backend
   node scripts/run-document-stats-migration.js
   ```

## Verification

After running the migration, you can verify it worked:

1. Check the database:
   ```sql
   SELECT * FROM "DocumentStats";
   ```

2. Test the API endpoint:
   ```bash
   curl http://localhost:5001/api/documents/total-count
   ```

The count should now remain stable even when documents are deleted.

## Future Enhancements

The `DocumentStats` table can be extended to track additional metrics:
- Documents created per day/week/month
- Documents by type
- Documents by user
- Average document size
- etc.