import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRestaurant, getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

const EMPTY_FORM = { name: '', description: '', price: '', discountedPrice: '', category: '', isVeg: false, isSpicy: false, isBestseller: false, preparationTime: 15, image: null };

export default function RestaurantMenu() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const restRes = await getMyRestaurant();
      setRestaurant(restRes.data.restaurant);
      const menuRes = await getMenu(restRes.data.restaurant._id);
      setMenuItems(menuRes.data.items);
    } catch {}
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setImagePreview(''); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || '', price: item.price, discountedPrice: item.discountedPrice || '', category: item.category, isVeg: item.isVeg, isSpicy: item.isSpicy, isBestseller: item.isBestseller, preparationTime: item.preparationTime, image: null });
    setImagePreview(item.image || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return toast.error('Name, price and category are required');
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') formData.append(k, v); });
      if (!editItem) formData.append('restaurantId', restaurant._id);
      if (editItem) { await updateMenuItem(editItem._id, formData); toast.success('Item updated'); }
      else { await addMenuItem(formData); toast.success('Item added'); }
      setShowModal(false);
      fetchData();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteMenuItem(id); toast.success('Item deleted'); fetchData(); } catch {}
  };

  const handleToggle = async (id) => {
    try { await toggleMenuItemAvailability(id); fetchData(); } catch {}
  };

  const categories = [...new Set(menuItems.map(i => i.category))];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">Restaurant</div></div></div>
        <nav className="sidebar-nav">
<Link to="/restaurant" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/restaurant/orders" className="sidebar-link"><FiList />Orders</Link>
          <Link to="/restaurant/menu" className="sidebar-link active"><FiGrid />Menu</Link>
          <Link to="/restaurant/analytics" className="sidebar-link"><FiBarChart2 />Analytics</Link>
          <Link to="/restaurant/settings" className="sidebar-link"><FiSettings />Settings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut />Logout</button>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Menu</h1>
          
          <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Item</button>
        </div>
        <div className="dashboard-content">
          {loading ? <div className="page-loader"><div className="spinner" /></div> : (
            <>
              {categories.map(cat => (
                <div key={cat} className="dashboard-section" style={{ padding: '0 0 24px' }}>
                  <h2 className="section-title-sm">{cat}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                    {menuItems.filter(i => i.category === cat).map(item => (
                      <div key={item._id} className="card" style={{ padding: 14, display: 'flex', gap: 12 }}>
                        <div style={{ width: 70, height: 65, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🍽️</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>৳{item.discountedPrice || item.price}</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><FiEdit2 size={13} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(item._id)} title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                              {item.isAvailable ? <FiToggleRight size={14} style={{ color: 'var(--accent)' }} /> : <FiToggleLeft size={14} />}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item._id)}><FiTrash2 size={13} style={{ color: 'var(--primary)' }} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <div className="empty-state"><p>No menu items yet. Add your first item!</p></div>}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Item' : 'Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              {/* Image upload */}
              <div className="image-upload-area" onClick={() => document.getElementById('itemImage').click()}>
                {imagePreview ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="upload-placeholder">📷 Click to upload image<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>jpg, jpeg, png, webp, gif</span></div>}
                <input type="file" id="itemImage" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Item Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Category *</label><input className="form-input" placeholder="e.g. Biriyani" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Prep Time (min)</label><input type="number" className="form-input" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Price (৳) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Discounted Price (৳)</label><input type="number" className="form-input" value={form.discountedPrice} onChange={e => setForm({ ...form, discountedPrice: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
                {[['isVeg', '🌱 Vegetarian'], ['isSpicy', '🌶️ Spicy'], ['isBestseller', '⭐ Bestseller']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 16 }} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
