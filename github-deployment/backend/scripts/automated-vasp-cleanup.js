const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Valid legal/compliance terms that should not be flagged
const VALID_TERMS = [
  'MLAT', 'MLA', 'KYC', 'AML', 'CTF', 'SAR', 'STR', 
  'US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'SG', 'HK', 'CH',
  'FBI', 'DEA', 'IRS', 'DOJ', 'SEC', 'CFTC', 'FinCEN',
  'na', 'NA', 'N/A'
];

function cleanHtmlTags(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function automatedCleanup() {
  console.log(`🤖 Starting automated VASP cleanup - ${new Date().toISOString()}`);
  
  let cleanedCount = 0;
  
  try {
    // 1. Clean HTML from notes
    const vaspsWithHtml = await prisma.vasp.findMany({
      where: {
        notes: {
          contains: '<'
        }
      }
    });
    
    for (const vasp of vaspsWithHtml) {
      const cleanedNotes = cleanHtmlTags(vasp.notes);
      
      if (cleanedNotes && !['NA', 'N/A'].includes(cleanedNotes)) {
        await prisma.vasp.update({
          where: { id: vasp.id },
          data: { notes: cleanedNotes }
        });
        cleanedCount++;
        console.log(`✅ Cleaned HTML from notes for ${vasp.name}`);
      }
    }
    
    // 2. Clean problematic placeholders in non-critical fields
    const problemFields = ['compliance_contact', 'service_address', 'phone', 'required_document'];
    
    for (const field of problemFields) {
      const vaspsWithProblems = await prisma.vasp.findMany({
        where: {
          [field]: {
            in: ['NA', 'N/A', 'TBD', 'TODO', 'PLACEHOLDER', 'TEST', 'EXAMPLE']
          }
        }
      });
      
      for (const vasp of vaspsWithProblems) {
        await prisma.vasp.update({
          where: { id: vasp.id },
          data: { [field]: null }
        });
        cleanedCount++;
        console.log(`✅ Cleared ${field} for ${vasp.name}`);
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Total VASPs cleaned: ${cleanedCount}`);
    console.log(`   - Completed at: ${new Date().toISOString()}`);
    
    // Log to a file for monitoring
    const fs = require('fs');
    const logEntry = `${new Date().toISOString()} - Cleaned ${cleanedCount} VASPs\n`;
    fs.appendFileSync('logs/vasp-cleanup.log', logEntry);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
automatedCleanup().catch(console.error);