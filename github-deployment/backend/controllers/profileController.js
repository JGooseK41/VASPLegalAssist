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
    const { firstName, lastName, agencyName, agencyAddress, badgeNumber, title, phone, leaderboardOptOut } = req.body;

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

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        agencyName,
        agencyAddress,
        badgeNumber,
        title,
        phone,
        leaderboardOptOut
      },
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

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};