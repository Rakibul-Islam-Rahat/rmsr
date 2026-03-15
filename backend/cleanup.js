require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  family: 4
}).then(async () => {

  // Keep Rahat's FoodCorner, delete all other restaurants
  const keep = await mongoose.connection.collection('restaurants').findOne({ name: /rahat/i });
  console.log('Keeping:', keep?.name);

  await mongoose.connection.collection('restaurants').deleteMany({ _id: { $ne: keep._id } });
  console.log('Other restaurants deleted');

  await mongoose.connection.collection('menuitems').deleteMany({ restaurant: { $ne: keep._id } });
  console.log('Other menu items deleted');

  // Delete ONLY the demo owner account
  await mongoose.connection.collection('users').deleteMany({
    email: { $in: ['owner@rmsr.com'] }
  });
  console.log('Demo owner account deleted');
  console.log('admin@rmsr.com kept');
  console.log('rider@rmsr.com kept');
  console.log('customer@rmsr.com kept');
  console.log('Done!');
  process.exit(0);

}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
