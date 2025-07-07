const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🔧 Database Initialization Script');
  console.log('=================================');
  
  try {
    // Check if tables exist
    console.log('Checking database status...');
    const tableCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    `;
    
    if (tableCheck[0].count === '0') {
      console.log('❌ Tables not found. Running migrations...');
      
      // Run migrations
      console.log('Running prisma generate...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      console.log('Running prisma migrate deploy...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      
      console.log('✅ Migrations completed!');
    } else {
      console.log('✅ Tables already exist');
    }
    
    // Check for admin user
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (adminCount === 0) {
      console.log('⚠️  No admin users found!');
      console.log('Please create an admin user by:');
      console.log('1. Registering at https://www.theblockrecord.com/register');
      console.log('2. Running this SQL in your database:');
      console.log(`   UPDATE "User" SET role = 'ADMIN', "isApproved" = true WHERE email = 'your-email@example.com';`);
    } else {
      console.log(`✅ Found ${adminCount} admin user(s)`);
    }
    
    // Check VASP data
    const vaspCount = await prisma.vasp.count();
    console.log(`📊 VASPs in database: ${vaspCount}`);
    
    if (vaspCount === 0) {
      console.log('💡 Run npm run migrate-vasps to import VASP data from CSV');
    }
    
    console.log('\n✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initDatabase();