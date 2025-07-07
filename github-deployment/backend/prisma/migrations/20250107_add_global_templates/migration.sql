-- Add isGlobal field to DocumentTemplate
ALTER TABLE "DocumentTemplate" ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;