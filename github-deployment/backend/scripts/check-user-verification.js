#!/usr/bin/env node

/**
 * Script to check user verification status and provide manual verification URL
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserVerification(email) {
  try {
    if (!email) {
      console.error('Please provide an email address as argument');
      console.log('Usage: node check-user-verification.js user@example.com');
      process.exit(1);
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        isApproved: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
        createdAt: true,
        role: true
      }
    });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }
    
    console.log('\n📧 User Details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Created: ${user.createdAt}`);
    console.log(`- Email Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`- Account Approved: ${user.isApproved ? '✅ Yes' : '❌ No'}`);
    
    if (!user.isEmailVerified && user.emailVerificationToken) {
      const isExpired = user.emailVerificationExpiry < new Date();
      console.log(`\n🔗 Email Verification:`);
      console.log(`- Token: ${user.emailVerificationToken}`);
      console.log(`- Expires: ${user.emailVerificationExpiry} ${isExpired ? '(EXPIRED)' : '(VALID)'}`);
      
      const baseUrl = process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com';
      const verificationUrl = `${baseUrl}/verify-email?token=${user.emailVerificationToken}`;
      
      console.log(`\n📎 Manual Verification URL:`);
      console.log(verificationUrl);
      
      if (isExpired) {
        console.log('\n⚠️  Token has expired. User needs to request a new verification email.');
      }
    }
    
    if (user.isEmailVerified && !user.isApproved) {
      console.log('\n⏳ User has verified email but is waiting for admin approval.');
    }
    
    if (user.isEmailVerified && user.isApproved) {
      console.log('\n✅ User is fully verified and approved. They should be able to log in.');
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
checkUserVerification(email);