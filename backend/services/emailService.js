const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email skipped: credentials not configured');
      return;
    }
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `RMSR Food <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: html || text,
      text: text || ''
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error (non-critical):', error.message);
  }
};

module.exports = { sendEmail };
