-- Add isApproved field to User table
ALTER TABLE "User" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- Create Vasp table
CREATE TABLE "Vasp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "compliance_email" TEXT NOT NULL,
    "compliance_contact" TEXT,
    "service_address" TEXT,
    "phone" TEXT,
    "processing_time" TEXT NOT NULL DEFAULT '5-10 business days',
    "preferred_method" TEXT NOT NULL,
    "required_document" TEXT,
    "info_types" TEXT[],
    "accepts_us_service" BOOLEAN NOT NULL DEFAULT false,
    "has_own_portal" BOOLEAN NOT NULL DEFAULT false,
    "law_enforcement_url" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vasp_pkey" PRIMARY KEY ("id")
);

-- Create VaspSubmission table
CREATE TABLE "VaspSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "compliance_email" TEXT NOT NULL,
    "compliance_contact" TEXT,
    "service_address" TEXT,
    "phone" TEXT,
    "processing_time" TEXT NOT NULL,
    "preferred_method" TEXT NOT NULL,
    "required_document" TEXT,
    "info_types" TEXT[],
    "accepts_us_service" BOOLEAN NOT NULL DEFAULT false,
    "has_own_portal" BOOLEAN NOT NULL DEFAULT false,
    "law_enforcement_url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "VaspSubmission_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for VaspSubmission
ALTER TABLE "VaspSubmission" ADD CONSTRAINT "VaspSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraint for VaspComment (update existing)
ALTER TABLE "VaspComment" ADD CONSTRAINT "VaspComment_vaspId_fkey" FOREIGN KEY ("vaspId") REFERENCES "Vasp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;