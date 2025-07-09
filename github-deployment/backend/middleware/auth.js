const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Create a single instance of PrismaClient
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware: No token provided');
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Decoded token:', { userId: decoded.userId, role: decoded.role });
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Update last activity for the session (non-blocking)
    if (decoded.userId !== 'demo-user-id') {
      prisma.userSession.updateMany({
        where: {
          token,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        data: {
          lastActivity: new Date()
        }
      }).catch(err => console.error('Failed to update session activity:', err));
    }
    
    // Special handling for demo users - they don't exist in database
    if (decoded.userId === 'demo-user-id' && decoded.role === 'DEMO') {
      console.log('Auth middleware: Demo user authenticated');
      next();
      return;
    }
    
    // Check if user is approved (skip for admin users and master admin users)
    if (decoded.role !== 'ADMIN' && decoded.role !== 'MASTER_ADMIN') {
      console.log('Auth middleware: Checking approval for non-admin user, role:', decoded.role);
      
      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { isApproved: true, email: true, role: true }
        });
        
        console.log('Auth middleware: User lookup result:', user);
        
        if (!user || !user.isApproved) {
          console.log('Auth middleware: User not approved or not found');
          return res.status(403).json({ 
            error: 'Account pending approval',
            message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
            requiresApproval: true
          });
        }
      } catch (dbError) {
        console.error('Auth middleware: Database error during user lookup:', dbError);
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to verify user approval status'
        });
      }
    } else {
      console.log('Auth middleware: Skipping approval check for admin/master admin user, role:', decoded.role);
    }
    
    console.log('Auth middleware: Authentication successful');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
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
      console.log('RequireAuth: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('RequireAuth: Decoded token:', { userId: decoded.userId, role: decoded.role });
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    // Update last activity for the session (non-blocking)
    if (decoded.userId !== 'demo-user-id') {
      prisma.userSession.updateMany({
        where: {
          token,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        data: {
          lastActivity: new Date()
        }
      }).catch(err => console.error('Failed to update session activity:', err));
    }
    
    // Special handling for demo users - they don't exist in database
    if (decoded.userId === 'demo-user-id' && decoded.role === 'DEMO') {
      console.log('RequireAuth: Demo user authenticated');
      next();
      return;
    }
    
    // Check if user is approved (skip for admin users and master admin users)
    if (decoded.role !== 'ADMIN' && decoded.role !== 'MASTER_ADMIN') {
      console.log('RequireAuth: Checking approval for non-admin user, role:', decoded.role);
      
      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { isApproved: true, email: true, role: true }
        });
        
        console.log('RequireAuth: User lookup result:', user);
        
        if (!user || !user.isApproved) {
          console.log('RequireAuth: User not approved or not found');
          return res.status(403).json({ 
            error: 'Account pending approval',
            message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
            requiresApproval: true
          });
        }
      } catch (dbError) {
        console.error('RequireAuth: Database error during user lookup:', dbError);
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to verify user approval status'
        });
      }
    } else {
      console.log('RequireAuth: Skipping approval check for admin/master admin user, role:', decoded.role);
    }
    
    console.log('RequireAuth: Authentication successful');
    next();
  } catch (error) {
    console.error('RequireAuth error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Role-based access control
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Allow MASTER_ADMIN to access everything
    if (req.userRole === 'MASTER_ADMIN') {
      next();
      return;
    }
    
    if (req.userRole !== requiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource. This feature requires administrator privileges.',
        required: requiredRole,
        current: req.userRole
      });
    }
    
    next();
  };
};

// Check for admin-level roles (ADMIN or MASTER_ADMIN)
const requireAdminRole = () => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const adminRoles = ['ADMIN', 'MASTER_ADMIN'];
    if (!adminRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource. This feature requires administrator privileges.',
        required: 'ADMIN or MASTER_ADMIN',
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
module.exports.requireAdminRole = requireAdminRole;