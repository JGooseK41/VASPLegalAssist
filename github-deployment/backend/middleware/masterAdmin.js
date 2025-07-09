const masterAdminAuth = (req, res, next) => {
  // Check if user is authenticated
  if (!req.userId || !req.userRole) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has MASTER_ADMIN role
  if (req.userRole !== 'MASTER_ADMIN') {
    return res.status(403).json({ error: 'Master admin access required' });
  }
  
  next();
};

module.exports = masterAdminAuth;