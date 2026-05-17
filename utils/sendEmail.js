const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Sanitize environment variables to remove hidden spaces/newlines from Vercel
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';

  // Safe logging for debugging production email issues
  console.log('--- Email Configuration Check ---');
  console.log(`EMAIL_USER configured: ${!!emailUser}`);
  console.log(`EMAIL_PASS configured: ${!!emailPass}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('---------------------------------');

  // If using Gmail, passing 'service' is sometimes more reliable than host/port, but we keep host/port for flexibility
  // We add logger and debug flags for detailed SMTP transaction logs
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    logger: true, // Log to console
    debug: true,  // Include SMTP traffic in the logs
  });

  // Verify connection configuration before sending
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('Server is ready to take our messages (transporter.verify() succeeded)');
  } catch (verifyError) {
    console.error('Nodemailer Verification Error Details:', verifyError);
    // Note: We don't throw here, we'll let sendMail attempt and fail so we get both logs if needed
  }

  const message = {
    from: `${process.env.FROM_NAME || 'CEC Support'} <${process.env.FROM_EMAIL || emailUser}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error Details:', error);
    throw error;
  }
};

module.exports = sendEmail;
