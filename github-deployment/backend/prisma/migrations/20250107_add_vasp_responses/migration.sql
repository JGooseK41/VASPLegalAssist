-- Create VaspResponse table to track user experiences with VASPs
CREATE TABLE "VaspResponse" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vaspId" INTEGER NOT NULL,
  "documentId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "isUsCompliant" BOOLEAN NOT NULL,
  "recordsRequestMethod" TEXT, -- 'letterhead', 'subpoena', 'search_warrant', 'mlat'
  "freezeRequestMethod" TEXT, -- 'letterhead', 'search_warrant', 'mlat'
  "turnaroundTime" TEXT NOT NULL, -- 'less_than_24h', '2_3_days', '1_week_or_less', '1_4_weeks', 'more_than_4_weeks'
  "additionalNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VaspResponse_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "VaspResponse" ADD CONSTRAINT "VaspResponse_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VaspResponse" ADD CONSTRAINT "VaspResponse_vaspId_fkey" 
  FOREIGN KEY ("vaspId") REFERENCES "Vasp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VaspResponse" ADD CONSTRAINT "VaspResponse_documentId_fkey" 
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for efficient querying
CREATE INDEX "VaspResponse_vaspId_idx" ON "VaspResponse"("vaspId");
CREATE INDEX "VaspResponse_userId_idx" ON "VaspResponse"("userId");
CREATE INDEX "VaspResponse_documentId_idx" ON "VaspResponse"("documentId");