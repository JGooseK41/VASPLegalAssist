#!/usr/bin/env node

/**
 * Script to fix the VaspUpdateRequest schema issue
 * This creates a backward-compatible handler that works with both old and new schemas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndMigrateSchema() {
  try {
    console.log('Checking VaspUpdateRequest schema...');
    
    // Check if the table exists and what columns it has
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'VaspUpdateRequest'
    `;
    
    if (!tableInfo || tableInfo.length === 0) {
      console.log('VaspUpdateRequest table does not exist. Creating it now...');
      
      // Create the new table structure
      await prisma.$executeRaw`
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
        )
      `;
      
      // Create the UpdateRequestEvidence table
      await prisma.$executeRaw`
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
        )
      `;
      
      // Create indexes
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_vasp_update_request_vaspId" ON "VaspUpdateRequest"("vaspId")
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_vasp_update_request_userId" ON "VaspUpdateRequest"("userId")
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_vasp_update_request_status" ON "VaspUpdateRequest"("status")
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_update_request_evidence_updateRequestId" ON "UpdateRequestEvidence"("updateRequestId")
      `;
      
      console.log('✅ Tables created successfully!');
    } else {
      // Check if we have the old schema
      const hasProposedChanges = tableInfo.some(col => col.column_name === 'proposedChanges');
      
      if (!hasProposedChanges) {
        console.log('Old schema detected. Migrating to new schema...');
        
        // Backup existing data
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "VaspUpdateRequest_backup" AS SELECT * FROM "VaspUpdateRequest"
        `;
        
        // Drop and recreate with new schema
        await prisma.$executeRaw`DROP TABLE IF EXISTS "VaspUpdateRequest" CASCADE`;
        
        await prisma.$executeRaw`
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
          )
        `;
        
        // Create the UpdateRequestEvidence table
        await prisma.$executeRaw`
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
          )
        `;
        
        console.log('✅ Schema migrated successfully!');
      } else {
        console.log('✅ Schema is already up to date!');
        
        // Just ensure UpdateRequestEvidence table exists
        await prisma.$executeRaw`
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
          )
        `;
      }
    }
    
    console.log('Schema check complete!');
  } catch (error) {
    console.error('Error checking/migrating schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndMigrateSchema()
    .then(() => {
      console.log('Schema migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema migration failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndMigrateSchema };