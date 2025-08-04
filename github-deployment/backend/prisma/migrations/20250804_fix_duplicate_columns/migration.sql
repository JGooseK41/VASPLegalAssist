-- Fix duplicate column issue by checking if columns exist before adding
-- This migration safely handles the case where columns might already exist

-- Check and add isProcessed column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='VaspComment' AND column_name='isProcessed') THEN
        ALTER TABLE "VaspComment" ADD COLUMN "isProcessed" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Check and add processedAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='VaspComment' AND column_name='processedAt') THEN
        ALTER TABLE "VaspComment" ADD COLUMN "processedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Check and add processedBy column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='VaspComment' AND column_name='processedBy') THEN
        ALTER TABLE "VaspComment" ADD COLUMN "processedBy" TEXT;
    END IF;
END $$;

-- Create index if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'VaspComment_isUpdate_isProcessed_idx') THEN
        CREATE INDEX "VaspComment_isUpdate_isProcessed_idx" ON "VaspComment"("isUpdate", "isProcessed");
    END IF;
END $$;