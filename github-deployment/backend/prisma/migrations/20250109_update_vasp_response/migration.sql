-- Update VaspResponse table to support better effectiveness tracking
ALTER TABLE "VaspResponse" 
ADD COLUMN IF NOT EXISTS "documentWorked" BOOLEAN,
ADD COLUMN IF NOT EXISTS "failureReasons" TEXT[],
ADD COLUMN IF NOT EXISTS "requiredDocuments" TEXT[],
ADD COLUMN IF NOT EXISTS "contactEmailUsed" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmailWorked" BOOLEAN,
ADD COLUMN IF NOT EXISTS "suggestedEmailUpdate" TEXT,
ADD COLUMN IF NOT EXISTS "responseQuality" TEXT,
ADD COLUMN IF NOT EXISTS "dataFormat" TEXT,
ADD COLUMN IF NOT EXISTS "fees" TEXT,
ADD COLUMN IF NOT EXISTS "additionalRequirements" TEXT;

-- Create index for effectiveness queries
CREATE INDEX IF NOT EXISTS "VaspResponse_documentWorked_idx" ON "VaspResponse"("documentWorked");
CREATE INDEX IF NOT EXISTS "VaspResponse_vaspId_documentWorked_idx" ON "VaspResponse"("vaspId", "documentWorked");