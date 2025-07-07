#!/usr/bin/env node

/**
 * Script to encrypt existing unencrypted data in the database
 * Run this script after enabling encryption to protect existing data
 */

const { PrismaClient } = require('@prisma/client');
const encryptionService = require('../utils/encryption');

const prisma = new PrismaClient();

async function encryptExistingTemplates() {
  console.log('Starting template encryption...');
  
  const templates = await prisma.documentTemplate.findMany({
    where: { isEncrypted: false }
  });
  
  console.log(`Found ${templates.length} unencrypted templates`);
  
  for (const template of templates) {
    try {
      const updateData = { isEncrypted: true };
      
      // Encrypt custom fields
      if (template.customFields) {
        updateData.encryptedCustomFields = encryptionService.encryptForUser(
          template.customFields,
          template.userId
        );
        updateData.customFields = null; // Clear plaintext
      }
      
      // Encrypt template content
      if (template.templateContent) {
        updateData.encryptedContent = encryptionService.encryptForUser(
          template.templateContent,
          template.userId
        );
        updateData.templateContent = null; // Clear plaintext
      }
      
      // Encrypt markers
      if (template.markers) {
        updateData.encryptedMarkers = encryptionService.encryptForUser(
          template.markers,
          template.userId
        );
        updateData.markers = null; // Clear plaintext
      }
      
      // Encrypt marker mappings
      if (template.markerMappings) {
        updateData.encryptedMappings = encryptionService.encryptForUser(
          template.markerMappings,
          template.userId
        );
        updateData.markerMappings = null; // Clear plaintext
      }
      
      await prisma.documentTemplate.update({
        where: { id: template.id },
        data: updateData
      });
      
      console.log(`✓ Encrypted template ${template.id} for user ${template.userId}`);
    } catch (error) {
      console.error(`✗ Failed to encrypt template ${template.id}:`, error.message);
    }
  }
}

async function encryptExistingDocuments() {
  console.log('\nStarting document encryption...');
  
  const documents = await prisma.document.findMany({
    where: { isEncrypted: false }
  });
  
  console.log(`Found ${documents.length} unencrypted documents`);
  
  for (const document of documents) {
    try {
      const updateData = { isEncrypted: true };
      
      // Encrypt transaction details
      if (document.transactionDetails && document.transactionDetails !== '[ENCRYPTED]') {
        updateData.encryptedTransactionDetails = encryptionService.encryptForUser(
          document.transactionDetails,
          document.userId
        );
        updateData.transactionDetails = '[ENCRYPTED]';
      }
      
      // Encrypt requested data
      if (document.requestedData && document.requestedData !== '[ENCRYPTED]') {
        updateData.encryptedRequestedData = encryptionService.encryptForUser(
          document.requestedData,
          document.userId
        );
        updateData.requestedData = '[ENCRYPTED]';
      }
      
      await prisma.document.update({
        where: { id: document.id },
        data: updateData
      });
      
      console.log(`✓ Encrypted document ${document.id} for user ${document.userId}`);
    } catch (error) {
      console.error(`✗ Failed to encrypt document ${document.id}:`, error.message);
    }
  }
}

async function main() {
  console.log('=== Data Encryption Migration ===\n');
  
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.error('ERROR: ENCRYPTION_MASTER_KEY not set in environment variables');
    console.error('Please set ENCRYPTION_MASTER_KEY before running this script');
    process.exit(1);
  }
  
  try {
    await encryptExistingTemplates();
    await encryptExistingDocuments();
    
    console.log('\n=== Encryption Complete ===');
    
    const stats = {
      templates: await prisma.documentTemplate.count({ where: { isEncrypted: true } }),
      documents: await prisma.document.count({ where: { isEncrypted: true } })
    };
    
    console.log(`\nEncrypted data statistics:`);
    console.log(`- Templates: ${stats.templates}`);
    console.log(`- Documents: ${stats.documents}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main();
}