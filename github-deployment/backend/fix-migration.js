const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function fixMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Mark the failed migration as rolled back
    const result = await prisma.$executeRaw`
      UPDATE "_prisma_migrations" 
      SET rolled_back_at = NOW() 
      WHERE migration_name = '20250802_add_update_notification_tracking'
      AND finished_at IS NULL
    `;
    
    console.log('Fixed migration:', result, 'rows updated');
    
    // Show current migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM "_prisma_migrations" 
      ORDER BY migration_name DESC 
      LIMIT 5
    `;
    
    console.log('\nCurrent migrations:');
    migrations.forEach(m => {
      console.log(`- ${m.migration_name}: ${m.finished_at ? 'completed' : m.rolled_back_at ? 'rolled back' : 'pending'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();