const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailService = {
  sendPasswordResetEmail: async (to, resetUrl) => {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@vasplegalassist.com', // Must be verified in SendGrid
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
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@vasplegalassist.com',
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
  }
};

module.exports = emailService;