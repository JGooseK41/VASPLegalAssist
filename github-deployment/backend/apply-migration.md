# Apply VaspUpdateRequest Schema Migration

## Issue Fixed
The VASP update form was not properly passing all form data (especially the VASP name) to the backend because:
1. The frontend was using `vasp.name` instead of `formData.name` when creating the update request
2. The database schema didn't match what the backend code expected

## Changes Made

### Frontend Fix
- Updated `VaspUpdateModal.js` to use `formData.name` instead of `vasp.name` when creating the update request

### Backend Schema Update
- Updated the `VaspUpdateRequest` model to store `proposedChanges` as JSON and `userComments` as text
- Added `UpdateRequestEvidence` model for file attachments
- Added proper relations between models

## To Apply the Migration

### For PostgreSQL (Render Production):
1. Connect to your database on Render
2. Run the migration script:
```bash
psql $DATABASE_URL < backend/prisma/migrations/update_vasp_request_schema_postgres.sql
```

### For SQLite (Local Development):
```bash
sqlite3 backend/vasp.db < backend/prisma/migrations/update_vasp_request_schema.sql
```

### After Migration:
1. Update the Prisma client:
```bash
cd backend
npx prisma generate
```

2. Restart the backend service

## Testing
After applying the migration, test the VASP update form:
1. Go to a VASP card
2. Click the update button
3. Fill in all fields including changing the VASP name
4. Submit the form
5. Verify all data is properly saved in the database

## Rollback (if needed)
If you need to rollback, the migration creates a backup table `VaspUpdateRequest_backup` with the original data.