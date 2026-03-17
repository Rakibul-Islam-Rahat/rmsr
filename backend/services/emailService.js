// Email sending is disabled — Render free tier blocks SMTP
// All notifications are handled via in-app notifications and Socket.IO
const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Email skipped] To: ${to} | Subject: ${subject}`);
  // Silently skip — never throw
};

module.exports = { sendEmail };
