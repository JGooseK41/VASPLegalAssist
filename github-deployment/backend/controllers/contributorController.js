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
      
      const totalScore = vaspPoints + upvotePoints + commentPoints;
      
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
          commentPoints
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
      
      const totalScore = vaspPoints + upvotePoints + commentPoints;
      
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
          commentPoints
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

module.exports = {
  getTopContributor,
  getLeaderboard
};