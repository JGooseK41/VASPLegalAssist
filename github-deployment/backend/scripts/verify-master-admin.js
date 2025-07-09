const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMasterAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'jesse@theblockaudit.com' },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isApproved: true
      }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.firstName, user.lastName);
      console.log('   Role:', user.role);
      console.log('   Approved:', user.isApproved);
      console.log('');
      
      if (user.role === 'MASTER_ADMIN') {
        console.log('🎉 SUCCESS: User is now MASTER_ADMIN!');
      } else {
        console.log('⚠️  WARNING: User role is still', user.role);
      }
    } else {
      console.log('❌ ERROR: User not found with email jesse@theblockaudit.com');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMasterAdmin();