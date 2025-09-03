const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function fixBlankVaspNames() {
  console.log('\n=== FIXING BLANK VASP NAMES FROM UPDATE REQUESTS ===\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('\nTo run this migration:');
    console.log('1. Get the production database URL from Render dashboard');
    console.log('2. Run: DATABASE_URL="postgresql://..." node fix-blank-vasp-names.js');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Find all VASPs with blank or null names
    const vaspsWithBlankNames = await prisma.vasp.findMany({
      where: {
        OR: [
          { name: null },
          { name: '' },
          { compliance_email: null },
          { compliance_email: '' }
        ]
      }
    });

    console.log(`Found ${vaspsWithBlankNames.length} VASPs with blank names or emails\n`);

    for (const vasp of vaspsWithBlankNames) {
      console.log(`\nChecking VASP ID ${vasp.id}:`);
      console.log(`  Current name: "${vasp.name || 'NULL'}"`);
      console.log(`  Current email: "${vasp.compliance_email || 'NULL'}"`);

      // Look for update requests for this VASP
      const updateRequests = await prisma.vaspUpdateRequest.findMany({
        where: {
          vaspId: vasp.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (updateRequests.length === 0) {
        console.log(`  No update requests found for this VASP`);
        continue;
      }

      console.log(`  Found ${updateRequests.length} update request(s)`);

      // Get the most recent update request
      const latestRequest = updateRequests[0];
      const changes = typeof latestRequest.proposedChanges === 'string' 
        ? JSON.parse(latestRequest.proposedChanges) 
        : latestRequest.proposedChanges;

      let updates = {};
      let hasUpdates = false;

      // Check if we can fill in missing name
      if ((!vasp.name || vasp.name === '') && changes.name) {
        updates.name = changes.name;
        hasUpdates = true;
        console.log(`  ✅ Can update name to: "${changes.name}"`);
      }

      // Check if we can fill in missing email
      if ((!vasp.compliance_email || vasp.compliance_email === '') && changes.compliance_email) {
        updates.compliance_email = changes.compliance_email;
        hasUpdates = true;
        console.log(`  ✅ Can update email to: "${changes.compliance_email}"`);
      }

      // Check for other missing fields we can fill
      if ((!vasp.legal_name || vasp.legal_name === '') && changes.legal_name) {
        updates.legal_name = changes.legal_name;
        hasUpdates = true;
        console.log(`  ✅ Can update legal_name to: "${changes.legal_name}"`);
      }

      if ((!vasp.jurisdiction || vasp.jurisdiction === '') && changes.jurisdiction) {
        updates.jurisdiction = changes.jurisdiction;
        hasUpdates = true;
        console.log(`  ✅ Can update jurisdiction to: "${changes.jurisdiction}"`);
      }

      // Apply the updates if we have any
      if (hasUpdates) {
        console.log(`\n  Applying updates to VASP ${vasp.id}...`);
        
        const updatedVasp = await prisma.vasp.update({
          where: { id: vasp.id },
          data: updates
        });

        console.log(`  ✅ Successfully updated VASP ${vasp.id}`);
        console.log(`     New name: "${updatedVasp.name}"`);
        console.log(`     New email: "${updatedVasp.compliance_email}"`);
      } else {
        console.log(`  ⚠️  No updates needed - update request doesn't have the missing data`);
      }
    }

    // Summary
    console.log('\n\n=== MIGRATION SUMMARY ===');
    
    // Check how many still have blank names
    const stillBlank = await prisma.vasp.findMany({
      where: {
        OR: [
          { name: null },
          { name: '' },
          { compliance_email: null },
          { compliance_email: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        compliance_email: true
      }
    });

    if (stillBlank.length > 0) {
      console.log(`\n⚠️  ${stillBlank.length} VASPs still have blank names or emails:`);
      stillBlank.forEach(v => {
        console.log(`  - VASP ${v.id}: name="${v.name || 'NULL'}", email="${v.compliance_email || 'NULL'}"`);
      });
      console.log('\nThese VASPs have no update requests with the missing data.');
      console.log('You may need to contact the users who submitted these VASPs.');
    } else {
      console.log('\n✅ All VASPs now have names and emails!');
    }

  } catch (error) {
    console.error('\n❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixBlankVaspNames();