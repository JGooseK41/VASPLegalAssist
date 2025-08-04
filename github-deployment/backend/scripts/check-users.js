const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isApproved: true,
        createdAt: true
      }
    });
    
    console.log('Total users:', users.length);
    console.log('\nUser list:');
    users.forEach(user => {
      console.log(`
Email: ${user.email}
Name: ${user.firstName} ${user.lastName}
Role: ${user.role}
Email Verified: ${user.isEmailVerified}
Approved: ${user.isApproved}
Created: ${user.createdAt}
---`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();