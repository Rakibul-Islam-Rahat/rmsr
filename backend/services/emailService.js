const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL on port 465
      auth: {
        user: 'md94rakibulislam@gmail.com',
        pass: 'xadfscqxnpbdryab'
      }
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
  }
};

module.exports = { sendEmail };
