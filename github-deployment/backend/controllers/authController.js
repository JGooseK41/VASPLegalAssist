const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is not configured!');
    throw new Error('JWT_SECRET is not configured');
  }
  
  const payload = { userId, role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  return token;
};

// Helper function to get base URL, avoiding localhost in production
const getBaseUrl = () => {
  let baseUrl = process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com';
  
  // Force production URL if we're in production and URL contains localhost
  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    console.warn('CLIENT_URL contains localhost in production, using default URL');
    baseUrl = 'https://theblockrecord.com';
  }
  
  return baseUrl;
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, agencyName, agencyAddress, badgeNumber, title, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Registration failed. Please check your information and try again.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24); // 24 hour expiry

    // Create user in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
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
          isEmailVerified: false,
          emailVerificationToken,
          emailVerificationExpiry,
          isApproved: false
        }
      });
      
      return newUser;
    });

    // Determine if we should auto-approve (for demo purposes in development)
    const autoApprove = process.env.NODE_ENV === 'development' || process.env.AUTO_APPROVE === 'true';
    
    if (autoApprove) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isApproved: true }
      });
    }

    // Send email verification
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
    
    let emailSent = false;
    try {
      await emailService.sendEmailVerification(user.email, user.firstName, verificationUrl);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      console.error('SendGrid error details:', emailError.response?.body || emailError.message);
      
      // Log but continue with registration
      // In production, you should have SendGrid properly configured
      // For now, we'll log the verification URL for debugging
      console.log('IMPORTANT: Email failed to send. Manual verification URL:', verificationUrl);
      console.log('User email:', user.email);
      
      // Continue with registration but note the email failure
      emailSent = false;
    }

    // Send admin notification email
    try {
      await emailService.sendAdminNotification(user);
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError);
      // Don't fail registration if admin email fails
    }

    // Prepare response
    const response = {
      message: emailSent 
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful! However, we encountered an issue sending the verification email. Please use the resend verification option or contact support.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      requiresEmailVerification: true,
      requiresApproval: !autoApprove,
      emailSent: emailSent
    };

    // If auto-approved and email verified (dev mode), include token
    if (autoApprove && process.env.NODE_ENV === 'development') {
      // Auto-verify email in development
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null
        }
      });
      
      const token = generateToken(user.id, user.role);
      response.token = token;
      response.requiresEmailVerification = false;
      response.message = 'Registration successful! You can now log in.';
    } else {
      response.message = 'Registration successful! Please check your email to verify your account. After verification, an admin will need to approve your account.';
    }
    // No token provided - user must verify email and wait for approval
    
    // In development, include verification URL for testing
    if (process.env.NODE_ENV !== 'production') {
      response.verificationUrl = verificationUrl;
      console.log('DEV MODE - Verification URL:', verificationUrl);
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Check for common issues
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    if (error.message?.includes('JWT_SECRET')) {
      console.error('JWT_SECRET is not configured!');
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }
    
    if (error.message?.includes('connect') || error.message?.includes('database')) {
      console.error('Database connection error!');
      return res.status(500).json({ error: 'Database connection error. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('Login attempt for email:', email);

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
      console.log('Login failed - user not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login failed - invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified (skip for admin users, master admin, or if verification is disabled)
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (!user.isEmailVerified && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN' && !skipEmailVerification) {
      console.log('Login failed - email not verified for:', email);
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        requiresEmailVerification: true
      });
    }

    // Check if user is approved (skip for admin users and master admin)
    if (!user.isApproved && user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
      console.log('Login failed - account not approved for:', email);
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const documentsWithoutResponses = await prisma.document.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: thirtyDaysAgo
        },
        vaspResponses: {
          none: {}
        }
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    
    const response = {
      user: userWithoutPassword,
      token
    };

    // Add notification about documents without responses
    if (documentsWithoutResponses > 0) {
      response.notification = {
        type: 'info',
        message: `You have ${documentsWithoutResponses} document${documentsWithoutResponses > 1 ? 's' : ''} without responses from the past 30 days. Consider providing feedback to help other users.`
      };
    }

    console.log('Login successful for:', email);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Stack trace:', error.stack);
    
    // Check for common issues
    if (error.message?.includes('JWT_SECRET')) {
      console.error('JWT_SECRET is not configured!');
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }
    
    if (error.message?.includes('connect') || error.message?.includes('database')) {
      console.error('Database connection error!');
      return res.status(500).json({ error: 'Database connection error. Please try again later.' });
    }
    
    res.status(500).json({ 
      error: 'An error occurred during login. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Invalidate the session
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

const verifyEmail = async (req, res) => {
  try {
    // Support both GET (query params) and POST (body) during transition
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // First check if token exists at all
    const userWithToken = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token
      }
    });

    if (!userWithToken) {
      return res.status(400).json({ 
        error: 'Invalid verification link. Please check your email for the correct link or request a new one.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is expired
    if (userWithToken.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ 
        error: 'Your verification link has expired. Please request a new verification email.',
        code: 'EXPIRED_TOKEN'
      });
    }

    const user = userWithToken;

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });

    res.json({ 
      message: 'Email verified successfully! Your account is now pending admin approval.',
      requiresApproval: !user.isApproved
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account exists with this email, you will receive a password reset link shortly.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // Send reset email
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ message: 'If an account exists with this email, you will receive a password reset link shortly.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const submitAdminApplication = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      lawEnforcementRole,
      yearsExperience,
      reasonForVolunteering,
      availableHours,
      experience,
      references
    } = req.body;

    // Check if user already has an application
    const existingApplication = await prisma.adminApplication.findFirst({
      where: { 
        userId,
        status: 'PENDING'
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You already have a pending admin application' });
    }

    // Check if user is already an admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.role === 'ADMIN' || user.role === 'MASTER_ADMIN') {
      return res.status(400).json({ error: 'You are already an admin' });
    }

    // Create the application
    const application = await prisma.adminApplication.create({
      data: {
        userId,
        lawEnforcementRole,
        yearsExperience,
        reasonForVolunteering,
        availableHours,
        experience,
        references
      }
    });

    // Send notification email to admins
    try {
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['info@theblockaudit.com'];
      const emailService = require('../services/emailService');
      
      // Create notification email for admins
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: adminEmails,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com',
        subject: 'New Admin Application - Review Required',
        text: `
          A new admin application has been submitted:
          
          Name: ${user.firstName} ${user.lastName}
          Email: ${user.email}
          Agency: ${user.agencyName}
          Current Role: ${lawEnforcementRole}
          Years of Experience: ${yearsExperience}
          Available Hours: ${availableHours}
          
          Reason for Volunteering:
          ${reasonForVolunteering}
          
          Relevant Experience:
          ${experience}
          
          Please log in to the admin portal to review this application.
        `,
        html: `
          <h2>New Admin Application</h2>
          <p>A new admin application has been submitted and requires review:</p>
          
          <h3>Applicant Information</h3>
          <ul>
            <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Agency:</strong> ${user.agencyName}</li>
            <li><strong>Current Role:</strong> ${lawEnforcementRole}</li>
            <li><strong>Years of Experience:</strong> ${yearsExperience}</li>
            <li><strong>Available Hours:</strong> ${availableHours}</li>
          </ul>
          
          <h3>Reason for Volunteering</h3>
          <p>${reasonForVolunteering.replace(/\n/g, '<br>')}</p>
          
          <h3>Relevant Experience</h3>
          <p>${experience.replace(/\n/g, '<br>')}</p>
          
          ${references ? `<h3>References</h3><p>${references.replace(/\n/g, '<br>')}</p>` : ''}
          
          <p><a href="${process.env.CLIENT_URL || 'https://theblockrecord.com'}/admin/applications">Review Application in Admin Portal</a></p>
        `
      };
      
      await sgMail.send(msg);
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the application submission if email fails
    }

    res.json({ 
      message: 'Admin application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (error) {
    console.error('Submit admin application error:', error);
    res.status(500).json({ error: 'Failed to submit admin application' });
  }
};

const getMyAdminApplication = async (req, res) => {
  try {
    const userId = req.userId;
    
    const application = await prisma.adminApplication.findFirst({
      where: { 
        userId,
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        lawEnforcementRole: true,
        yearsExperience: true,
        availableHours: true
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'No pending application found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get admin application error:', error);
    res.status(500).json({ error: 'Failed to get admin application' });
  }
};

const forgotPassword = requestPasswordReset; // Alias for consistency

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ error: 'Failed to validate reset token' });
  }
};

const getMemberCount = async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: {
        isApproved: true
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get member count error:', error);
    res.status(500).json({ error: 'Failed to get member count' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists with this email, a verification email has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    // Update user with new token (this will replace any existing token)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiry
      }
    });

    // Send verification email
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
    
    try {
      await emailService.sendEmailVerification(user.email, user.firstName, verificationUrl);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  forgotPassword,
  validateResetToken,
  getMemberCount,
  resendVerificationEmail,
  submitAdminApplication,
  getMyAdminApplication
};