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
      subject: 'Password Reset Request - VASP Legal Assistant',
      text: `
        You requested a password reset for your VASP Legal Assistant account.
        
        Please click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        VASP Legal Assistant Team
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
              <p>You requested a password reset for your VASP Legal Assistant account.</p>
              <p>Please click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
              <p>Best regards,<br>VASP Legal Assistant Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} VASP Legal Assistant. All rights reserved.</p>
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
      subject: 'Welcome to VASP Legal Assistant',
      text: `
        Welcome ${firstName}!
        
        Your account has been created successfully. You can now log in and start using VASP Legal Assistant.
        
        If you need any help, please check our FAQ section or contact support.
        
        Best regards,
        VASP Legal Assistant Team
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
              <h1>Welcome to VASP Legal Assistant!</h1>
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
              <p>Best regards,<br>VASP Legal Assistant Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} VASP Legal Assistant. All rights reserved.</p>
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
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@vasplegalassist.com'];
      
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
          VASP Legal Assistant System
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
                  <a href="${process.env.NODE_ENV === 'production' && process.env.CLIENT_URL?.includes('localhost') ? 'https://theblockrecord.com' : (process.env.APP_URL || process.env.CLIENT_URL || 'https://theblockrecord.com')}/admin/users" class="button">
                    Go to Admin Panel
                  </a>
                </center>
              </div>
              <div class="footer">
                <p>This is an automated notification from VASP Legal Assistant</p>
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
        name: process.env.SENDGRID_FROM_NAME || 'VASP Legal Assistant'
      },
      subject: 'Verify Your Email - VASP Legal Assistant',
      text: `
        Hello ${firstName},

        Thank you for registering with VASP Legal Assistant!

        Please verify your email address by clicking the following link:
        ${verificationUrl}

        This link will expire in 24 hours.

        After verifying your email, your account will need to be approved by an administrator before you can log in.

        If you did not create an account, please ignore this email.

        Best regards,
        VASP Legal Assistant Team
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
              <p>Thank you for registering with VASP Legal Assistant!</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <div class="warning">
                <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
                <p>After verifying your email, your account will need to be approved by an administrator before you can log in.</p>
              </div>
              <p>If you did not create an account, please ignore this email.</p>
              <p>Best regards,<br>VASP Legal Assistant Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} VASP Legal Assistant. All rights reserved.</p>
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
  }
};

module.exports = emailService;