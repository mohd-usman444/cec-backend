const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Safe logging for debugging production email issues
  console.log('--- Email Configuration Check ---');
  console.log(`EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
  console.log(`EMAIL_PASS configured: ${!!process.env.EMAIL_PASS}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('---------------------------------');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'CEC Support'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
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
