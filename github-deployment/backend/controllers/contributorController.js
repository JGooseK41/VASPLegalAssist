const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get top contributors based on scoring system
const getTopContributor = async (req, res) => {
  try {
    // Get all users except admins with their contribution data
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
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

    // Sort by score and get the top contributor
    userScores.sort((a, b) => b.score - a.score);
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
        role: { not: 'ADMIN' },
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

    // Sort by score and get top 10
    userScores.sort((a, b) => b.score - a.score);
    const leaderboard = userScores.slice(0, 10);

    res.json({
      leaderboard,
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

module.exports = {
  getTopContributor,
  getLeaderboard,
  getUserScore,
  checkMilestone,
  submitMilestoneFeedback,
  acknowledgeMilestone
};