const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
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

// Export as default for compatibility with routes
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.demoMiddleware = demoMiddleware;