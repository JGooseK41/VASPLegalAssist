-- PostgreSQL Migration to update VaspUpdateRequest schema
-- This migration changes the structure to store all proposed changes as JSON

-- First, backup existing data if any
CREATE TABLE IF NOT EXISTS "VaspUpdateRequest_backup" AS SELECT * FROM "VaspUpdateRequest" WHERE 1=1;

-- Drop the old table (CASCADE to remove dependent objects)
DROP TABLE IF EXISTS "VaspUpdateRequest" CASCADE;

-- Create the new VaspUpdateRequest table with updated schema
CREATE TABLE "VaspUpdateRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "vaspId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "proposedChanges" JSONB NOT NULL, -- JSON object with all proposed changes
    "userComments" TEXT,
    "status" TEXT DEFAULT 'PENDING' NOT NULL,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id"),
    FOREIGN KEY ("vaspId") REFERENCES "Vasp"("id")
);

-- Create the UpdateRequestEvidence table
CREATE TABLE IF NOT EXISTS "UpdateRequestEvidence" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "updateRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("updateRequestId") REFERENCES "VaspUpdateRequest"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "idx_vasp_update_request_vaspId" ON "VaspUpdateRequest"("vaspId");
CREATE INDEX "idx_vasp_update_request_userId" ON "VaspUpdateRequest"("userId");
CREATE INDEX "idx_vasp_update_request_status" ON "VaspUpdateRequest"("status");
CREATE INDEX "idx_update_request_evidence_updateRequestId" ON "UpdateRequestEvidence"("updateRequestId");

-- Create trigger to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vasp_update_request_updated_at BEFORE UPDATE ON "VaspUpdateRequest"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();