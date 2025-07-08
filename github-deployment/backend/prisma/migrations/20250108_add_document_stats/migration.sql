-- Create DocumentStats table to track historical document counts
CREATE TABLE "DocumentStats" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "totalDocumentsCreated" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentStats_pkey" PRIMARY KEY ("id")
);

-- Insert initial stats row with current document count
INSERT INTO "DocumentStats" ("id", "totalDocumentsCreated") 
VALUES ('global-stats', (SELECT COUNT(*) FROM "Document"));

-- Create function to increment document count
CREATE OR REPLACE FUNCTION increment_document_count() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "DocumentStats" 
    SET "totalDocumentsCreated" = "totalDocumentsCreated" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = 'global-stats';
    
    -- Create stats row if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO "DocumentStats" ("id", "totalDocumentsCreated")
        VALUES ('global-stats', 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment count on document creation
CREATE TRIGGER document_created_trigger
AFTER INSERT ON "Document"
FOR EACH ROW
EXECUTE FUNCTION increment_document_count();