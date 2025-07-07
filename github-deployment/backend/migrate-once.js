// One-time migration script
const { execSync } = require('child_process');

console.log('Starting one-time migration...');

try {
  // Run migrations
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('Migrations completed successfully!');
  
  // Start the server after migrations
  require('./server.js');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}