const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Running document stats migration...');
    
    // Run the Prisma migration
    await new Promise((resolve, reject) => {
      exec('npx prisma migrate deploy', (error, stdout, stderr) => {
        if (error) {
          console.error('Migration error:', error);
          reject(error);
          return;
        }
        console.log('Migration output:', stdout);
        if (stderr) console.error('Migration stderr:', stderr);
        resolve();
      });
    });
    
    // Verify the migration worked
    const stats = await prisma.documentStats.findUnique({
      where: { id: 'global-stats' }
    });
    
    if (stats) {
      console.log('Document stats table created successfully!');
      console.log('Current total documents created:', stats.totalDocumentsCreated);
    } else {
      console.error('Document stats record not found. Creating it now...');
      
      // Get current document count
      const currentCount = await prisma.document.count();
      
      // Create the stats record
      await prisma.documentStats.create({
        data: {
          id: 'global-stats',
          totalDocumentsCreated: currentCount
        }
      });
      
      console.log('Document stats record created with count:', currentCount);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();