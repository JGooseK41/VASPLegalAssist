const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to update leaderboard history and streaks
const updateLeaderboardHistory = async (leaderboard) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get yesterday's leaderboard for comparison
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
    
    try {
      // Create or update today's leaderboard entry
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
      
      // Check if user was on leaderboard yesterday
      if (yesterdayUserIds.has(entry.userId)) {
        // Continue streak
        newStreak = (user.currentLeaderboardStreak || 0) + 1;
      } else if (user.lastOnLeaderboard) {
        // Check if it's been more than 1 day since last on leaderboard
        const daysSinceLastOnLeaderboard = Math.floor(
          (today.getTime() - new Date(user.lastOnLeaderboard).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastOnLeaderboard > 1) {
          // Streak broken - start new streak
          newStreak = 1;
        } else {
          // Continue streak (was on leaderboard within last day)
          newStreak = (user.currentLeaderboardStreak || 0) + 1;
        }
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
    } catch (error) {
      console.error(`Error updating leaderboard history for user ${entry.userId}:`, error);
    }
  }
  
  // Reset streaks for users who fell off the leaderboard
  const todayUserIds = new Set(leaderboard.map(entry => entry.userId));
  
  for (const yesterdayEntry of yesterdayLeaderboard) {
    if (!todayUserIds.has(yesterdayEntry.userId)) {
      await prisma.user.update({
        where: { id: yesterdayEntry.userId },
        data: {
          currentLeaderboardStreak: 0
        }
      });
    }
  }
};

// Get top contributors based on scoring system
const getTopContributor = async (req, res) => {
  try {
    // Get all users except admins with their contribution data
    const users = await prisma.user.findMany({
      where: {
        role: { 
          notIn: ['ADMIN', 'MASTER_ADMIN'] 
        },
        leaderboardOptOut: false
      },
      include: {
        // Get accepted VASP submissions
        vaspSubmissions: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true
          }
        },
        // Get comments with their vote scores
        comments: {
          select: {
            id: true,
            voteScore: true
          }
        },
        // Get votes given by the user
        votes: {
          where: {
            value: 1 // Only count upvotes
          },
          select: {
            id: true
          }
        },
        // Get VASP responses submitted by the user
        vaspResponses: {
          select: {
            id: true
          }
        },
        // Get approved VASP update requests
        vaspUpdateRequests: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true
          }
        }
      }
    });

    // Calculate scores for each user
    const userScores = users.map(user => {
      // 10 points per accepted VASP submission
      const vaspPoints = user.vaspSubmissions.length * 10;
      
      // 5 points per upvote received on comments
      const upvotePoints = user.comments.reduce((total, comment) => {
        return total + (comment.voteScore > 0 ? comment.voteScore * 5 : 0);
      }, 0);
      
      // 1 point per comment made
      const commentPoints = user.comments.length * 1;
      
      // 5 points per VASP response logged
      const vaspResponsePoints = user.vaspResponses.length * 5;
      
      // 10 points per approved VASP update request
      const updatePoints = user.vaspUpdateRequests.length * 10;
      
      const totalScore = vaspPoints + upvotePoints + commentPoints + vaspResponsePoints + updatePoints;
      
      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        agencyName: user.agencyName,
        score: totalScore,
        createdAt: user.createdAt, // Add creation date for secondary sorting
        breakdown: {
          acceptedVasps: user.vaspSubmissions.length,
          vaspPoints,
          upvotesReceived: user.comments.reduce((total, comment) => 
            total + (comment.voteScore > 0 ? comment.voteScore : 0), 0),
          upvotePoints,
          commentsCount: user.comments.length,
          commentPoints,
          vaspResponses: user.vaspResponses.length,
          vaspResponsePoints,
          approvedUpdates: user.vaspUpdateRequests.length,
          updatePoints
        }
      };
    });

    // Sort by score (primary), then by account creation date (secondary), then by userId (tertiary)
    // This ensures consistent ordering when users have the same score
    userScores.sort((a, b) => {
      // First sort by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by account creation date (earlier users rank higher)
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // Final fallback: sort by userId alphabetically for absolute consistency
      return a.userId.localeCompare(b.userId);
    });
    const topContributor = userScores[0] || null;

    res.json(topContributor);
  } catch (error) {
    console.error('Error getting top contributor:', error);
    res.status(500).json({ error: 'Failed to fetch top contributor' });
  }
};

