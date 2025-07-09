const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminAuth = async (req, res, next) => {
  try {
    // This middleware should be used after the regular auth middleware
    // so req.userId is already set
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.userRole = user.role; // Make sure role is available in request
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = adminAuth;