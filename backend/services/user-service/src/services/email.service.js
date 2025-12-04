/**
 * Email Service
 * Handles sending transactional emails
 */

const nodemailer = require('nodemailer');
const { createLogger } = require('../../../../shared/utils/logger');

const logger = createLogger('email-service');

// Create transporter
let transporter;

/**
 * Initialize email transporter
 */
const initTransporter = () => {
  if (transporter) return transporter;

  // Use different config based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Use real SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal (fake SMTP)
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal_pass',
      },
    });
  }

  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
  try {
    const transport = initTransporter();

    const mailOptions = {
      from: `"E-Store" <${process.env.SMTP_FROM || 'noreply@estore.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transport.sendMail(mailOptions);

    logger.info('Email sent', { messageId: info.messageId, to: options.to });

    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Preview URL', { url: nodemailer.getTestMessageUrl(info) });
    }

    return info;
  } catch (error) {
    logger.error('Failed to send email', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Password Reset Request - E-Store';

  const text = `
Hello ${name},

You requested a password reset for your E-Store account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The E-Store Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">E-Store</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333;">Password Reset Request</h2>
    
    <p>Hello ${name},</p>
    
    <p>You requested a password reset for your E-Store account.</p>
    
    <p>Please click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    
    <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      Best regards,<br>
      The E-Store Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to E-Store!';

  const text = `
Hello ${name},

Welcome to E-Store! We're excited to have you on board.

Start exploring our wide range of products and enjoy a seamless shopping experience.

Best regards,
The E-Store Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to E-Store</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to E-Store!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333;">Hello ${name}!</h2>
    
    <p>We're excited to have you on board.</p>
    
    <p>Start exploring our wide range of products and enjoy a seamless shopping experience.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Shopping</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      Best regards,<br>
      The E-Store Team
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
