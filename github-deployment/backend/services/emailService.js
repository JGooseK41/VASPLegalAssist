const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully');
} else {
  console.error('WARNING: SendGrid API key not configured properly. Email sending will fail.');
}

const emailService = {
  sendPasswordResetEmail: async (to, resetUrl) => {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com', // Must be verified in SendGrid
      subject: 'Password Reset Request - The Block Record',
      text: `
        You requested a password reset for your Block Record account.
        
        Please click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The Block Record Team
        A product of The Block Audit LLC
        https://www.theblockaudit.com
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #2563eb; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a password reset for your Block Record account.</p>
              <p>Please click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">Reset Password</a>
              </div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
              <p>Best regards,<br>
              The Block Record Team<br>
              A product of The Block Audit LLC<br>
              <a href="https://www.theblockaudit.com" style="color: #2563eb;">www.theblockaudit.com</a></p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} The Block Audit LLC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Password reset email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      if (error.response) {
        console.error('SendGrid response error:', error.response.body);
      }
      throw error;
    }
  },

  sendWelcomeEmail: async (to, firstName) => {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com',
      subject: 'Welcome to The Block Record',
      text: `
        Welcome ${firstName}!
        
        Your account has been created successfully. You can now log in and start using The Block Record.
        
        If you need any help, please check our FAQ section or contact support.
        
        Best regards,
        The Block Record Team
        A product of The Block Audit LLC
        https://www.theblockaudit.com
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to The Block Record!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>Your account has been created successfully!</p>
              <p>You can now log in and access all features including:</p>
              <ul>
                <li>Search and access VASP contact information</li>
                <li>Generate legal documents and subpoenas</li>
                <li>Manage document templates</li>
                <li>Track document history</li>
                <li>Submit new VASP information</li>
              </ul>
              <p>If you need any help getting started, please check our FAQ section.</p>
              <p>Best regards,<br>
              The Block Record Team<br>
              A product of The Block Audit LLC<br>
              <a href="https://www.theblockaudit.com" style="color: #2563eb;">www.theblockaudit.com</a></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} The Block Audit LLC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Welcome email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome emails - they're not critical
      return false;
    }
  },

  sendAdminNotification: async (newUser) => {
    try {
      // Get admin emails from environment or use a default
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['info@theblockaudit.com'];
      
      const msg = {
        to: adminEmails,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com',
        subject: 'New User Registration - Approval Required',
        text: `
          A new user has registered and requires approval:
          
          Name: ${newUser.firstName} ${newUser.lastName}
          Email: ${newUser.email}
          Agency: ${newUser.agencyName}
          Agency Address: ${newUser.agencyAddress || 'Not provided'}
          Badge Number: ${newUser.badgeNumber || 'Not provided'}
          Title: ${newUser.title || 'Not provided'}
          Phone: ${newUser.phone || 'Not provided'}
          
          Please log in to the admin panel to approve or reject this registration.
          
          Best regards,
          The Block Record Team
          A product of The Block Audit LLC
          https://www.theblockaudit.com
        `,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .info-table td:first-child { font-weight: bold; width: 150px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #2563eb; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New User Registration</h1>
              </div>
              <div class="content">
                <p>A new user has registered and requires your approval:</p>
                
                <table class="info-table">
                  <tr>
                    <td>Name:</td>
                    <td>${newUser.firstName} ${newUser.lastName}</td>
                  </tr>
                  <tr>
                    <td>Email:</td>
                    <td>${newUser.email}</td>
                  </tr>
                  <tr>
                    <td>Agency:</td>
                    <td>${newUser.agencyName}</td>
                  </tr>
                  <tr>
                    <td>Agency Address:</td>
                    <td>${newUser.agencyAddress || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td>Badge Number:</td>
                    <td>${newUser.badgeNumber || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td>Title:</td>
                    <td>${newUser.title || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td>Phone:</td>
                    <td>${newUser.phone || 'Not provided'}</td>
                  </tr>
                </table>
                
                <p>Please log in to the admin panel to approve or reject this registration.</p>
                
                <center>
                  <a href="${process.env.NODE_ENV === 'production' && process.env.CLIENT_URL?.includes('localhost') ? 'https://theblockrecord.com' : (process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com')}/admin/users" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
                    Go to Admin Panel
                  </a>
                </center>
              </div>
              <div class="footer">
                <p>This is an automated notification from The Block Record</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await sgMail.send(msg);
      console.log('Admin notification email sent');
    } catch (error) {
      console.error('SendGrid error (admin notification):', error);
      // Don't throw - this is not critical for registration
    }
  },

  sendEmailVerification: async (to, firstName, verificationUrl) => {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com',
        name: process.env.SENDGRID_FROM_NAME || 'The Block Record'
      },
      subject: 'Verify Your Email - The Block Record',
      text: `
        Hello ${firstName},

        Thank you for registering with The Block Record!

        Please verify your email address by clicking the following link:
        ${verificationUrl}

        This link will expire in 24 hours.

        After verifying your email, your account will need to be approved by an administrator before you can log in.

        If you did not create an account, please ignore this email.

        Best regards,
        The Block Record Team
        A product of The Block Audit LLC
        https://www.theblockaudit.com
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #2563eb; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>Thank you for registering with The Block Record!</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <div class="warning">
                <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
                <p>After verifying your email, your account will need to be approved by an administrator before you can log in.</p>
              </div>
              <p>If you did not create an account, please ignore this email.</p>
              <p>Best regards,<br>
              The Block Record Team<br>
              A product of The Block Audit LLC<br>
              <a href="https://www.theblockaudit.com" style="color: #2563eb;">www.theblockaudit.com</a></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} The Block Audit LLC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Email verification sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error; // Throw error for verification emails as they are critical
    }
  },

  sendApprovalEmail: async (to, firstName) => {
    const loginUrl = process.env.NODE_ENV === 'production' && process.env.CLIENT_URL?.includes('localhost') 
      ? 'https://theblockrecord.com/login' 
      : `${process.env.CLIENT_URL || 'https://theblockrecord.com'}/login`;

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@theblockrecord.com',
        name: process.env.SENDGRID_FROM_NAME || 'The Block Record'
      },
      subject: 'Your Account Has Been Approved - The Block Record',
      text: `
        Hello ${firstName},

        Great news! Your Block Record account has been approved by an administrator.

        You can now log in and access all features of the platform:
        ${loginUrl}

        If you have any questions or need assistance, please don't hesitate to contact our support team.

        Best regards,
        The Block Record Team
        A product of The Block Audit LLC
        https://www.theblockaudit.com
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #2563eb; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .features { background-color: #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to The Block Record!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p><strong>Great news!</strong> Your Block Record account has been approved by an administrator.</p>
              <p>You can now log in and start using all the features of our platform:</p>
              <div style="text-align: center;">
                <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">Log In Now</a>
              </div>
              <div class="features">
                <p><strong>What you can do now:</strong></p>
                <ul>
                  <li>Search and access VASP contact information</li>
                  <li>Generate legal documents and subpoenas</li>
                  <li>Submit new VASP information</li>
                  <li>Contribute to the community knowledge base</li>
                  <li>Track your contributions on the leaderboard</li>
                </ul>
              </div>
              <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>
              <p>Best regards,<br>
              The Block Record Team<br>
              A product of The Block Audit LLC<br>
              <a href="https://www.theblockaudit.com" style="color: #2563eb;">www.theblockaudit.com</a></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} The Block Audit LLC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Approval notification sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Error sending approval email:', error);
      // Don't throw - approval emails are not critical for the approval process
      return false;
    }
  }
};

module.exports = emailService;