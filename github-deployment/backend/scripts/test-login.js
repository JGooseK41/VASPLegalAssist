const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    console.log(`\nTesting login for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isApproved: user.isApproved
    });
    
    console.log('\nPassword hash:', user.password);
    console.log('Testing password:', password);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!user.isEmailVerified && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      console.log('⚠️  Email not verified');
    }
    
    if (!user.isApproved && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      console.log('⚠️  Account not approved');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test with your email - replace with actual password
const email = process.argv[2] || 'jesse@theblockaudit.com';
const password = process.argv[3] || 'test123';

if (process.argv.length < 4) {
  console.log('Usage: node test-login.js <email> <password>');
  console.log('Example: node test-login.js jesse@theblockaudit.com yourpassword');
  process.exit(1);
}

testLogin(email, password);