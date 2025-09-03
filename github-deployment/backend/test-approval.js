const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testApproval() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    console.log('Run with: DATABASE_URL="postgresql://..." node test-approval.js');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Get a pending submission
    const submission = await prisma.vaspSubmission.findFirst({
      where: { status: 'PENDING' }
    });

    if (!submission) {
      console.log('No pending submissions found');
      return;
    }

    console.log('\n=== TESTING APPROVAL FOR SUBMISSION ===');
    console.log(`ID: ${submission.id}`);
    console.log(`VASP Name: ${submission.vaspName}`);
    console.log(`Email: ${submission.complianceEmail}`);
    
    // Check all fields
    console.log('\n=== SUBMISSION FIELDS ===');
    Object.keys(submission).forEach(key => {
      const value = submission[key];
      if (value === null) {
        console.log(`${key}: NULL`);
      } else if (Array.isArray(value)) {
        console.log(`${key}: [${value.join(', ')}]`);
      } else if (typeof value === 'object') {
        console.log(`${key}: ${JSON.stringify(value)}`);
      } else {
        console.log(`${key}: "${value}"`);
      }
    });

    // Try to create the VASP data object
    console.log('\n=== VASP DATA TO CREATE ===');
    const vaspData = {
      name: submission.vaspName,
      legal_name: submission.legalName,
      jurisdiction: submission.jurisdiction,
      compliance_email: submission.complianceEmail,
      compliance_contact: submission.complianceContact,
      service_address: submission.serviceAddress,
      website: submission.website,
      phone: submission.phone,
      processing_time: submission.processingTime,
      preferred_method: submission.preferredMethod,
      required_document: submission.requiredDocument,
      info_types: submission.infoTypes || [],
      service_types: submission.serviceTypes || [],
      accepts_us_service: submission.acceptsUsService || false,
      has_own_portal: submission.hasOwnPortal || false,
      law_enforcement_url: submission.lawEnforcementUrl,
      notes: submission.notes
    };

    // Check for required fields
    console.log('\nRequired fields check:');
    const required = ['name', 'jurisdiction', 'compliance_email'];
    required.forEach(field => {
      if (!vaspData[field]) {
        console.log(`❌ Missing required field: ${field}`);
      } else {
        console.log(`✅ ${field}: "${vaspData[field]}"`);
      }
    });

    // Try to create the VASP
    console.log('\n=== ATTEMPTING TO CREATE VASP ===');
    try {
      const vasp = await prisma.vasp.create({
        data: vaspData
      });
      console.log('✅ VASP created successfully!');
      console.log(`VASP ID: ${vasp.id}`);
      console.log(`VASP Name: ${vasp.name}`);
      
      // Clean up - delete the test VASP
      await prisma.vasp.delete({
        where: { id: vasp.id }
      });
      console.log('✅ Test VASP deleted');
      
    } catch (error) {
      console.log('❌ Failed to create VASP:');
      console.log(`Error: ${error.message}`);
      
      if (error.code === 'P2002') {
        console.log('\n⚠️  Unique constraint violation - VASP with this name or email may already exist');
        
        // Check for existing VASP
        const existing = await prisma.vasp.findFirst({
          where: {
            OR: [
              { name: submission.vaspName },
              { compliance_email: submission.complianceEmail }
            ]
          }
        });
        
        if (existing) {
          console.log(`Found existing VASP: ${existing.name} (ID: ${existing.id})`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApproval();