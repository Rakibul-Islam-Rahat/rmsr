// Run ONCE: node seed.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const { Loyalty, Rider } = require('./models/index');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4
};

const seed = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
  console.log('Connected!');

  // Only delete demo accounts, keep real accounts
  await User.deleteMany({
    email: { $in: ['admin@rmsr.com', 'owner@rmsr.com', 'rider@rmsr.com', 'customer@rmsr.com'] }
  });

  // Create admin
  const admin = await User.create({
    name: 'RMSR Admin', email: 'admin@rmsr.com', phone: '+8801794558994',
    password: 'admin123', role: 'admin', isActive: true, isVerified: true
  });
  console.log('Admin:', admin.email);

  // Create rider
  const rider = await User.create({
    name: 'Fast Rider', email: 'rider@rmsr.com', phone: '+8801722222222',
    password: 'rider123', role: 'rider', isActive: true, isVerified: true
  });
  await Rider.findOneAndUpdate(
    { user: rider._id },
    { user: rider._id, vehicleType: 'motorcycle', vehicleNumber: 'RNG-1234', isApproved: true },
    { upsert: true }
  );
  console.log('Rider:', rider.email);

  // Create customer
  const customer = await User.create({
    name: 'Test Customer', email: 'customer@rmsr.com', phone: '+8801733333333',
    password: 'customer123', role: 'customer', isActive: true, isVerified: true, loyaltyPoints: 250
  });
  await Loyalty.findOneAndUpdate(
    { user: customer._id },
    { user: customer._id, tier: 'bronze', currentPoints: 250, totalPointsEarned: 250 },
    { upsert: true }
  );
  console.log('Customer:', customer.email);

  console.log('\n=== SEED COMPLETE ===');
  console.log('admin@rmsr.com / admin123');
  console.log('rider@rmsr.com / rider123');
  console.log('customer@rmsr.com / customer123');
  console.log('====================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
