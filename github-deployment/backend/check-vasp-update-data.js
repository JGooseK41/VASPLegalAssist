const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// You'll need to set the DATABASE_URL environment variable
// For production: DATABASE_URL="postgresql://..."

async function checkVaspUpdateData() {
  console.log('\n=== CHECKING VASP UPDATE REQUEST DATA ===\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('\nTo check production data, you need to:');
    console.log('1. Get the production database URL from Render dashboard');
    console.log('2. Run: DATABASE_URL="postgresql://..." node check-vasp-update-data.js');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Get all VASP update requests
    const updateRequests = await prisma.vaspUpdateRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        },
        vasp: {
          select: {
            id: true,
            name: true,
            compliance_email: true,
            jurisdiction: true
          }
        }
      }
    });

    console.log(`Found ${updateRequests.length} update requests\n`);
    
    updateRequests.forEach((req, index) => {
      console.log(`\n========== UPDATE REQUEST #${index + 1} ==========`);
      console.log(`ID: ${req.id}`);
      console.log(`Status: ${req.status}`);
      console.log(`Created: ${req.createdAt}`);
      console.log(`\nSubmitted by: ${req.user.firstName} ${req.user.lastName}`);
      console.log(`Agency: ${req.user.agencyName}`);
      console.log(`Email: ${req.user.email}`);
      
      console.log(`\n--- ORIGINAL VASP (from relationship) ---`);
      console.log(`VASP ID: ${req.vasp.id}`);
      console.log(`VASP Name: ${req.vasp.name || 'NULL'}`);
      console.log(`VASP Email: ${req.vasp.compliance_email || 'NULL'}`);
      console.log(`VASP Jurisdiction: ${req.vasp.jurisdiction || 'NULL'}`);
      
      console.log(`\n--- PROPOSED CHANGES (JSON field) ---`);
      const changes = req.proposedChanges;
      
      // Check if it's a string that needs parsing
      const parsedChanges = typeof changes === 'string' ? JSON.parse(changes) : changes;
      
      // Check for the problematic vaspName field
      if (parsedChanges.vaspName) {
        console.log(`⚠️  Found vaspName field (should not be here): "${parsedChanges.vaspName}"`);
      }
      
      // Display all fields in proposedChanges
      Object.keys(parsedChanges).forEach(key => {
        if (key === 'vaspName' || key === 'submittedAt' || key === 'user_comments') {
          // Skip these metadata fields
          return;
        }
        const value = parsedChanges[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            console.log(`  ${key}: [${value.join(', ')}]`);
          } else if (typeof value === 'object') {
            console.log(`  ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`  ${key}: "${value}"`);
          }
        }
      });
      
      // Specifically check for name and email in proposed changes
      console.log(`\n--- KEY FIELDS IN PROPOSED CHANGES ---`);
      console.log(`  name: "${parsedChanges.name || 'NOT FOUND'}"`);
      console.log(`  compliance_email: "${parsedChanges.compliance_email || 'NOT FOUND'}"`);
      
      if (req.userComments) {
        console.log(`\nUser Comments: ${req.userComments}`);
      }
    });
    
    // Summary
    console.log('\n\n=== SUMMARY ===');
    const pendingCount = updateRequests.filter(r => r.status === 'PENDING').length;
    const approvedCount = updateRequests.filter(r => r.status === 'APPROVED').length;
    const rejectedCount = updateRequests.filter(r => r.status === 'REJECTED').length;
    
    console.log(`Total requests: ${updateRequests.length}`);
    console.log(`Pending: ${pendingCount}`);
    console.log(`Approved: ${approvedCount}`);
    console.log(`Rejected: ${rejectedCount}`);
    
    // Check for data issues
    const requestsWithMissingData = updateRequests.filter(req => {
      const changes = typeof req.proposedChanges === 'string' 
        ? JSON.parse(req.proposedChanges) 
        : req.proposedChanges;
      return !changes.name || !changes.compliance_email;
    });
    
    if (requestsWithMissingData.length > 0) {
      console.log(`\n⚠️  WARNING: ${requestsWithMissingData.length} requests have missing name or email in proposedChanges`);
      requestsWithMissingData.forEach(req => {
        console.log(`  - Request ${req.id} created at ${req.createdAt}`);
      });
    } else {
      console.log('\n✅ All update requests have name and email data in proposedChanges');
    }

  } catch (error) {
    console.error('Error checking update requests:', error);
    if (error.code === 'P2021') {
      console.log('\nThe VaspUpdateRequest table does not exist in this database.');
      console.log('This might be a local database. Make sure you\'re connected to the production database.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkVaspUpdateData();