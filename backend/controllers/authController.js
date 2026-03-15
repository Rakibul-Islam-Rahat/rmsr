const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const { Loyalty } = require('../models/index');

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const allowedRoles = ['customer', 'restaurant_owner', 'rider'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password,
      role: userRole
    });

    // Create loyalty account for customers
    if (userRole === 'customer') {
      await Loyalty.create({ user: user._id });
    }

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'Welcome to RMSR Food Delivery! 🎉',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
          <div style="background:#c0392b;padding:30px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:28px">🍔 RMSR Food</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">Rangpur, Bangladesh</p>
          </div>
          <div style="padding:30px">
            <h2 style="color:#1a1a2e">Welcome, ${user.name}! 🎉</h2>
            <p style="color:#555;line-height:1.7">Your account has been created successfully. You can now order delicious food from Rangpur's best restaurants!</p>
            <div style="background:#f8f9ff;border-radius:8px;padding:16px;margin:20px 0">
              <p style="margin:0;color:#555"><strong>Account Details:</strong></p>
              <p style="margin:8px 0 0;color:#555">Email: <strong>${user.email}</strong></p>
              <p style="margin:4px 0 0;color:#555">Role: <strong>${userRole}</strong></p>
            </div>
            <a href="${process.env.CLIENT_URL || 'https://rmsr-food.vercel.app'}" 
               style="display:inline-block;background:#c0392b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:10px">
              Start Ordering Now →
            </a>
          </div>
          <div style="background:#f8f9ff;padding:16px;text-align:center">
            <p style="color:#aaa;font-size:12px;margin:0">RMSR Food Delivery · Rangpur, Bangladesh · CSE BRUR Project</p>
          </div>
        </div>
      `
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome email sent.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        loyaltyPoints: user.loyaltyPoints || 0
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        avatar: user.avatar || '',
        loyaltyPoints: user.loyaltyPoints || 0,
        address: user.address || {}
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.address) {
      updateData.address = typeof req.body.address === 'string'
        ? JSON.parse(req.body.address)
        : req.body.address;
    }
    if (req.file) updateData.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (fcmToken) await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, updateFcmToken };
