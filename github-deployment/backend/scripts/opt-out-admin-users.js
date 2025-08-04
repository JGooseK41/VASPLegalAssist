#!/usr/bin/env node

/**
 * Script to opt out all admin users from the leaderboard
 * This ensures admins don't appear in top contributor lists
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function optOutAdminUsers() {
  try {
    console.log('Starting admin user opt-out process...');
    
    // Find all admin users who are not opted out
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'MASTER_ADMIN']
        },
        leaderboardOptOut: false
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (adminUsers.length === 0) {
      console.log('✓ No admin users need to be opted out');
      return;
    }
    
    console.log(`Found ${adminUsers.length} admin users to opt out:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
    });
    
    // Update all admin users to opt out of leaderboard
    const result = await prisma.user.updateMany({
      where: {
        role: {
          in: ['ADMIN', 'MASTER_ADMIN']
        }
      },
      data: {
        leaderboardOptOut: true
      }
    });
    
    console.log(`\n✓ Successfully opted out ${result.count} admin users from the leaderboard`);
    
    // Verify the update
    const remainingAdmins = await prisma.user.count({
      where: {
        role: {
          in: ['ADMIN', 'MASTER_ADMIN']
        },
        leaderboardOptOut: false
      }
    });
    
    if (remainingAdmins === 0) {
      console.log('✓ All admin users are now opted out of the leaderboard');
    } else {
      console.log(`⚠️  WARNING: ${remainingAdmins} admin users are still not opted out`);
    }
    
  } catch (error) {
    console.error('Error opting out admin users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
optOutAdminUsers();