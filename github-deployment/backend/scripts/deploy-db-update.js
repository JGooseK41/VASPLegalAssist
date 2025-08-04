// Script to update database schema in production
const { execSync } = require('child_process');

console.log('🚀 Updating production database schema...\n');

try {
  // Push schema changes
  console.log('📦 Pushing Prisma schema to database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  // Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Database schema update complete!');
  console.log('🎉 Your production database now has all the latest tables.');
} catch (error) {
  console.error('❌ Error updating database schema:', error.message);
  process.exit(1);
}