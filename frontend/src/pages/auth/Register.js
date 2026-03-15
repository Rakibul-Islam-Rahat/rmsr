import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role
      });
      if (user.role === 'restaurant_owner') navigate('/restaurant');
      else if (user.role === 'rider') navigate('/rider');
      else navigate('/');
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">R</div>
          <span>RMSR Food</span>
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join thousands of food lovers in Rangpur</p>

        {/* Role selector */}
        <div className="role-selector">
          {[
            { value: 'customer', label: '🛒 Customer', desc: 'Order food' },
            { value: 'restaurant_owner', label: '🍽️ Restaurant', desc: 'Sell food' },
            { value: 'rider', label: '🚀 Rider', desc: 'Deliver food' }
          ].map(role => (
            <button
              key={role.value}
              type="button"
              className={`role-btn ${form.role === role.value ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: role.value })}
            >
              <div className="role-label">{role.label}</div>
              <div className="role-desc">{role.desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  className="form-input with-icon"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <FiPhone className="input-icon" />
                <input
                  type="tel"
                  className="form-input with-icon"
                  placeholder="+880 1XXX-XXXXXX"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                className="form-input with-icon"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  className="form-input with-icon"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
