#!/usr/bin/env node

const { generateEncryptionKey } = require('./services/documentEncryption');

console.log('==============================================');
console.log('DOCUMENT ENCRYPTION KEY GENERATOR');
console.log('==============================================');
console.log();
console.log('Generated encryption key:');
console.log();
console.log(generateEncryptionKey());
console.log();
console.log('IMPORTANT: Save this key securely!');
console.log();
console.log('To use this key, add it to your .env file:');
console.log('DOCUMENT_ENCRYPTION_KEY=<your-key-here>');
console.log();
console.log('Also add: ENABLE_DOCUMENT_ENCRYPTION=true');
console.log('==============================================');