#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const command = process.argv[2];

const COMMANDS = {
  'start': 'Start the scheduled cleanup service',
  'stop': 'Stop the scheduled cleanup service',
  'status': 'Check if cleanup service is running',
  'run-now': 'Run cleanup immediately',
  'view-log': 'View cleanup log',
  'setup-cron': 'Setup system cron job (Linux/Mac)',
  'help': 'Show this help message'
};

function showHelp() {
  console.log('🧹 VASP Cleanup Manager\n');
  console.log('Usage: node manage-cleanup.js <command>\n');
  console.log('Commands:');
  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} - ${desc}`);
  });
  console.log('\nSchedule: Runs at 3 AM on the 1st of every month');
}

async function runCommand(cmd) {
  switch (cmd) {
    case 'start':
      console.log('Starting cleanup scheduler...');
      // Check if PM2 is available
      try {
        spawn('pm2', ['start', 'scripts/scheduled-cleanup.js', '--name', 'vasp-cleanup'], {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
      } catch (error) {
        // Fallback to running directly
        console.log('PM2 not found, running with node...');
        spawn('node', ['scripts/scheduled-cleanup.js'], {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
          detached: true
        }).unref();
      }
      break;
      
    case 'stop':
      console.log('Stopping cleanup scheduler...');
      try {
        spawn('pm2', ['stop', 'vasp-cleanup'], { stdio: 'inherit' });
      } catch (error) {
        console.log('Please manually stop the process');
      }
      break;
      
    case 'status':
      console.log('Checking cleanup service status...');
      try {
        spawn('pm2', ['status', 'vasp-cleanup'], { stdio: 'inherit' });
      } catch (error) {
        console.log('Unable to check status');
      }
      break;
      
    case 'run-now':
      console.log('Running cleanup immediately...');
      spawn('node', ['scripts/automated-vasp-cleanup.js'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      break;
      
    case 'view-log':
      const logPath = path.join(__dirname, '../logs/vasp-cleanup.log');
      if (fs.existsSync(logPath)) {
        console.log('📄 Cleanup Log:\n');
        console.log(fs.readFileSync(logPath, 'utf8'));
      } else {
        console.log('No log file found yet');
      }
      break;
      
    case 'setup-cron':
      spawn('bash', ['scripts/setup-cron.sh'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      break;
      
    case 'help':
    default:
      showHelp();
  }
}

// Execute command
if (!command || !COMMANDS[command]) {
  showHelp();
} else {
  runCommand(command);
}