import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.email || !form.password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'restaurant_owner') navigate('/restaurant');
      else if (user.role === 'rider') navigate('/rider');
      else navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">R</div>
          <span>RMSR Food</span>
        </div>
        <h2 className="auth-title">Welcome back!</h2>
        <p className="auth-subtitle">Sign in to continue ordering delicious food</p>

        {/* Inline error message */}
        {errorMsg && (
          <div className="auth-error-box">
            <FiAlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                className={`form-input with-icon ${errorMsg ? 'input-error' : ''}`}
                placeholder="your@email.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(''); }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input with-icon with-icon-right ${errorMsg ? 'input-error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(''); }}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
