const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - GearGuard',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #875A7B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #875A7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your GearGuard account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #875A7B;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GearGuard. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset Request\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', email);
    
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to GearGuard!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #875A7B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to GearGuard!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Welcome to GearGuard - The Ultimate Maintenance Tracker!</p>
              <p>Your account has been successfully created. You can now:</p>
              <ul>
                <li>📊 Monitor equipment health in real-time</li>
                <li>🔧 Manage maintenance requests</li>
                <li>👥 Collaborate with your team</li>
                <li>📅 Schedule preventive maintenance</li>
              </ul>
              <p>Get started by logging in to your account.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GearGuard. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Welcome email error:', error.message);
    // Don't throw error for welcome email
  }
};

// Generic send email function for custom emails
exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
