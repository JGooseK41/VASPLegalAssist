#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupFailedRegistrations() {
  console.log('🔍 Identifying failed registration entries...');
  
  try {
    // Find users that were created but never successfully completed registration
    // These are users that:
    // 1. Are not email verified
    // 2. Are not approved 
    // 3. Have no associated data (documents, templates, etc.)
    // 4. Were created recently (to avoid deleting legitimate pending users)
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // Only clean up entries from the last 24 hours
    
    const problematicUsers = await prisma.user.findMany({
      where: {
        isEmailVerified: false,
        isApproved: false,
        createdAt: {
          gte: cutoffDate
        }
      },
      include: {
        documents: true,
        templates: true,
        comments: true,
        vaspSubmissions: true
      }
    });
    
    console.log(`Found ${problematicUsers.length} potentially problematic user entries`);
    
    // Filter to only users with no associated data (likely failed registrations)
    const usersToDelete = problematicUsers.filter(user => 
      user.documents.length === 0 &&
      user.templates.length === 0 &&
      user.comments.length === 0 &&
      user.vaspSubmissions.length === 0
    );
    
    console.log(`${usersToDelete.length} users qualify for cleanup (no associated data)`);
    
    if (usersToDelete.length === 0) {
      console.log('✅ No failed registrations to clean up');
      return;
    }
    
    // Show which emails will be freed up
    console.log('\n📧 Emails that will be freed up for re-registration:');
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (created: ${user.createdAt})`);
    });
    
    console.log(`\n🧹 Deleting ${usersToDelete.length} failed registration entries...`);
    
    // Delete the problematic users
    const userIds = usersToDelete.map(user => user.id);
    
    // Delete related records first (if any)
    await prisma.userSession.deleteMany({
      where: { userId: { in: userIds } }
    });
    
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: userIds } }
    });
    
    // Delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { in: userIds }
      }
    });
    
    console.log(`✅ Successfully cleaned up ${deleteResult.count} failed registration entries`);
    console.log('🎉 These email addresses can now be used for fresh registrations!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
console.log('🚀 Starting failed registration cleanup...');
console.log('This will remove user entries that failed to complete registration');
console.log('and have no associated data, freeing up their emails for re-use.\n');

cleanupFailedRegistrations();