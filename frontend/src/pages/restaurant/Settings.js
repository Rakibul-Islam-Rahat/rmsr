// src/pages/restaurant/Settings.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRestaurant, updateRestaurant } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut, FiCamera, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { deleteAccount } from '../../services/api';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

export default function RestaurantSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', phone: '', email: '',
    cuisine: '', street: '', area: '',
    minimumOrder: 100, deliveryFee: 30,
    deliveryTimeMin: 20, deliveryTimeMax: 45,
    logo: null, coverImage: null
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchRestaurant(); }, []);

  const fetchRestaurant = async () => {
    try {
      const res = await getMyRestaurant();
      const r = res.data.restaurant;
      setRestaurant(r);
      setForm({
        name: r.name || '',
        description: r.description || '',
        phone: r.phone || '',
        email: r.email || '',
        cuisine: r.cuisine?.join(', ') || '',
        street: r.address?.street || '',
        area: r.address?.area || '',
        minimumOrder: r.minimumOrder || 100,
        deliveryFee: r.deliveryFee || 30,
        deliveryTimeMin: r.deliveryTime?.min || 20,
        deliveryTimeMax: r.deliveryTime?.max || 45,
        logo: null,
        coverImage: null
      });
      setLogoPreview(r.logo || '');
      setCoverPreview(r.coverImage || '');
    } catch {}
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('phone', form.phone);
      formData.append('email', form.email);
      formData.append('cuisine', form.cuisine);
      formData.append('address[street]', form.street);
      formData.append('address[area]', form.area);
      formData.append('address[city]', 'Rangpur');
      formData.append('minimumOrder', form.minimumOrder);
      formData.append('deliveryFee', form.deliveryFee);
      formData.append('deliveryTime[min]', form.deliveryTimeMin);
      formData.append('deliveryTime[max]', form.deliveryTimeMax);
      if (form.logo) formData.append('logo', form.logo);
      if (form.coverImage) formData.append('coverImage', form.coverImage);
      await updateRestaurant(formData);
      toast.success('Settings saved!');
      fetchRestaurant();
    } catch {}
    finally { setSaving(false); }
  };

  const handleFile = (field, file, setPreview) => {
    if (!file) return;
    setForm(prev => ({ ...prev, [field]: file }));
    setPreview(URL.createObjectURL(file));
  };

  const Sidebar = () => (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">Restaurant</div></div></div>
      <nav className="sidebar-nav">
        <Link to="/restaurant" className="sidebar-link"><FiHome />Dashboard</Link>
        <Link to="/restaurant/orders" className="sidebar-link"><FiList />Orders</Link>
        <Link to="/restaurant/menu" className="sidebar-link"><FiGrid />Menu</Link>
        <Link to="/restaurant/analytics" className="sidebar-link"><FiBarChart2 />Analytics</Link>
        <Link to="/restaurant/settings" className="sidebar-link active"><FiSettings />Settings</Link>
      </nav>
      <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut />Logout</button>
    </aside>
  );

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><div className="page-loader"><div className="spinner" /></div></main></div>;

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
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar"><h1 className="dashboard-title">Restaurant Settings</h1></div>
        <div className="dashboard-content">
          <form onSubmit={handleSave} style={{ maxWidth: 700 }}>
            {/* Images */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Photos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Logo / Profile Photo</label>
                  <div
                    className="image-upload-area"
                    style={{ marginTop: 6 }}
                    onClick={() => document.getElementById('logoInput').click()}
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div className="upload-placeholder"><FiCamera size={24} /><br />Upload Logo</div>
                    }
                    <input type="file" id="logoInput" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={e => handleFile('logo', e.target.files[0], setLogoPreview)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Cover / Banner Image</label>
                  <div
                    className="image-upload-area"
                    style={{ marginTop: 6 }}
                    onClick={() => document.getElementById('coverInput').click()}
                  >
                    {coverPreview
                      ? <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div className="upload-placeholder"><FiCamera size={24} /><br />Upload Cover</div>
                    }
                    <input type="file" id="coverInput" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={e => handleFile('coverImage', e.target.files[0], setCoverPreview)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic info */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group"><label className="form-label">Restaurant Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Cuisine Types (comma separated)</label><input className="form-input" placeholder="e.g. Biriyani, Burger, Chicken" value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} /></div>
              </div>
            </div>

            {/* Address */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Address</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group"><label className="form-label">Street / House *</label><input className="form-input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Area / Thana *</label><input className="form-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
              </div>
            </div>

            {/* Delivery settings */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Delivery Settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div className="form-group"><label className="form-label">Minimum Order (৳)</label><input type="number" className="form-input" value={form.minimumOrder} onChange={e => setForm({ ...form, minimumOrder: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Delivery Fee (৳)</label><input type="number" className="form-input" value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Min Delivery Time (min)</label><input type="number" className="form-input" value={form.deliveryTimeMin} onChange={e => setForm({ ...form, deliveryTimeMin: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Max Delivery Time (min)</label><input type="number" className="form-input" value={form.deliveryTimeMax} onChange={e => setForm({ ...form, deliveryTimeMax: e.target.value })} /></div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </form>

          {/* Delete Account */}
          <div style={{ maxWidth: 700, marginTop: 8 }}>
            <div className="delete-account-section">
              <h4><FiAlertTriangle size={15} /> Delete Account</h4>
              <p>
                Permanently delete your account and deactivate your restaurant.
                All your data will be removed. This <strong>cannot be undone</strong>.
              </p>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <FiTrash2 size={15} /> Delete My Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete Account?</h3>
            <p>Your restaurant will be deactivated and your account permanently deleted. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
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
