-- Add dataStructure column to DocumentTemplate table
ALTER TABLE "DocumentTemplate" ADD COLUMN "dataStructure" TEXT;

-- Add sharedTitle and sharedDescription if they don't exist
ALTER TABLE "DocumentTemplate" ADD COLUMN IF NOT EXISTS "sharedTitle" TEXT;
ALTER TABLE "DocumentTemplate" ADD COLUMN IF NOT EXISTS "sharedDescription" TEXT;