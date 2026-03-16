// Run ONCE: node create_admin.js
// Creates the real admin account
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI, {
  tls: true, tlsAllowInvalidCertificates: true, family: 4,
  serverSelectionTimeoutMS: 30000
}).then(async () => {
  console.log('Connected!');

  // Delete old admin if exists
  await mongoose.connection.collection('users').deleteOne({ email: 'raqibrahat594@gmail.com' });

  // Create new admin
  const hash = await bcrypt.hash('rahat26.rahat', 12);
  await mongoose.connection.collection('users').insertOne({
    name: 'Rakibul Islam (Admin)',
    email: 'raqibrahat594@gmail.com',
    password: hash,
    phone: '+8801794558994',
    role: 'admin',
    isActive: true,
    isVerified: true,
    avatar: '',
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
    fcmToken: '',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('\n=== Admin Created ===');
  console.log('Email:    raqibrahat594@gmail.com');
  console.log('Password: rahat26.rahat');
  console.log('====================\n');

  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
