const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Check if user is approved (skip for demo users)
    if (decoded.role !== 'DEMO' && decoded.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isApproved: true }
      });
      
      if (!user || !user.isApproved) {
        return res.status(403).json({ 
          error: 'Account pending approval',
          message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
          requiresApproval: true
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const demoMiddleware = (req, res, next) => {
  // Allow demo users limited functionality
  if (req.userRole === 'DEMO') {
    // Prevent certain actions for demo users
    const restrictedActions = ['DELETE', 'PUT', 'POST'];
    if (restrictedActions.includes(req.method)) {
      return res.status(403).json({ 
        error: 'Demo users cannot save or modify data',
        message: 'This feature is restricted for demo accounts. Please upgrade to a full account to save documents and templates.',
        isDemo: true
      });
    }
  }
  next();
};

// Auth middleware for newer routes
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Check if user is approved (skip for demo users)
    if (decoded.role !== 'DEMO' && decoded.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isApproved: true }
      });
      
      if (!user || !user.isApproved) {
        return res.status(403).json({ 
          error: 'Account pending approval',
          message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
          requiresApproval: true
        });
      }
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Role-based access control
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.userRole !== requiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRole,
        current: req.userRole
      });
    }
    
    next();
  };
};

// Export as default for compatibility with routes
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.demoMiddleware = demoMiddleware;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;