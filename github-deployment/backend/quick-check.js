const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    // Check VaspSubmissions
    const submissions = await prisma.vaspSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { 
          select: { 
            email: true, 
            firstName: true, 
            lastName: true 
          } 
        } 
      }
    });
    
    console.log('\n=== VASP SUBMISSIONS ===');
    console.log(`Found ${submissions.length} total submissions\n`);
    
    submissions.slice(0, 5).forEach((s, i) => {
      console.log(`${i+1}. ${s.vaspName || '[NO NAME]'}`);
      console.log(`   Email: ${s.complianceEmail || '[NO EMAIL]'}`);
      console.log(`   Status: ${s.status}`);
      console.log(`   Submitted by: ${s.user.firstName} ${s.user.lastName}`);
      console.log(`   Date: ${s.createdAt}\n`);
    });
    
    // Check VASPs with blank names
    const blankVasps = await prisma.vasp.findMany({
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
        compliance_email: true,
        createdAt: true
      }
    });
    
    console.log('=== BLANK VASPS ===');
    console.log(`Found ${blankVasps.length} VASPs with blank name or email\n`);
    
    blankVasps.forEach(v => {
      console.log(`ID ${v.id}: name="${v.name || 'NULL'}", email="${v.compliance_email || 'NULL'}"`);
    });
    
    // Check update requests
    const updateRequests = await prisma.vaspUpdateRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vasp: {
          select: {
            name: true,
            compliance_email: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('\n=== UPDATE REQUESTS ===');
    console.log(`Found ${updateRequests.length} update requests\n`);
    
    updateRequests.slice(0, 5).forEach((r, i) => {
      const changes = typeof r.proposedChanges === 'string' 
        ? JSON.parse(r.proposedChanges) 
        : r.proposedChanges;
        
      console.log(`${i+1}. Update for VASP: ${r.vasp?.name || '[BLANK VASP]'}`);
      console.log(`   Proposed name: ${changes.name || '[none]'}`);
      console.log(`   Proposed email: ${changes.compliance_email || '[none]'}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Submitted by: ${r.user.firstName} ${r.user.lastName}\n`);
    });
    
  } catch(e) { 
    console.error('Error:', e.message);
  } finally { 
    await prisma.$disconnect(); 
  }
}

quickCheck();