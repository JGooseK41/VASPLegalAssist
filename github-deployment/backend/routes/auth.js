const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, validateResetToken } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/validate-token/:token
router.get('/validate-token/:token', validateResetToken);

module.exports = router;