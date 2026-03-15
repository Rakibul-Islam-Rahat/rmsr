const admin = require('../config/firebase');

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      token: fcmToken
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens || fcmTokens.length === 0) return;
  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      tokens: fcmTokens
    };
    const response = await admin.messaging().sendMulticast(message);
    return response;
  } catch (error) {
    console.error('Multicast notification error:', error.message);
  }
};

module.exports = { sendPushNotification, sendMulticastNotification };
