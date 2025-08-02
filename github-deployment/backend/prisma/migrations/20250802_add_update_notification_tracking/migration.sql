-- Add fields to track processing of update notifications
ALTER TABLE "VaspComment" ADD COLUMN "isProcessed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VaspComment" ADD COLUMN "processedAt" TIMESTAMP(3);
ALTER TABLE "VaspComment" ADD COLUMN "processedBy" TEXT;

-- Create index for finding unprocessed update notifications
CREATE INDEX "VaspComment_isUpdate_isProcessed_idx" ON "VaspComment"("isUpdate", "isProcessed");