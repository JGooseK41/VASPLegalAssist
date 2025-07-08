// Alternative: Node.js-based scheduler for VASP cleanup
// This can run as a background process or be integrated into your main app

const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

// Schedule cleanup for 3 AM on the 1st of every month
// Cron pattern: minute hour day month day-of-week
const schedule = '0 3 1 * *';

console.log('🕐 VASP Cleanup Scheduler Started');
console.log(`📅 Schedule: ${schedule} (3 AM on the 1st of every month)`);

// Create the scheduled task
const task = cron.schedule(schedule, () => {
  console.log(`\n🤖 Running scheduled VASP cleanup - ${new Date().toISOString()}`);
  
  const scriptPath = path.join(__dirname, 'automated-vasp-cleanup.js');
  const cleanup = spawn('node', [scriptPath], {
    cwd: path.join(__dirname, '..'),
    env: process.env
  });
  
  cleanup.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  cleanup.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  cleanup.on('close', (code) => {
    console.log(`Cleanup process exited with code ${code}`);
  });
});

// Start the scheduler
task.start();

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping VASP cleanup scheduler...');
  task.stop();
  process.exit(0);
});

// Optional: Run cleanup immediately on start (for testing)
if (process.argv.includes('--run-now')) {
  console.log('🏃 Running cleanup immediately...');
  const { spawn } = require('child_process');
  spawn('node', [path.join(__dirname, 'automated-vasp-cleanup.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
}