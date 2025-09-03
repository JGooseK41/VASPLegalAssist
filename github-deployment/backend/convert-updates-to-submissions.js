const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function convertUpdatesToSubmissions() {
  console.log('\n=== CONVERTING UPDATE REQUESTS TO VASP SUBMISSIONS ===\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('\nTo run this migration:');
    console.log('1. Get the production database URL from Render dashboard');
    console.log('2. Run: DATABASE_URL="postgresql://..." node convert-updates-to-submissions.js');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Find all update requests that are actually new VASP submissions
    // These would be update requests where the associated VASP has no name/email
    const updateRequests = await prisma.vaspUpdateRequest.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true,
        vasp: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${updateRequests.length} pending update requests\n`);

    let newSubmissionsCreated = 0;
    let actualUpdatesFound = 0;

    for (const request of updateRequests) {
      const changes = typeof request.proposedChanges === 'string' 
        ? JSON.parse(request.proposedChanges) 
        : request.proposedChanges;

      // Check if this looks like a new VASP submission
      // (the original VASP has no name or email)
      const isNewSubmission = !request.vasp.name || request.vasp.name === '' || 
                              !request.vasp.compliance_email || request.vasp.compliance_email === '';

      if (isNewSubmission && changes.name && changes.compliance_email) {
        console.log(`\n--- Converting Update Request ${request.id} to VaspSubmission ---`);
        console.log(`  User: ${request.user.firstName} ${request.user.lastName} (${request.user.email})`);
        console.log(`  VASP Name: ${changes.name}`);
        console.log(`  VASP Email: ${changes.compliance_email}`);

        // Create a new VaspSubmission
        const submission = await prisma.vaspSubmission.create({
          data: {
            userId: request.userId,
            vaspName: changes.name || '',
            legalName: changes.legal_name || null,
            jurisdiction: changes.jurisdiction || '',
            complianceEmail: changes.compliance_email || '',
            complianceContact: changes.compliance_contact || null,
            serviceAddress: changes.service_address || null,
            website: changes.website || null,
            phone: changes.phone || null,
            processingTime: changes.processing_time || null,
            preferredMethod: changes.preferred_method || null,
            requiredDocument: changes.required_document || null,
            infoTypes: changes.info_types || [],
            serviceTypes: changes.service_types || [],
            acceptsUsService: changes.accepts_us_service || false,
            hasOwnPortal: changes.has_own_portal || false,
            lawEnforcementUrl: changes.law_enforcement_url || null,
            notes: request.userComments || changes.notes || null,
            status: 'PENDING'
          }
        });

        console.log(`  ✅ Created VaspSubmission ${submission.id}`);

        // Mark the update request as processed
        await prisma.vaspUpdateRequest.update({
          where: { id: request.id },
          data: {
            status: 'APPROVED',
            reviewNotes: 'Converted to VaspSubmission - was actually a new VASP entry'
          }
        });

        console.log(`  ✅ Marked UpdateRequest as processed`);
        
        newSubmissionsCreated++;
      } else if (isNewSubmission) {
        console.log(`\n⚠️  Update Request ${request.id} appears to be a new submission but is missing required data:`);
        console.log(`  - Name: "${changes.name || 'MISSING'}"`);
        console.log(`  - Email: "${changes.compliance_email || 'MISSING'}"`);
      } else {
        actualUpdatesFound++;
      }
    }

    // Summary
    console.log('\n\n=== CONVERSION SUMMARY ===');
    console.log(`Total pending update requests reviewed: ${updateRequests.length}`);
    console.log(`New VASP submissions created: ${newSubmissionsCreated}`);
    console.log(`Actual updates (not converted): ${actualUpdatesFound}`);

    if (newSubmissionsCreated > 0) {
      console.log('\n✅ Successfully converted update requests to proper VASP submissions!');
      console.log('These will now appear in the admin panel under "Submissions" instead of "Updates".');
    }

    // Check if there are any remaining problematic entries
    const remainingBlankVasps = await prisma.vasp.findMany({
      where: {
        OR: [
          { name: null },
          { name: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        compliance_email: true,
        _count: {
          select: {
            updateRequests: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }
      }
    });

    if (remainingBlankVasps.length > 0) {
      console.log(`\n⚠️  ${remainingBlankVasps.length} blank VASPs still exist in the database:`);
      remainingBlankVasps.forEach(v => {
        console.log(`  - VASP ${v.id}: ${v._count.updateRequests} pending update requests`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error during conversion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
convertUpdatesToSubmissions();