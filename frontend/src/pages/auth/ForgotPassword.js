import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiKey, FiArrowLeft, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 — Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) return setErrorMsg('Please enter your email address');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      toast.success('Reset code sent to your email! 📧');
      setStep(2);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otp || otp.length !== 6) return setErrorMsg('Please enter the 6-digit code');
    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { email, otp });
      toast.success('Code verified! Set your new password.');
      setStep(3);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 6) return setErrorMsg('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setErrorMsg('Passwords do not match');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please login. 🎉');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const stepTitles = {
    1: { title: 'Forgot Password?', subtitle: 'Enter your email and we\'ll send you a reset code' },
    2: { title: 'Enter Reset Code', subtitle: `We sent a 6-digit code to ${email}` },
    3: { title: 'Set New Password', subtitle: 'Choose a strong new password' },
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">R</div>
          <span>RMSR Food</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? 28 : 10, height: 10, borderRadius: 5,
              background: s <= step ? 'var(--primary)' : 'var(--border)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        <h2 className="auth-title">{stepTitles[step].title}</h2>
        <p className="auth-subtitle">{stepTitles[step].subtitle}</p>

        {errorMsg && (
          <div className="auth-error-box">
            <FiAlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  className="form-input with-icon"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Sending code...' : 'Send Reset Code 📧'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="form-group">
              <label className="form-label">6-Digit Reset Code</label>
              <div className="input-wrapper">
                <FiKey className="input-icon" />
                <input
                  type="text"
                  className="form-input with-icon"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(''); }}
                  maxLength={6}
                  style={{ letterSpacing: 6, fontSize: 22, fontWeight: 700, textAlign: 'center' }}
                  required
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Check your inbox at <strong>{email}</strong>. Code expires in 15 minutes.
              </p>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code ✓'}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              style={{ marginTop: 8 }}
              onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); }}
            >
              ← Change Email
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Didn't receive?{' '}
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                onClick={handleSendOtp}>
                Resend Code
              </button>
            </p>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrorMsg(''); }}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  className="form-input with-icon"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  required
                />
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p style={{ fontSize: 12, color: '#27ae60', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}>
              {loading ? 'Resetting...' : 'Reset Password 🔐'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login"><FiArrowLeft size={13} style={{ marginRight: 4 }} />Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
