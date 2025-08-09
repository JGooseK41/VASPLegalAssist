#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    console.error('Please set the DATABASE_URL environment variable');
    process.exit(1);
  }

  try {
    // Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    const { stdout: genOutput, stderr: genError } = await execPromise('npx prisma generate');
    if (genError) console.error('Generate warnings:', genError);
    console.log(genOutput);

    // Run migrations
    console.log('🔄 Applying database migrations...');
    const { stdout: migrateOutput, stderr: migrateError } = await execPromise('npx prisma migrate deploy');
    if (migrateError) console.error('Migration warnings:', migrateError);
    console.log(migrateOutput);

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();