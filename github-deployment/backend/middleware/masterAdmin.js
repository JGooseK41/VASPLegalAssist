const masterAdminAuth = (req, res, next) => {
  console.log('Master Admin middleware: Checking master admin access');
  console.log('Master Admin middleware: req.userId:', req.userId);
  console.log('Master Admin middleware: req.userRole:', req.userRole);
  
  // Check if user is authenticated
  if (!req.userId || !req.userRole) {
    console.log('Master Admin middleware: Missing userId or userRole');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user has MASTER_ADMIN role
  if (req.userRole !== 'MASTER_ADMIN') {
    console.log('Master Admin middleware: User does not have MASTER_ADMIN role. Current role:', req.userRole);
    return res.status(403).json({ error: 'Master admin access required' });
  }
  
  console.log('Master Admin middleware: Master admin access granted');
  next();
};

module.exports = masterAdminAuth;