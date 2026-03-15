// Run ONCE: node cleanup.js
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  tls: true, tlsAllowInvalidCertificates: true, family: 4,
  serverSelectionTimeoutMS: 30000
}).then(async () => {
  console.log('Connected!');

  // Find Rahat's FoodCorner
  const restaurant = await mongoose.connection.collection('restaurants')
    .findOne({ name: /rahat/i });

  if (!restaurant) {
    console.log('WARNING: Rahat FoodCorner not found!');
    process.exit(1);
  }
  console.log('Keeping restaurant:', restaurant.name);

  // Find admin account
  const admin = await mongoose.connection.collection('users')
    .findOne({ email: 'admin@rmsr.com' });

  if (!admin) {
    console.log('WARNING: admin@rmsr.com not found!');
    process.exit(1);
  }
  console.log('Keeping admin:', admin.email);

  // Delete all users except admin and Rahat's owner
  const deletedUsers = await mongoose.connection.collection('users').deleteMany({
    _id: { $nin: [admin._id, restaurant.owner] }
  });
  console.log('Deleted', deletedUsers.deletedCount, 'user accounts');

  // Delete loyalty records of deleted users
  await mongoose.connection.collection('loyalties').deleteMany({
    user: { $nin: [admin._id, restaurant.owner] }
  });

  // Delete rider profiles of deleted users
  await mongoose.connection.collection('riders').deleteMany({
    user: { $nin: [admin._id, restaurant.owner] }
  });

  // Delete all restaurants except Rahat's
  const deletedRest = await mongoose.connection.collection('restaurants').deleteMany({
    _id: { $ne: restaurant._id }
  });
  console.log('Deleted', deletedRest.deletedCount, 'other restaurants');

  // Delete menu items of deleted restaurants
  await mongoose.connection.collection('menuitems').deleteMany({
    restaurant: { $ne: restaurant._id }
  });

  console.log('\n=== DONE ===');
  console.log('Kept: admin@rmsr.com / admin123');
  console.log('Kept: Rahat FoodCorner + owner account');
  console.log('Everything else deleted.');
  console.log('============\n');

  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});