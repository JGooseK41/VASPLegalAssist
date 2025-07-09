-- Reset all freeze requirements to Unknown (null)
-- This prevents incorrect assumptions about freeze requirements
UPDATE "Vasp" 
SET 
  "freeze_required_document" = NULL,
  "freeze_processing_time" = 'Unknown'
WHERE "freeze_required_document" IS NOT NULL 
  OR "freeze_processing_time" != 'Unknown';