import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../../services/api';
import { FiUser, FiPhone, FiLock, FiTrash2, FiAlertTriangle, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, fetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    area: user?.address?.area || '',
    city: user?.address?.city || 'Rangpur'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return toast.error('Only JPG, PNG, WEBP, GIF allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5MB');
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await updateProfile(formData);
      await fetchUser();
      toast.success('Profile photo updated! 📸');
    } catch (_) {
      setAvatarPreview(user?.avatar || '');
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      formData.append('address', JSON.stringify({
        street: profileData.street,
        area: profileData.area,
        city: profileData.city,
        district: 'Rangpur'
      }));
      await updateProfile(formData);
      await fetchUser();
      toast.success('Profile updated!');
    } catch (_) {}
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (_) {}
    finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (_) {}
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  };

  return (
    <div className="profile-page container">
      <h1 className="page-title">My Profile</h1>
      <div className="profile-layout">

        {/* Sidebar */}
        <div className="profile-sidebar card">

          {/* Avatar with upload button */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-big">
              {avatarPreview
                ? <img src={avatarPreview} alt={user?.name} />
                : <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
              }
              {uploadingPhoto && (
                <div className="avatar-uploading">
                  <div className="spinner-sm" />
                </div>
              )}
            </div>
            <button
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change profile photo"
            >
              <FiCamera size={14} />
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div className="profile-loyalty-badge">
            <FiUser size={14} /> {user?.loyaltyPoints || 0} pts
          </div>
          <div className="profile-stats">
            <div><strong>{user?.totalOrders || 0}</strong><span>Orders</span></div>
            <div><strong>৳{user?.totalSpent || 0}</strong><span>Spent</span></div>
          </div>
        </div>

        {/* Content */}
        <div className="profile-content">
          <div className="profile-tabs">
            {['profile', 'password', 'account'].map(t => (
              <button
                key={t}
                className={`detail-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t === 'account' ? '⚠️ Account' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <form className="profile-form card" onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label"><FiUser size={14} /> Full Name</label>
                <input className="form-input" value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiPhone size={14} /> Phone</label>
                <input className="form-input" value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Street / House</label>
                <input className="form-input" value={profileData.street}
                  onChange={e => setProfileData({ ...profileData, street: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Area / Thana</label>
                <input className="form-input" value={profileData.area}
                  onChange={e => setProfileData({ ...profileData, area: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form className="profile-form card" onSubmit={handlePasswordSave}>
              <div className="form-group">
                <label className="form-label"><FiLock size={14} /> Current Password</label>
                <input type="password" className="form-input"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="profile-form card">
              <div className="delete-account-section">
                <h4><FiAlertTriangle size={15} /> Delete Account</h4>
                <p>
                  Once you delete your account, all your data including order history
                  and loyalty points will be permanently removed. This action
                  <strong> cannot be undone</strong>.
                </p>
                <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <FiTrash2 size={15} /> Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete Account?</h3>
            <p>
              Are you sure you want to permanently delete your account?
              All your data, orders, and loyalty points will be lost forever.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
