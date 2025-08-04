const prisma = require('../config/database');

const adminAuth = async (req, res, next) => {
  try {
    console.log('Admin middleware: Checking admin access');
    console.log('Admin middleware: req.userId:', req.userId);
    console.log('Admin middleware: req.userRole from auth middleware:', req.userRole);
    
    // This middleware should be used after the regular auth middleware
    // so req.userId is already set
    if (!req.userId) {
      console.log('Admin middleware: No userId found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      console.log('Admin middleware: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Admin middleware: User found, role:', user.role);

    if (user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      console.log('Admin middleware: User does not have admin role. User role:', user.role);
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.userRole = user.role; // Make sure role is available in request
    console.log('Admin middleware: Admin access granted for user with role:', user.role);
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = adminAuth;