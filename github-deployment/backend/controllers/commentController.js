const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get comments for a specific VASP
const getVaspComments = async (req, res) => {
  try {
    const { vaspId } = req.params;
    
    const comments = await prisma.vaspComment.findMany({
      where: { 
        vaspId: parseInt(vaspId) 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        },
        votes: {
          where: {
            userId: req.userId
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: [
        { voteScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Format comments with vote info
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      isUpdate: comment.isUpdate,
      voteScore: comment.voteScore,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName}`,
        agency: comment.user.agencyName
      },
      userVote: comment.votes.length > 0 ? comment.votes[0].value : 0,
      totalVotes: comment._count.votes
    }));
    
    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { vaspId } = req.params;
    const { content, isUpdate } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const comment = await prisma.vaspComment.create({
      data: {
        userId: req.userId,
        vaspId: parseInt(vaspId),
        content: content.trim(),
        isUpdate: isUpdate || false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        }
      }
    });
    
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      isUpdate: comment.isUpdate,
      voteScore: 0,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName}`,
        agency: comment.user.agencyName
      },
      userVote: 0,
      totalVotes: 0
    };
    
    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Update a comment (only by the author)
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Check if user owns the comment
    const existingComment = await prisma.vaspComment.findUnique({
      where: { id: commentId }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (existingComment.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }
    
    const updatedComment = await prisma.vaspComment.update({
      where: { id: commentId },
      data: { 
        content: content.trim(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            agencyName: true
          }
        },
        votes: {
          where: {
            userId: req.userId
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    });
    
    const formattedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      isUpdate: updatedComment.isUpdate,
      voteScore: updatedComment.voteScore,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      user: {
        id: updatedComment.user.id,
        name: `${updatedComment.user.firstName} ${updatedComment.user.lastName}`,
        agency: updatedComment.user.agencyName
      },
      userVote: updatedComment.votes.length > 0 ? updatedComment.votes[0].value : 0,
      totalVotes: updatedComment._count.votes
    };
    
    res.json(formattedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete a comment (only by the author or admin)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if user owns the comment or is admin
    const existingComment = await prisma.vaspComment.findUnique({
      where: { id: commentId }
    });
    
    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (existingComment.userId !== req.userId && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }
    
    await prisma.vaspComment.delete({
      where: { id: commentId }
    });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Vote on a comment
const voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { value } = req.body;
    
    // Validate vote value
    if (value !== 1 && value !== -1 && value !== 0) {
      return res.status(400).json({ error: 'Invalid vote value. Must be 1, -1, or 0' });
    }
    
    // Check if comment exists
    const comment = await prisma.vaspComment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check for existing vote
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: req.userId,
          commentId: commentId
        }
      }
    });
    
    let oldVoteValue = existingVote ? existingVote.value : 0;
    let newVoteScore = comment.voteScore;
    
    // Handle vote changes
    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await prisma.commentVote.delete({
          where: { id: existingVote.id }
        });
        newVoteScore -= oldVoteValue;
      }
    } else {
      if (existingVote) {
        // Update existing vote
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { value }
        });
        newVoteScore = newVoteScore - oldVoteValue + value;
      } else {
        // Create new vote
        await prisma.commentVote.create({
          data: {
            userId: req.userId,
            commentId: commentId,
            value
          }
        });
        newVoteScore += value;
      }
    }
    
    // Update comment's vote score
    await prisma.vaspComment.update({
      where: { id: commentId },
      data: { voteScore: newVoteScore }
    });
    
    res.json({ 
      voteScore: newVoteScore,
      userVote: value
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
};

module.exports = {
  getVaspComments,
  createComment,
  updateComment,
  deleteComment,
  voteComment
};