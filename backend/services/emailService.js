const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.log('Email skipped: EMAIL_USER or EMAIL_PASS not set in environment');
      return;
    }

    // Create fresh transporter every time (required for Render/cloud environments)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass.replace(/\s/g, '') // strip any accidental spaces
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `RMSR Food <${emailUser}>`,
      to,
      subject,
      html: html || '',
      text: text || ''
    });

    console.log('Email sent successfully to:', to, '| ID:', info.messageId);
    return info;

  } catch (error) {
    console.error('Email send error:', error.message);
    // Never throw — email failure must not break the main flow
  }
};

module.exports = { sendEmail };