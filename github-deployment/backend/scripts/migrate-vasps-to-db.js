const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function migrateVaspsToDatabase() {
  console.log('Starting VASP migration from CSV to database...');
  
  const csvPath = path.join(__dirname, '../public/ComplianceGuide.csv');
  const vasps = [];
  let skipped = 0;
  let migrated = 0;

  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        vasps.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${vasps.length} VASPs in CSV file`);

  // Check existing VASPs in database
  const existingVasps = await prisma.vasp.findMany({
    select: { name: true }
  });
  const existingNames = new Set(existingVasps.map(v => v.name));
  console.log(`Found ${existingVasps.length} existing VASPs in database`);

  // Migrate each VASP
  for (const vasp of vasps) {
    try {
      // Skip if already exists
      if (existingNames.has(vasp.name)) {
        console.log(`Skipping ${vasp.name} - already exists`);
        skipped++;
        continue;
      }

      // Create VASP in database
      await prisma.vasp.create({
        data: {
          name: vasp.name || '',
          website: vasp.website || '',
          supportEmail: vasp.support_email || vasp.compliance_email || '',
          complianceEmail: vasp.compliance_email || vasp.support_email || '',
          serviceMethod: vasp.service_method || 'email',
          serviceUrl: vasp.service_url || '',
          requiredDocuments: vasp.required_documents || '',
          additionalInfo: vasp.additional_info || '',
          
          // Map CSV fields to database fields
          street: vasp.street || '',
          city: vasp.city || '',
          state: vasp.state || '',
          zipCode: vasp.zip_code || '',
          country: vasp.country || '',
          
          // Store additional fields as JSON
          legalName: vasp.legal_name || vasp.name || '',
          dba: vasp.dba || '',
          incorporationNumber: vasp.entity_incorporation_number || '',
          registrationAuthority: vasp.entity_registration_authority || '',
          leiNumber: vasp.lei_number || '',
          
          // Information available
          informationAvailable: vasp.available_information || '',
          
          // Source tracking
          source: 'CSV_IMPORT',
          isVerified: true,
          
          // Status
          status: 'ACTIVE'
        }
      });
      
      migrated++;
      console.log(`✅ Migrated: ${vasp.name}`);
    } catch (error) {
      console.error(`❌ Error migrating ${vasp.name}:`, error.message);
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Total VASPs in CSV: ${vasps.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Total in database now: ${existingVasps.length + migrated}`);
}

// Run migration
migrateVaspsToDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());