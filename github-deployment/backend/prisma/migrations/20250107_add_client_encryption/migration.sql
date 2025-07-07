-- Add client-side encryption support to DocumentTemplate
ALTER TABLE "DocumentTemplate" 
ADD COLUMN "isClientEncrypted" BOOLEAN DEFAULT false,
ADD COLUMN "encryptionVersion" TEXT;

-- Add client-side encryption support to Document
ALTER TABLE "Document"
ADD COLUMN "isClientEncrypted" BOOLEAN DEFAULT false,
ADD COLUMN "encryptionVersion" TEXT,
ADD COLUMN "outputFormat" TEXT DEFAULT 'pdf',
ADD COLUMN "filePath" TEXT,
ADD COLUMN "metadata" TEXT;