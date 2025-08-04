const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: role === 'DEMO' ? '1h' : process.env.TOKEN_EXPIRY || '7d'
  });
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getBaseUrl = () => {
  let baseUrl = process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com';
  // Ensure we never use localhost in production
  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    console.warn('CLIENT_URL contains localhost in production, using default URL');
    baseUrl = 'https://theblockrecord.com';
  }
  return baseUrl;
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, agencyName, agencyAddress, badgeNumber, title, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password with stronger cost factor
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

    // Create user with email verification fields
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        agencyName,
        agencyAddress,
        badgeNumber,
        title,
        phone,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      }
    });

    // Create default templates for new user
    await createDefaultTemplates(user.id);

    // Send verification email
    const verificationUrl = `${getBaseUrl()}/verify-email?token=${verificationToken}`;
    emailService.sendEmailVerification(user.email, user.firstName, verificationUrl).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    // Send admin notification email (for new registrations)
    emailService.sendAdminNotification(user).catch(err => {
      console.error('Failed to send admin notification:', err);
    });

    // For admin and master admin users, generate token immediately
    if (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN') {
      const token = generateToken(user.id, user.role);
      
      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          agencyName: user.agencyName,
          agencyAddress: user.agencyAddress,
          role: user.role,
          isApproved: user.isApproved
        },
        token
      });
    }

    // For regular users, don't generate token - they need email verification and approval
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account. After verification, your account will need to be approved by an administrator.',
      requiresEmailVerification: true,
      requiresApproval: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyName: user.agencyName,
        agencyAddress: user.agencyAddress,
        role: user.role,
        isApproved: user.isApproved,
        isEmailVerified: user.isEmailVerified
      }
      // No token provided - user must verify email and wait for approval
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Check for demo account
    if (email === 'demo@theblockaudit.com' && password === 'Crypto') {
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@theblockaudit.com',
        firstName: 'Demo',
        lastName: 'User',
        agencyName: 'Demo Law Enforcement Agency',
        agencyAddress: '123 Demo Street, Washington, DC 20001',
        badgeNumber: 'DEMO-001',
        title: 'Special Agent',
        phone: '(555) 123-4567',
        role: 'DEMO',
        is_demo: true
      };

      const token = generateToken(demoUser.id, demoUser.role);
      
      return res.json({
        user: demoUser,
        token
      });
    }

    // Regular user login
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified (skip for admin users and master admin)
    if (!user.isEmailVerified && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        requiresEmailVerification: true
      });
    }

    // Check if user is approved (skip for admin users and master admin)
    if (!user.isApproved && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      return res.status(403).json({ 
        error: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
        requiresApproval: true
      });
    }

    console.log('Login: Creating token for user:', user.email, 'with role:', user.role);
    const token = generateToken(user.id, user.role);

    // Create user session
    const expiresAt = new Date();
    if (user.role === 'DEMO') {
      expiresAt.setHours(expiresAt.getHours() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        ipAddress,
        userAgent,
        expiresAt
      }
    });

    // Check for documents without responses from the past month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const documentsWithoutResponses = await prisma.document.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneMonthAgo
        },
        vaspResponses: {
          none: {}
        }
      }
    });

    // Check if we should show the survey reminder
    let shouldShowSurveyReminder = false;
    if (documentsWithoutResponses > 0) {
      // Check if we've shown the reminder in the past month
      const lastShown = user.lastSurveyReminderShown;
      if (!lastShown || (new Date() - lastShown) > 30 * 24 * 60 * 60 * 1000) {
        shouldShowSurveyReminder = true;
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyName: user.agencyName,
        agencyAddress: user.agencyAddress,
        role: user.role,
        lastSurveyReminderShown: user.lastSurveyReminderShown
      },
      token,
      surveyReminder: {
        shouldShow: shouldShowSurveyReminder,
        documentsWithoutResponses
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

const createDefaultTemplates = async (userId) => {
  const defaultTemplates = [
    {
      userId,
      templateType: 'LETTERHEAD',
      templateName: 'Default Letterhead',
      agencyHeader: '[Agency Name]\n[Agency Address]',
      agencyAddress: '[Street Address]\n[City, State ZIP]',
      agencyContact: 'Phone: [Phone]\nEmail: [Email]',
      footerText: 'This document is an official law enforcement request. Please respond within the specified timeframe.',
      signatureBlock: '[Name]\n[Title]\n[Badge Number]',
      isDefault: true
    },
    {
      userId,
      templateType: 'SUBPOENA',
      templateName: 'Default Subpoena',
      agencyHeader: 'UNITED STATES DISTRICT COURT\n[District Name]',
      agencyAddress: '[Court Address]',
      agencyContact: 'Case No: [Case Number]',
      footerText: 'Failure to comply with this subpoena may result in contempt of court.',
      signatureBlock: '[Name]\n[Title]\nUnited States [Agency]',
      isDefault: true
    }
  ];

  await prisma.documentTemplate.createMany({
    data: defaultTemplates
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt
      }
    });

    // Create reset URL
    const resetUrl = `${getBaseUrl()}/reset-password?token=${resetToken}`;
    
    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
      console.log('Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email sending failed to prevent user enumeration
    }
    
    // Always return the same message for security
    res.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions.',
      // Only show URL in development mode for testing
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Hash the token to match what's in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const passwordReset = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date()
        },
        used: false
      },
      include: {
        user: true
      }
    });

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: passwordReset.id },
        data: { used: true }
      })
    ]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const passwordReset = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date()
        },
        used: false
      }
    });

    res.json({ valid: !!passwordReset });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ valid: false });
  }
};

const getMemberCount = async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: {
        NOT: {
          role: 'DEMO'
        }
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get member count error:', error);
    res.status(500).json({ error: 'Failed to get member count' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });

    // Send welcome email
    emailService.sendWelcomeEmail(user.email, user.firstName).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    res.json({ 
      message: 'Email verified successfully! Your account is now pending administrator approval.',
      requiresApproval: !user.isApproved
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ 
        message: 'If an account exists with this email and is not yet verified, a new verification email will be sent.' 
      });
    }

    if (user.isEmailVerified) {
      return res.json({ 
        message: 'This email is already verified.' 
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      }
    });

    // Send verification email
    const verificationUrl = `${getBaseUrl()}/verify-email?token=${verificationToken}`;
    await emailService.sendEmailVerification(user.email, user.firstName, verificationUrl);

    res.json({ 
      message: 'Verification email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Mark the session as inactive
      await prisma.userSession.updateMany({
        where: {
          token,
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getMemberCount,
  verifyEmail,
  resendVerificationEmail
};