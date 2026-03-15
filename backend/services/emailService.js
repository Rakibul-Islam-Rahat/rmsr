const https = require('https');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const apiKey = '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';
    const fromEmail = 'md94rakibulislam@gmail.com';
    const fromName = 'RMSR Food';

    const data = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject: subject,
      content: [{ type: 'text/html', value: html || text || subject }]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Email sent to:', to, '| Status:', res.statusCode);
            resolve();
          } else {
            console.error('SendGrid error:', res.statusCode, body);
            reject(new Error(`SendGrid status ${res.statusCode}: ${body}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

  } catch (error) {
    console.error('Email error:', error.message);
    // Never throw — email failure must not break main flow
  }
};

module.exports = { sendEmail };