// Get contributor leaderboard (top 10)
const getLeaderboard = async (req, res) => {
  try {
    // Get all users except admins with their contribution data
    const users = await prisma.user.findMany({
      where: {
        role: { 
          notIn: ['ADMIN', 'MASTER_ADMIN'] 
        },
        leaderboardOptOut: false
      },
      include: {
        // Get accepted VASP submissions
        vaspSubmissions: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true
          }
        },
        // Get comments with their vote scores
        comments: {
          select: {
            id: true,
            voteScore: true
          }
        },
        // Get votes given by the user
        votes: {
          where: {
            value: 1 // Only count upvotes
          },
          select: {
            id: true
          }
        },
        // Get VASP responses submitted by the user
        vaspResponses: {
          select: {
            id: true
          }
        },
        // Get approved VASP update requests
        vaspUpdateRequests: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true
          }
        }
      }
    });

    // Calculate scores for each user
    const userScores = users.map(user => {
      // 10 points per accepted VASP submission
      const vaspPoints = user.vaspSubmissions.length * 10;
      
      // 5 points per upvote received on comments
      const upvotePoints = user.comments.reduce((total, comment) => {
        return total + (comment.voteScore > 0 ? comment.voteScore * 5 : 0);
      }, 0);
      
      // 1 point per comment made
      const commentPoints = user.comments.length * 1;
      
      // 5 points per VASP response logged
      const vaspResponsePoints = user.vaspResponses.length * 5;
      
      // 10 points per approved VASP update request
      const updatePoints = user.vaspUpdateRequests.length * 10;
      
      const totalScore = vaspPoints + upvotePoints + commentPoints + vaspResponsePoints + updatePoints;
      
      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        agencyName: user.agencyName,
        score: totalScore,
        createdAt: user.createdAt, // Add creation date for secondary sorting
        breakdown: {
          acceptedVasps: user.vaspSubmissions.length,
          vaspPoints,
          upvotesReceived: user.comments.reduce((total, comment) => 
            total + (comment.voteScore > 0 ? comment.voteScore : 0), 0),
          upvotePoints,
          commentsCount: user.comments.length,
          commentPoints,
          vaspResponses: user.vaspResponses.length,
          vaspResponsePoints,
          approvedUpdates: user.vaspUpdateRequests.length,
          updatePoints
        }
      };
    });

    // Sort by score (primary), then by account creation date (secondary), then by userId (tertiary)
    // This ensures consistent ordering when users have the same score
    userScores.sort((a, b) => {
      // First sort by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by account creation date (earlier users rank higher)
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // Final fallback: sort by userId alphabetically for absolute consistency
      return a.userId.localeCompare(b.userId);
    });
    const leaderboard = userScores.slice(0, 10);

    // Update leaderboard history and streaks
    await updateLeaderboardHistory(leaderboard);

    // Get streak information for each user
    const leaderboardWithStreaks = await Promise.all(leaderboard.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { 
          currentLeaderboardStreak: true,
          longestLeaderboardStreak: true 
        }
      });
      
      return {
        ...entry,
        currentStreak: user?.currentLeaderboardStreak || 0,
        longestStreak: user?.longestLeaderboardStreak || 0
      };
    }));

    res.json({
      leaderboard: leaderboardWithStreaks,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// Get current user's score
const getUserScore = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate score
    const submissionPoints = user.vaspSubmissions.length * 10;
    const commentPoints = user.comments.length * 1;
    const upvotePoints = user.comments.reduce((sum, comment) => sum + (comment.voteScore > 0 ? comment.voteScore * 5 : 0), 0);
    const responsePoints = user.vaspResponses.length * 5;
    const updatePoints = user.vaspUpdateRequests.length * 10;
    const totalPoints = submissionPoints + commentPoints + upvotePoints + responsePoints + updatePoints;
    
    res.json({
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      totalPoints,
      breakdown: {
        submissions: submissionPoints,
        comments: commentPoints,
        upvotes: upvotePoints,
        responses: responsePoints,
        updates: updatePoints
      }
    });
  } catch (error) {
    console.error('Get user score error:', error);
    res.status(500).json({ error: 'Failed to get user score' });
  }
};

