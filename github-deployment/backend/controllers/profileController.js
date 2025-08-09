const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const getProfile = async (req, res) => {
  try {
    // Check for demo user
    if (req.userId === 'demo-user-id') {
      return res.json({
        id: 'demo-user-id',
        email: 'demo@theblockaudit.com',
        firstName: 'Demo',
        lastName: 'User',
        agencyName: 'Demo Law Enforcement Agency',
        agencyAddress: '123 Demo Street, Washington, DC 20001',
        badgeNumber: 'DEMO-001',
        title: 'Special Agent',
        phone: '(555) 123-4567',
        role: 'DEMO',
        leaderboardOptOut: false,
        createdAt: new Date().toISOString()
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        agencyName: true,
        agencyAddress: true,
        badgeNumber: true,
        title: true,
        phone: true,
        role: true,
        leaderboardOptOut: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      agencyName, 
      agencyAddress, 
      badgeNumber, 
      title, 
      phone, 
      leaderboardOptOut,
      tutorialOptOut,
      lastChampionPopupShown 
    } = req.body;

    // Demo user cannot be updated
    if (req.userId === 'demo-user-id') {
      return res.json({
        id: 'demo-user-id',
        email: 'demo@theblockaudit.com',
        firstName: 'Demo',
        lastName: 'User',
        agencyName: 'Demo Law Enforcement Agency',
        agencyAddress: '123 Demo Street, Washington, DC 20001',
        badgeNumber: 'DEMO-001',
        title: 'Special Agent',
        phone: '(555) 123-4567',
        role: 'DEMO',
        leaderboardOptOut: false
      });
    }

    // Build update data object, only including defined values
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (agencyName !== undefined) updateData.agencyName = agencyName;
    if (agencyAddress !== undefined) updateData.agencyAddress = agencyAddress;
    if (badgeNumber !== undefined) updateData.badgeNumber = badgeNumber;
    if (title !== undefined) updateData.title = title;
    if (phone !== undefined) updateData.phone = phone;
    if (leaderboardOptOut !== undefined) updateData.leaderboardOptOut = leaderboardOptOut;
    if (tutorialOptOut !== undefined) updateData.tutorialOptOut = tutorialOptOut;
    if (lastChampionPopupShown !== undefined) updateData.lastChampionPopupShown = new Date(lastChampionPopupShown);

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        agencyName: true,
        agencyAddress: true,
        badgeNumber: true,
        title: true,
        phone: true,
        role: true,
        leaderboardOptOut: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Demo user cannot change password
    if (req.userId === 'demo-user-id') {
      return res.status(403).json({ error: 'Demo account password cannot be changed' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const updateSurveyReminderShown = async (req, res) => {
  try {
    // Demo user doesn't need tracking
    if (req.userId === 'demo-user-id') {
      return res.json({ success: true });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        lastSurveyReminderShown: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update survey reminder error:', error);
    res.status(500).json({ error: 'Failed to update survey reminder' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password, confirmText } = req.body;

    // Demo user cannot be deleted
    if (req.userId === 'demo-user-id') {
      return res.status(403).json({ error: 'Demo account cannot be deleted' });
    }

    // Verify confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ error: 'Please type "DELETE MY ACCOUNT" to confirm' });
    }

    // Get user and verify password
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Get all documents to delete their files
    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      select: { 
        pdfUrl: true, 
        filePath: true 
      }
    });

    // Get all templates to delete their files
    const templates = await prisma.documentTemplate.findMany({
      where: { userId: req.userId },
      select: { 
        fileUrl: true 
      }
    });

    // Delete user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's documents
      await tx.document.deleteMany({
        where: { userId: req.userId }
      });

      // Delete user's templates
      await tx.documentTemplate.deleteMany({
        where: { userId: req.userId }
      });

      // Delete user's comments
      await tx.vaspComment.deleteMany({
        where: { userId: req.userId }
      });

      // Delete user's votes
      await tx.commentVote.deleteMany({
        where: { userId: req.userId }
      });

      // Delete user's VASP submissions
      await tx.vaspSubmission.deleteMany({
        where: { userId: req.userId }
      });

      // Delete user's VASP responses
      await tx.vaspResponse.deleteMany({
        where: { userId: req.userId }
      });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId: req.userId }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: req.userId }
      });
    });

    // Delete files from storage after successful database deletion
    const fs = require('fs').promises;
    const path = require('path');

    // Delete document files
    for (const doc of documents) {
      if (doc.pdfUrl) {
        try {
          // Extract filename from URL
          const filename = doc.pdfUrl.split('/').pop();
          const filePath = path.join(__dirname, '../../uploads', filename);
          await fs.unlink(filePath).catch(() => {}); // Ignore errors if file doesn't exist
        } catch (err) {
          console.error('Error deleting document file:', err);
        }
      }
      
      if (doc.filePath) {
        try {
          await fs.unlink(doc.filePath).catch(() => {});
        } catch (err) {
          console.error('Error deleting document file:', err);
        }
      }
    }

    // Delete template files
    for (const template of templates) {
      if (template.fileUrl) {
        try {
          const filename = template.fileUrl.split('/').pop();
          const filePath = path.join(__dirname, '../../uploads/templates', filename);
          await fs.unlink(filePath).catch(() => {});
        } catch (err) {
          console.error('Error deleting template file:', err);
        }
      }
    }

    res.json({ message: 'Account and all associated files deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateSurveyReminderShown,
  deleteAccount
};