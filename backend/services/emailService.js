const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Create fresh transporter every call
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'md94rakibulislam@gmail.com',
        pass: 'xadfscqxnpbdryab'
      },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: 'RMSR Food <md94rakibulislam@gmail.com>',
      to,
      subject,
      html: html || '',
      text: text || ''
    });

    console.log('Email sent to:', to, '| ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    // Never throw — email failure must not break main flow
  }
};

module.exports = { sendEmail };
