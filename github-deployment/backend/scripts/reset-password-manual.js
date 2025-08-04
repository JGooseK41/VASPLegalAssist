const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  try {
    console.log(`Resetting password for: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    });
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully');
    
    // Test the new password
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage
if (process.argv.length < 4) {
  console.log('Usage: node reset-password-manual.js <email> <newPassword>');
  console.log('Example: node reset-password-manual.js jesse@theblockaudit.com newpassword123');
  process.exit(1);
}

const email = process.argv[2];
const newPassword = process.argv[3];

resetPassword(email, newPassword);