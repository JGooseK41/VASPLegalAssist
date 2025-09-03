const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkUpdateRequests() {
  // Connect to the database
  const prisma = new PrismaClient();

  try {
    // Get recent VaspUpdateRequests
    const updateRequests = await prisma.vaspUpdateRequest.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        vasp: {
          select: {
            name: true,
            compliance_email: true
          }
        }
      }
    });

    console.log('\n=== Recent VASP Update Requests ===\n');
    
    updateRequests.forEach((req, index) => {
      console.log(`\n--- Update Request #${index + 1} ---`);
      console.log(`ID: ${req.id}`);
      console.log(`Created: ${req.createdAt}`);
      console.log(`Status: ${req.status}`);
      console.log(`User: ${req.user.firstName} ${req.user.lastName} (${req.user.email})`);
      console.log(`Target VASP: ${req.vasp.name} (${req.vasp.compliance_email})`);
      console.log(`User Comments: ${req.userComments || 'None'}`);
      
      // Parse and display proposed changes
      console.log('\nProposed Changes:');
      const changes = typeof req.proposedChanges === 'string' 
        ? JSON.parse(req.proposedChanges) 
        : req.proposedChanges;
      
      // Check for vaspName field specifically
      if (changes.vaspName !== undefined) {
        console.log(`  - vaspName (extra field): "${changes.vaspName}"`);
      }
      
      // Display actual change fields
      Object.keys(changes).forEach(key => {
        if (key !== 'vaspName' && key !== 'user_comments' && key !== 'submittedAt') {
          const value = changes[key];
          if (value !== undefined && value !== null && value !== '') {
            console.log(`  - ${key}: ${JSON.stringify(value)}`);
          }
        }
      });
    });

  } catch (error) {
    console.error('Error checking update requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUpdateRequests();