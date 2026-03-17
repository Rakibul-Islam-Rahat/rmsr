const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow both local and deployed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://rmsr-food.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

app.set('io', io);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/rider', require('./routes/riderRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

require('./services/socketService')(io);

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  tls: true,
  tlsAllowInvalidCertificates: true,
  directConnection: false,
  family: 4
};

mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'RMSR API is running', time: new Date(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd && err.status !== 400 && err.status !== 401 && err.status !== 403 && err.status !== 404
      ? 'Internal server error'
      : (err.message || 'Internal server error')
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`RMSR Server running on port ${PORT}`));
