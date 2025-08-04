#!/usr/bin/env node

/**
 * Script to manually verify and/or approve a user
 * Usage: node manual-verify-user.js email@example.com [--verify] [--approve]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manualVerifyUser(email, options) {
  try {
    if (!email) {
      console.error('Please provide an email address as argument');
      console.log('Usage: node manual-verify-user.js user@example.com [--verify] [--approve]');
      process.exit(1);
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return;
    }
    
    console.log('\n📧 Current User Status:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Email Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`- Account Approved: ${user.isApproved ? '✅ Yes' : '❌ No'}`);
    
    const updates = {};
    
    if (options.verify && !user.isEmailVerified) {
      updates.isEmailVerified = true;
      updates.emailVerificationToken = null;
      updates.emailVerificationExpiry = null;
      console.log('\n✅ Will verify email');
    }
    
    if (options.approve && !user.isApproved) {
      updates.isApproved = true;
      console.log('✅ Will approve account');
    }
    
    if (Object.keys(updates).length > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
      
      console.log('\n🎉 User updated successfully!');
      console.log(`- Email Verified: ${updatedUser.isEmailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`- Account Approved: ${updatedUser.isApproved ? '✅ Yes' : '❌ No'}`);
      
      if (updatedUser.isEmailVerified && updatedUser.isApproved) {
        console.log('\n✅ User can now log in!');
      }
    } else {
      console.log('\n⚠️  No changes needed - user already has requested status');
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const options = {
  verify: args.includes('--verify'),
  approve: args.includes('--approve')
};

if (!options.verify && !options.approve) {
  console.log('⚠️  No action specified. Use --verify and/or --approve');
  console.log('Example: node manual-verify-user.js user@example.com --verify --approve');
} else {
  manualVerifyUser(email, options);
}