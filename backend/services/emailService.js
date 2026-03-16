// Uses SendGrid HTTP API — works on Render (no SMTP needed, uses HTTPS port 443)
const https = require('https');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      console.warn('Email skipped: SENDGRID_API_KEY not set in environment');
      return;
    }

    const body = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: 'md94rakibulislam@gmail.com',
        name: 'RMSR Food Delivery'
      },
      subject: subject || 'RMSR Food Delivery',
      content: [{
        type: 'text/html',
        value: html || text || subject
      }]
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Email sent to: ${to} | Status: ${res.statusCode}`);
            resolve({ statusCode: res.statusCode });
          } else {
            console.error(`❌ SendGrid error ${res.statusCode}:`, data);
            reject(new Error(`SendGrid ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error('❌ Email request error:', err.message);
        reject(err);
      });

      req.write(body);
      req.end();
    });

    return result;

  } catch (error) {
    console.error('Email error (non-critical):', error.message);
    // Never throw — email must never break registration/order flow
  }
};

module.exports = { sendEmail };
