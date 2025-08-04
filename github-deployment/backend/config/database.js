const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient to be shared across the application
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle cleanup on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;