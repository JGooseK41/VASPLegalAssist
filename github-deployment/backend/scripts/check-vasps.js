const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVasps() {
  try {
    // Count total VASPs
    const totalCount = await prisma.vasp.count();
    console.log(`Total VASPs in database: ${totalCount}`);
    
    // Get first 5 VASPs as sample
    const sampleVasps = await prisma.vasp.findMany({
      take: 5,
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('\nSample VASPs:');
    sampleVasps.forEach((vasp, index) => {
      console.log(`${index + 1}. ${vasp.name} - ${vasp.jurisdiction} - ${vasp.compliance_email}`);
    });
    
    // Check for active VASPs
    const activeCount = await prisma.vasp.count({
      where: {
        isActive: true
      }
    });
    console.log(`\nActive VASPs: ${activeCount}`);
    
  } catch (error) {
    console.error('Error checking VASPs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVasps();