const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAnalyticsTables() {
  console.log('Creating analytics tables in production database...\n');
  
  try {
    // Check if tables exist first
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('VisitorSession', 'PageView', 'UserSession');
    `;
    
    console.log('Existing tables:', tableCheck);
    
    // Create VisitorSession table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "VisitorSession" (
          "id" TEXT NOT NULL,
          "anonymizedIp" TEXT NOT NULL,
          "userAgent" TEXT,
          "country" TEXT,
          "region" TEXT,
          "city" TEXT,
          "countryCode" TEXT,
          "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "endTime" TIMESTAMP(3),
          "duration" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ VisitorSession table created/verified');
    } catch (error) {
      console.log('VisitorSession table already exists or error:', error.message);
    }
    
    // Create PageView table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "PageView" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "path" TEXT NOT NULL,
          "referrer" TEXT,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "timeOnPage" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PageView_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") 
            REFERENCES "VisitorSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `;
      console.log('✅ PageView table created/verified');
      
      // Create index for better performance
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId");
      `;
      console.log('✅ PageView index created/verified');
    } catch (error) {
      console.log('PageView table already exists or error:', error.message);
    }
    
    // Ensure UserSession table has all required columns
    try {
      // Check if lastActivity column exists
      const hasLastActivity = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'UserSession' 
        AND column_name = 'lastActivity';
      `;
      
      if (hasLastActivity.length === 0) {
        await prisma.$executeRaw`
          ALTER TABLE "UserSession" 
          ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3);
        `;
        console.log('✅ Added lastActivity column to UserSession');
      }
      
      // Check if loginAt column exists
      const hasLoginAt = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'UserSession' 
        AND column_name = 'loginAt';
      `;
      
      if (hasLoginAt.length === 0) {
        await prisma.$executeRaw`
          ALTER TABLE "UserSession" 
          ADD COLUMN IF NOT EXISTS "loginAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
        `;
        console.log('✅ Added loginAt column to UserSession');
      }
    } catch (error) {
      console.log('UserSession modifications error:', error.message);
    }
    
    // Verify tables were created
    const finalCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('VisitorSession', 'PageView', 'UserSession');
    `;
    
    console.log('\n✅ Final table check:', finalCheck.map(t => t.table_name).join(', '));
    console.log('\nAnalytics tables are ready!');
    
    // Test with a count
    const visitorCount = await prisma.visitorSession.count();
    const pageViewCount = await prisma.pageView.count();
    console.log(`\nCurrent data: ${visitorCount} visitors, ${pageViewCount} page views`);
    
  } catch (error) {
    console.error('\n❌ Error creating analytics tables:', error);
    console.error('Full error:', error.message);
    
    // If it's a connection error
    if (error.code === 'P1001') {
      console.error('\nCannot connect to database. Check DATABASE_URL in environment variables.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAnalyticsTables()
  .then(() => {
    console.log('\nScript completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });