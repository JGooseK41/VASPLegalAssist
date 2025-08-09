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

// GET /api/auth/verify-email
router.get('/verify-email', verifyEmail);

// POST /api/auth/verify-email (temporary fallback for deployment transition)
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

// GET /api/auth/health - Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      jwt_configured: !!process.env.JWT_SECRET,
      database_url_configured: !!process.env.DATABASE_URL,
      sendgrid_configured: !!process.env.SENDGRID_API_KEY,
      client_url: process.env.CLIENT_URL || 'not set',
      app_url: process.env.APP_URL || 'not set'
    }
  };

  // Try database connection
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    health.checks.database_connected = true;
  } catch (error) {
    health.checks.database_connected = false;
    health.checks.database_error = error.message;
  }

  res.json(health);
});

// Admin Application Routes
const { submitAdminApplication, getMyAdminApplication } = require('../controllers/authController');

// POST /api/auth/admin-application
router.post('/admin-application', requireAuth, submitAdminApplication);

// GET /api/auth/admin-application
router.get('/admin-application', requireAuth, getMyAdminApplication);

module.exports = router;