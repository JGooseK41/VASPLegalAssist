const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnalyticsTables() {
  console.log('Checking analytics database tables...\n');
  
  try {
    // Check VisitorSession table
    const visitorCount = await prisma.visitorSession.count();
    console.log(`✅ VisitorSession table exists - ${visitorCount} records`);
    
    // Check PageView table
    const pageViewCount = await prisma.pageView.count();
    console.log(`✅ PageView table exists - ${pageViewCount} records`);
    
    // Check UserSession table
    const userSessionCount = await prisma.userSession.count();
    console.log(`✅ UserSession table exists - ${userSessionCount} records`);
    
    // Get a sample of recent data
    const recentVisitors = await prisma.visitorSession.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { pageViews: true }
    });
    
    if (recentVisitors.length > 0) {
      console.log('\nRecent visitor sessions:');
      recentVisitors.forEach(visitor => {
        console.log(`- ${visitor.anonymizedIp} from ${visitor.city || 'Unknown'}, ${visitor.country || 'Unknown'} - ${visitor.pageViews.length} page views`);
      });
    } else {
      console.log('\n⚠️  No visitor data found. This could mean:');
      console.log('   - The tracking middleware is not working');
      console.log('   - No visitors have accessed the site yet');
      console.log('   - The tables exist but are empty');
    }
    
    console.log('\n✅ All analytics tables are properly set up in the database');
    
  } catch (error) {
    console.error('\n❌ Error checking analytics tables:', error.message);
    
    if (error.code === 'P2021') {
      console.error('\nThe analytics tables do not exist in the database!');
      console.error('You need to run a database migration:');
      console.error('  npx prisma migrate deploy');
    } else if (error.code === 'P2002') {
      console.error('\nDatabase connection error. Check your DATABASE_URL.');
    } else {
      console.error('\nUnexpected error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAnalyticsTables();