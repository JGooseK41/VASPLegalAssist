#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAdminLeaderboard() {
  console.log('Starting admin leaderboard cleanup...');
  
  try {
    // First, find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users`);
    
    for (const admin of adminUsers) {
      console.log(`\nChecking admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
      
      // Check if this admin has any leaderboard history entries
      const adminLeaderboardEntries = await prisma.leaderboardHistory.findMany({
        where: {
          userId: admin.id
        }
      });
      
      if (adminLeaderboardEntries.length > 0) {
        console.log(`  Found ${adminLeaderboardEntries.length} leaderboard entries for this admin`);
        
        // Delete all leaderboard history entries for this admin
        const deleteResult = await prisma.leaderboardHistory.deleteMany({
          where: {
            userId: admin.id
          }
        });
        
        console.log(`  Deleted ${deleteResult.count} leaderboard entries`);
        
        // Reset the admin's leaderboard-related fields
        await prisma.user.update({
          where: { id: admin.id },
          data: {
            currentLeaderboardStreak: 0,
            longestLeaderboardStreak: 0,
            lastOnLeaderboard: null
          }
        });
        
        console.log('  Reset leaderboard streak data for admin');
      } else {
        console.log('  No leaderboard entries found for this admin');
      }
    }
    
    // Verify no admins remain in leaderboard history
    const remainingAdminEntries = await prisma.leaderboardHistory.findMany({
      where: {
        user: {
          role: 'ADMIN'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    if (remainingAdminEntries.length > 0) {
      console.error('\nWARNING: Still found admin entries in leaderboard history:');
      remainingAdminEntries.forEach(entry => {
        console.error(`  - User: ${entry.user.email}, Role: ${entry.user.role}`);
      });
    } else {
      console.log('\n✅ Successfully cleaned up all admin entries from leaderboard history');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAdminLeaderboard();