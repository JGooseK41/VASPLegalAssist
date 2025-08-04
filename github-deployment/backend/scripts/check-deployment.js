const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');
  
  try {
    // Check if database is connected
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Check if Document table exists
    console.log('2. Checking Document table...');
    const documentCount = await prisma.document.count();
    console.log(`✅ Document table exists with ${documentCount} records\n`);
    
    // Check if Vasp table exists
    console.log('3. Checking Vasp table...');
    const vaspCount = await prisma.vasp.count();
    console.log(`✅ Vasp table exists with ${vaspCount} records\n`);
    
    // Check if VisitorSession table exists
    console.log('4. Checking VisitorSession table...');
    const visitorCount = await prisma.visitorSession.count();
    console.log(`✅ VisitorSession table exists with ${visitorCount} records\n`);
    
    // Check if PageView table exists
    console.log('5. Checking PageView table...');
    const pageViewCount = await prisma.pageView.count();
    console.log(`✅ PageView table exists with ${pageViewCount} records\n`);
    
    // Check if AdminApplication table exists
    console.log('6. Checking AdminApplication table...');
    const adminAppCount = await prisma.adminApplication.count();
    console.log(`✅ AdminApplication table exists with ${adminAppCount} records\n`);
    
    // Check if VaspComment table exists
    console.log('7. Checking VaspComment table...');
    const commentCount = await prisma.vaspComment.count();
    console.log(`✅ VaspComment table exists with ${commentCount} records\n`);
    
    // Test a complex query like the one in analytics
    console.log('8. Testing complex analytics query...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeVisitors = await prisma.visitorSession.count({
      where: {
        createdAt: {
          gte: thirtyMinutesAgo
        }
      }
    });
    console.log(`✅ Complex query successful: ${activeVisitors} active visitors\n`);
    
    // Check Vasp model fields
    console.log('9. Checking Vasp model fields...');
    const firstVasp = await prisma.vasp.findFirst();
    if (firstVasp) {
      console.log('Vasp fields:', Object.keys(firstVasp));
      console.log(`✅ Vasp has compliance_email field: ${firstVasp.compliance_email !== undefined}`);
      console.log(`✅ Vasp has legal_name field: ${firstVasp.legal_name !== undefined}\n`);
    }
    
    console.log('🎉 All checks passed! Database schema is up to date.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nThis error suggests the database schema is not up to date.');
    console.error('Run: npx prisma db push --accept-data-loss');
  } finally {
    await prisma.$disconnect();
  }
}

checkDeployment();