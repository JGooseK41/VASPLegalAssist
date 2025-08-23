#!/bin/bash

# Simple migration script to fix VaspUpdateRequest schema
# Run this directly in Render shell

echo "Applying VaspUpdateRequest schema migration..."

psql $DATABASE_URL << 'SQLEOF'
DROP TABLE IF EXISTS "VaspUpdateRequest" CASCADE;
CREATE TABLE "VaspUpdateRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "vaspId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "proposedChanges" JSONB NOT NULL,
    "userComments" TEXT,
    "status" TEXT DEFAULT 'PENDING' NOT NULL,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id"),
    FOREIGN KEY ("vaspId") REFERENCES "Vasp"("id")
);
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
CREATE INDEX "idx_vasp_update_request_vaspId" ON "VaspUpdateRequest"("vaspId");
CREATE INDEX "idx_vasp_update_request_userId" ON "VaspUpdateRequest"("userId");
CREATE INDEX "idx_vasp_update_request_status" ON "VaspUpdateRequest"("status");
CREATE INDEX "idx_update_request_evidence_updateRequestId" ON "UpdateRequestEvidence"("updateRequestId");
SQLEOF

echo "Migration complete!"