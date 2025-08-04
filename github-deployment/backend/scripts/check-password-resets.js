const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasswordResets() {
  try {
    const resets = await prisma.passwordResetToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('Recent password reset tokens:', resets.length);
    console.log('\nReset tokens:');
    resets.forEach(reset => {
      console.log(`
User: ${reset.user.email}
Token created: ${reset.createdAt}
Expires: ${reset.expiresAt}
Used: ${reset.used}
Expired: ${new Date() > reset.expiresAt}
---`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordResets();