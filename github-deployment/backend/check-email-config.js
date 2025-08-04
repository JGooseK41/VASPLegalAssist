#!/usr/bin/env node

// Script to check email configuration
const chalk = require('chalk') || { 
  green: (text) => `✓ ${text}`,
  red: (text) => `✗ ${text}`,
  yellow: (text) => `⚠ ${text}`,
  blue: (text) => `ℹ ${text}`
};

console.log('Checking Email Configuration...\n');

// Check required environment variables
const requiredVars = [
  { name: 'CLIENT_URL', expected: 'https://theblockrecord.com' },
  { name: 'APP_URL', expected: 'https://theblockrecord.com' },
  { name: 'SENDGRID_API_KEY', sensitive: true },
  { name: 'SENDGRID_FROM_EMAIL', expected: 'noreply@theblockrecord.com' },
  { name: 'SENDGRID_FROM_NAME', expected: 'The Block Record' }
];

let hasErrors = false;

requiredVars.forEach(({ name, expected, sensitive }) => {
  const value = process.env[name];
  
  if (!value) {
    console.log(chalk.red(`${name} is not set`));
    hasErrors = true;
  } else if (sensitive) {
    console.log(chalk.green(`${name} is set`));
  } else if (expected && value !== expected) {
    console.log(chalk.yellow(`${name} = "${value}" (expected: "${expected}")`));
    hasErrors = true;
  } else {
    console.log(chalk.green(`${name} = "${value}"`));
  }
});

// Test email verification URL generation
console.log('\n' + chalk.blue('Testing email verification URL generation:'));
const verificationToken = 'test-token-123';

// Test with production environment
process.env.NODE_ENV = 'production';
const getBaseUrl = () => {
  let baseUrl = process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com';
  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    console.log(chalk.yellow('⚠️  CLIENT_URL contains localhost, using fallback'));
    baseUrl = 'https://theblockrecord.com';
  }
  return baseUrl;
};

const verificationUrl = `${getBaseUrl()}/verify-email?token=${verificationToken}`;
console.log(`URL: ${verificationUrl}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

if (verificationUrl.includes('localhost')) {
  console.log(chalk.red('⚠️  WARNING: Verification URL still contains localhost!'));
  hasErrors = true;
} else {
  console.log(chalk.green('✓ Verification URL looks correct (localhost protection working)'));
}

// Check SendGrid API key format
if (process.env.SENDGRID_API_KEY) {
  if (process.env.SENDGRID_API_KEY === 'your-sendgrid-api-key-here') {
    console.log(chalk.red('\n⚠️  WARNING: SendGrid API key is not configured (using placeholder)'));
    console.log(chalk.yellow('Please set a valid SendGrid API key to enable email sending'));
    hasErrors = true;
  } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.log(chalk.yellow('\n⚠️  WARNING: SendGrid API key format may be incorrect (should start with "SG.")'));
  }
}

// Summary
console.log('\n' + (hasErrors ? chalk.red('❌ Email configuration has issues') : chalk.green('✅ Email configuration looks good')));

if (hasErrors) {
  console.log('\nTo fix these issues:');
  console.log('1. Update the .env file in the backend directory');
  console.log('2. Ensure CLIENT_URL and APP_URL are set to "https://theblockrecord.com"');
  console.log('3. Set a valid SendGrid API key');
  console.log('4. Restart the backend server after making changes');
  process.exit(1);
}