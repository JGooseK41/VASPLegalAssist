-- Add encryption fields for sensitive document data
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "encrypted_crimeDescription" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "encrypted_statute" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "encrypted_caseNumber" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "encryptedFilePath" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileEncryptionMetadata" TEXT;