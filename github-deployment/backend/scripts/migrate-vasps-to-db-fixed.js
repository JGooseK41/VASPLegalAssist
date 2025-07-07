const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parse');
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
      .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
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
      const vaspName = vasp['VASP Name'] || vasp['Title'] || '';
      
      // Skip if already exists
      if (existingNames.has(vaspName)) {
        console.log(`Skipping ${vaspName} - already exists`);
        skipped++;
        continue;
      }

      // Parse address if available
      const legalAddress = vasp['Legal Address'] || '';
      let street = '', city = '', state = '', zipCode = '', country = '';
      
      // Simple address parsing (can be improved)
      if (legalAddress && legalAddress !== 'Unknown') {
        const addressParts = legalAddress.split(',').map(p => p.trim());
        if (addressParts.length > 0) street = addressParts[0];
        if (addressParts.length > 1) city = addressParts[1];
        if (addressParts.length > 2) {
          const lastPart = addressParts[addressParts.length - 1];
          country = lastPart;
          if (addressParts.length > 3) {
            state = addressParts[2];
          }
        }
      }

      // Extract jurisdiction from address or use default
      let jurisdiction = 'Unknown';
      const fullAddress = legalAddress.toUpperCase();
      if (fullAddress.includes('USA') || fullAddress.includes('UNITED STATES') || 
          fullAddress.includes(' GA ') || fullAddress.includes(' CA ') || 
          fullAddress.includes(' NY ') || fullAddress.includes(' FL ') || 
          fullAddress.includes(' TX ') || fullAddress.includes(' NV ')) {
        jurisdiction = 'United States';
      } else if (fullAddress.includes('NIGERIA') || fullAddress.includes('LAGOS')) {
        jurisdiction = 'Nigeria';
      } else if (fullAddress.includes('LITHUANIA')) {
        jurisdiction = 'Lithuania';
      } else if (fullAddress.includes('UK') || fullAddress.includes('UNITED KINGDOM')) {
        jurisdiction = 'United Kingdom';
      } else if (fullAddress.includes('SINGAPORE')) {
        jurisdiction = 'Singapore';
      } else if (fullAddress.includes('CANADA')) {
        jurisdiction = 'Canada';
      } else if (fullAddress.includes('CAMBODIA')) {
        jurisdiction = 'Cambodia';
      } else if (fullAddress.includes('SEYCHELLES')) {
        jurisdiction = 'Seychelles';
      }

      // Create VASP in database with correct schema
      await prisma.vasp.create({
        data: {
          name: vaspName,
          legal_name: vaspName, // Using name as legal_name since CSV doesn't have separate field
          jurisdiction: jurisdiction,
          compliance_email: vasp['Compliance Email'] || '',
          compliance_contact: vasp['Compliance Email'] || '', // Using email as contact
          service_address: legalAddress || 'Unknown',
          phone: vasp['Phone Number'] && vasp['Phone Number'] !== 'NA' ? vasp['Phone Number'] : '',
          processing_time: '5-10 business days', // Default value
          preferred_method: (vasp['Service Method'] || 'email').toLowerCase(),
          required_document: vasp['Required Document'] || 'Letterhead',
          info_types: ['KYC', 'Transaction History', 'Account Balance', 'Login Records'], // Default types
          accepts_us_service: jurisdiction === 'United States',
          has_own_portal: (vasp['Service Method'] || '').toLowerCase().includes('portal') || 
                          (vasp['Service Method'] || '').toLowerCase().includes('kodex'),
          law_enforcement_url: vasp['Compliance Portal'] && vasp['Compliance Portal'] !== 'http://NA' ? vasp['Compliance Portal'] : '',
          notes: vasp['Notes'] || '',
          isActive: true
        }
      });
      
      migrated++;
      console.log(`✅ Migrated: ${vaspName}`);
    } catch (error) {
      console.error(`❌ Error migrating ${vasp['VASP Name']}:`, error.message);
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