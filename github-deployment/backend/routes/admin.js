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
  rejectUser,
  updateUserRole,
  
  // VASP Submissions
  getSubmissions,
  approveSubmission,
  rejectSubmission,
  
  // Dashboard
  getDashboardStats
} = require('../controllers/adminController');

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
router.delete('/users/:userId/reject', rejectUser);
router.put('/users/:userId/role', updateUserRole);

// VASP Submission Management
router.get('/submissions', getSubmissions);
router.post('/submissions/:submissionId/approve', approveSubmission);
router.post('/submissions/:submissionId/reject', rejectSubmission);

module.exports = router;