// One-time migration script
const { execSync } = require('child_process');

console.log('🚀 VASP Legal Assistant - Database Migration');
console.log('==========================================');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Missing ✗');

// Test database connection first
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigrations() {
  try {
    // Test connection
    console.log('\n1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check current state
    console.log('\n2️⃣ Checking current database state...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`Found ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));
    
    // Run migrations
    console.log('\n3️⃣ Running Prisma migrations...');
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('\nDeploying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Verify tables created
    console.log('\n4️⃣ Verifying migration results...');
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`Now have ${newTables.length} tables:`, newTables.map(t => t.table_name).join(', '));
    
    console.log('\n✅ Migrations completed successfully!');
    console.log('\n5️⃣ Starting server...\n');
    
    // Disconnect before starting server
    await prisma.$disconnect();
    
    // Start the server after migrations
    require('./server.js');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the migration
runMigrations();