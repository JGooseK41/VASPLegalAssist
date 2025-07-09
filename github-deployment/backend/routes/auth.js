const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword, validateResetToken, getMemberCount, verifyEmail, resendVerificationEmail } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', requireAuth, logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/validate-token/:token
router.get('/validate-token/:token', validateResetToken);

// GET /api/auth/member-count
router.get('/member-count', getMemberCount);

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationEmail);

// GET /api/auth/verify-token - Verify current token and return user info
router.get('/verify-token', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    userId: req.userId,
    userRole: req.userRole,
    message: 'Token is valid'
  });
});

module.exports = router;