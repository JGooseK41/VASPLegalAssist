-- Add request type specific fields to Vasp table
ALTER TABLE "Vasp" 
ADD COLUMN IF NOT EXISTS "records_processing_time" TEXT DEFAULT '5-10 business days',
ADD COLUMN IF NOT EXISTS "records_required_document" TEXT,
ADD COLUMN IF NOT EXISTS "records_accepts_us" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "records_jurisdictions" TEXT[],
ADD COLUMN IF NOT EXISTS "freeze_processing_time" TEXT DEFAULT '5-10 business days',
ADD COLUMN IF NOT EXISTS "freeze_required_document" TEXT,
ADD COLUMN IF NOT EXISTS "freeze_accepts_us" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "freeze_jurisdictions" TEXT[];

-- Update VaspSubmission to support request type fields
ALTER TABLE "VaspSubmission"
ADD COLUMN IF NOT EXISTS "records_processing_time" TEXT,
ADD COLUMN IF NOT EXISTS "records_required_document" TEXT,
ADD COLUMN IF NOT EXISTS "records_accepts_us" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "records_jurisdictions" TEXT[],
ADD COLUMN IF NOT EXISTS "freeze_processing_time" TEXT,
ADD COLUMN IF NOT EXISTS "freeze_required_document" TEXT,
ADD COLUMN IF NOT EXISTS "freeze_accepts_us" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "freeze_jurisdictions" TEXT[];