// Check if user has reached a milestone
const checkMilestone = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's current score
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        },
        milestoneNotifications: {
          orderBy: { milestone: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user) {
      return res.json({ milestone: null });
    }
    
    // Calculate total points
    const submissionPoints = user.vaspSubmissions.length * 10;
    const commentPoints = user.comments.length * 1;
    const upvotePoints = user.comments.reduce((sum, comment) => sum + (comment.voteScore > 0 ? comment.voteScore * 5 : 0), 0);
    const responsePoints = user.vaspResponses.length * 5;
    const updatePoints = user.vaspUpdateRequests.length * 10;
    const totalPoints = submissionPoints + commentPoints + upvotePoints + responsePoints + updatePoints;
    
    // Determine milestones (1, 100, 200, 300, etc.)
    let currentMilestone = 0;
    if (totalPoints >= 1) {
      currentMilestone = 1;
      if (totalPoints >= 100) {
        currentMilestone = Math.floor(totalPoints / 100) * 100;
      }
    }
    
    // Check if this milestone has already been shown
    const lastMilestoneShown = user.lastMilestoneShown || 0;
    
    if (currentMilestone > lastMilestoneShown) {
      // Update last milestone shown
      await prisma.user.update({
        where: { id: userId },
        data: { lastMilestoneShown: currentMilestone }
      });
      
      // Create notification record
      await prisma.milestoneNotification.create({
        data: {
          userId,
          milestone: currentMilestone
        }
      });
      
      let type = 'FIRST_POINT';
      if (currentMilestone === 100) {
        type = 'MILESTONE_100';
      } else if (currentMilestone > 100) {
        type = 'MILESTONE_MULTIPLE';
      }
      
      return res.json({
        milestone: {
          points: currentMilestone,
          type,
          totalPoints
        }
      });
    }
    
    res.json({ milestone: null });
  } catch (error) {
    console.error('Check milestone error:', error);
    res.status(500).json({ error: 'Failed to check milestone' });
  }
};

// Submit milestone feedback
const submitMilestoneFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const { milestone, discoverySource, suggestions, feedbackType } = req.body;
    
    // Create feedback record
    await prisma.contributorFeedback.create({
      data: {
        userId,
        milestone,
        discoverySource,
        suggestions,
        feedbackType
      }
    });
    
    // Mark milestone as acknowledged
    await prisma.milestoneNotification.updateMany({
      where: {
        userId,
        milestone
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// Acknowledge milestone without feedback
const acknowledgeMilestone = async (req, res) => {
  try {
    const userId = req.userId;
    const { milestone } = req.body;
    
    await prisma.milestoneNotification.updateMany({
      where: {
        userId,
        milestone
      },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Acknowledge milestone error:', error);
    res.status(500).json({ error: 'Failed to acknowledge milestone' });
  }
};

// Check if user made leaderboard for first time
const checkLeaderboardAchievement = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstLeaderboardShown: true,
        currentLeaderboardStreak: true
      }
    });
    
    if (!user) {
      return res.json({ firstTime: false });
    }
    
    // Check if user is currently on leaderboard and hasn't been notified
    if (user.currentLeaderboardStreak > 0 && !user.firstLeaderboardShown) {
      return res.json({ firstTime: true });
    }
    
    res.json({ firstTime: false });
  } catch (error) {
    console.error('Check leaderboard achievement error:', error);
    res.status(500).json({ error: 'Failed to check leaderboard achievement' });
  }
};

// Acknowledge leaderboard achievement
const acknowledgeLeaderboardAchievement = async (req, res) => {
  try {
    const userId = req.userId;
    
    await prisma.user.update({
      where: { id: userId },
      data: { firstLeaderboardShown: true }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Acknowledge leaderboard achievement error:', error);
    res.status(500).json({ error: 'Failed to acknowledge achievement' });
  }
};

module.exports = {
  getTopContributor,
  getLeaderboard,
  getUserScore,
  checkMilestone,
  submitMilestoneFeedback,
  acknowledgeMilestone,
  checkLeaderboardAchievement,
  acknowledgeLeaderboardAchievement
};