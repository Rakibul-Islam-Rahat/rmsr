// src/pages/customer/Profile.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../services/api';
import { FiUser, FiPhone, FiMapPin, FiLock, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '', street: user?.address?.street || '', area: user?.address?.area || '', city: user?.address?.city || 'Rangpur' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      formData.append('address', JSON.stringify({ street: profileData.street, area: profileData.area, city: profileData.city, district: 'Rangpur' }));
      await updateProfile(formData);
      await fetchUser();
      toast.success('Profile updated!');
    } catch {}
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('Passwords do not match');
    if (passwordData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Password changed!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="profile-page container">
      <h1 className="page-title">My Profile</h1>
      <div className="profile-layout">
        <div className="profile-sidebar card">
          <div className="profile-avatar-big">{user?.avatar ? <img src={user.avatar} alt={user.name} /> : <span>{user?.name?.charAt(0)}</span>}</div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-loyalty-badge"><FiUser size={14} /> {user?.loyaltyPoints} pts</div>
          <div className="profile-stats">
            <div><strong>{user?.totalOrders || 0}</strong><span>Orders</span></div>
            <div><strong>৳{user?.totalSpent || 0}</strong><span>Spent</span></div>
          </div>
        </div>
        <div className="profile-content">
          <div className="profile-tabs">
            {['profile', 'password'].map(t => (
              <button key={t} className={`detail-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {activeTab === 'profile' && (
            <form className="profile-form card" onSubmit={handleProfileSave}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Street / House</label><input className="form-input" value={profileData.street} onChange={e => setProfileData({ ...profileData, street: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Area / Thana</label><input className="form-input" value={profileData.area} onChange={e => setProfileData({ ...profileData, area: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )}
          {activeTab === 'password' && (
            <form className="profile-form card" onSubmit={handlePasswordSave}>
              <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className="form-input" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
