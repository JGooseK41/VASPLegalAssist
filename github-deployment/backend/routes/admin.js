const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const {
  // VASP Management
  getVasps,
  createVasp,
  updateVasp,
  deleteVasp,
  
  // User Management
  getUsers,
  approveUser,
  verifyUserEmail,
  rejectUser,
  updateUserRole,
  deleteUser,
  getUserFeedback,
  
  // Admin Applications
  getAdminApplications,
  approveAdminApplication,
  rejectAdminApplication,
  
  // VASP Submissions
  getSubmissions,
  approveSubmission,
  rejectSubmission,
  
  // Dashboard
  getDashboardStats,
  
  // Update Requests
  getUpdateRequests,
  processUpdateRequest,
  
  // Update Notifications
  getUpdateNotifications,
  processUpdateNotification
} = require('../controllers/adminController');

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Admin routes are accessible',
    timestamp: new Date().toISOString()
  });
});

// All routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Dashboard stats
router.get('/stats', getDashboardStats);

// VASP Management routes
router.get('/vasps', getVasps);
router.post('/vasps', createVasp);
router.put('/vasps/:id', updateVasp);
router.delete('/vasps/:id', deleteVasp);

// User Management routes
router.get('/users', getUsers);
router.post('/users/:userId/approve', approveUser);
router.post('/users/:userId/verify-email', verifyUserEmail);
router.delete('/users/:userId/reject', rejectUser);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);
router.get('/users/:userId/feedback', getUserFeedback);

// VASP Submission Management
router.get('/submissions', getSubmissions);
router.post('/submissions/:submissionId/approve', approveSubmission);
router.post('/submissions/:submissionId/reject', rejectSubmission);

// Update Request Management
router.get('/update-requests', getUpdateRequests);
router.put('/update-requests/:id', processUpdateRequest);

// Update Notifications from comments
router.get('/update-notifications', getUpdateNotifications);
router.put('/update-notifications/:notificationId/process', processUpdateNotification);

// Admin Applications
router.get('/admin-applications', getAdminApplications);
router.put('/admin-applications/:applicationId/approve', approveAdminApplication);
router.put('/admin-applications/:applicationId/reject', rejectAdminApplication);

module.exports = router;