#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDailyLeaderboard() {
  console.log('Starting daily leaderboard update...');
  
  try {
    // Get all users except admins with their contribution data
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
        leaderboardOptOut: false
      },
      include: {
        vaspSubmissions: {
          where: { status: 'APPROVED' },
          select: { id: true }
        },
        comments: {
          select: { 
            id: true,
            voteScore: true 
          }
        },
        vaspResponses: {
          select: { id: true }
        },
        vaspUpdateRequests: {
          where: { status: 'APPROVED' },
          select: { id: true }
        }
      }
    });

    // Calculate scores for each user
    const userScores = users.map(user => {
      const vaspPoints = user.vaspSubmissions.length * 10;
      const upvotePoints = user.comments.reduce((total, comment) => {
        return total + (comment.voteScore > 0 ? comment.voteScore * 5 : 0);
      }, 0);
      const commentPoints = user.comments.length * 1;
      const vaspResponsePoints = user.vaspResponses.length * 5;
      const updatePoints = user.vaspUpdateRequests.length * 10;
      const totalScore = vaspPoints + upvotePoints + commentPoints + vaspResponsePoints + updatePoints;
      
      return {
        userId: user.id,
        score: totalScore
      };
    });

    // Sort by score and get top 10
    userScores.sort((a, b) => b.score - a.score);
    const leaderboard = userScores.slice(0, 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's leaderboard
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayLeaderboard = await prisma.leaderboardHistory.findMany({
      where: {
        date: {
          gte: yesterday,
          lt: today
        }
      }
    });
    
    const yesterdayUserIds = new Set(yesterdayLeaderboard.map(entry => entry.userId));
    
    // Process today's leaderboard
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const position = i + 1;
      
      console.log(`Processing position ${position}: User ${entry.userId} with ${entry.score} points`);
      
      // Create today's leaderboard entry
      await prisma.leaderboardHistory.upsert({
        where: {
          userId_date: {
            userId: entry.userId,
            date: today
          }
        },
        update: {
          position,
          points: entry.score
        },
        create: {
          userId: entry.userId,
          position,
          points: entry.score,
          date: today
        }
      });
      
      // Update user's streak
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: {
          currentLeaderboardStreak: true,
          longestLeaderboardStreak: true,
          lastOnLeaderboard: true
        }
      });
      
      let newStreak = 1;
      
      if (yesterdayUserIds.has(entry.userId)) {
        // User was on leaderboard yesterday - continue streak
        newStreak = (user.currentLeaderboardStreak || 0) + 1;
        console.log(`  - Continuing streak: ${newStreak} days`);
      } else {
        // New to leaderboard or returning after break
        console.log(`  - Starting new streak`);
      }
      
      const longestStreak = Math.max(newStreak, user.longestLeaderboardStreak || 0);
      
      await prisma.user.update({
        where: { id: entry.userId },
        data: {
          currentLeaderboardStreak: newStreak,
          longestLeaderboardStreak: longestStreak,
          lastOnLeaderboard: today
        }
      });
    }
    
    // Reset streaks for users who fell off the leaderboard
    const todayUserIds = new Set(leaderboard.map(entry => entry.userId));
    
    for (const yesterdayEntry of yesterdayLeaderboard) {
      if (!todayUserIds.has(yesterdayEntry.userId)) {
        console.log(`User ${yesterdayEntry.userId} fell off leaderboard - resetting streak`);
        await prisma.user.update({
          where: { id: yesterdayEntry.userId },
          data: {
            currentLeaderboardStreak: 0
          }
        });
      }
    }
    
    console.log('Daily leaderboard update completed successfully!');
    
  } catch (error) {
    console.error('Error updating daily leaderboard:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateDailyLeaderboard();