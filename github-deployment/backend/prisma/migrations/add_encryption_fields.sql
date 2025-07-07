-- Add encryption fields to DocumentTemplate
ALTER TABLE "DocumentTemplate"
ADD COLUMN "isEncrypted" BOOLEAN DEFAULT false,
ADD COLUMN "encryptedContent" TEXT,
ADD COLUMN "encryptedMarkers" TEXT,
ADD COLUMN "encryptedMappings" TEXT,
ADD COLUMN "encryptedCustomFields" TEXT;

-- Add encryption fields to Document
ALTER TABLE "Document"
ADD COLUMN "isEncrypted" BOOLEAN DEFAULT false,
ADD COLUMN "encryptedTransactionDetails" TEXT,
ADD COLUMN "encryptedRequestedData" TEXT,
ADD COLUMN "encryptedContent" TEXT;