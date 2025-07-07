const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js admin@example.com');
    process.exit(1);
  }
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          isApproved: true
        }
      });
      
      console.log(`✅ Updated ${email} to ADMIN role`);
      console.log(`User: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`Role: ${updatedUser.role}`);
      console.log(`Approved: ${updatedUser.isApproved}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          agencyName: 'System Admin',
          badgeNumber: 'ADMIN001',
          title: 'System Administrator',
          role: 'ADMIN',
          isApproved: true
        }
      });
      
      console.log(`✅ Created new ADMIN user: ${email}`);
      console.log(`Password: admin123`);
      console.log(`User: ${newUser.firstName} ${newUser.lastName}`);
      console.log(`Role: ${newUser.role}`);
      console.log(`Approved: ${newUser.isApproved}`);
      console.log('');
      console.log('🔒 IMPORTANT: Change the password after first login!');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();