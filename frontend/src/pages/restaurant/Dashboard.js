// src/pages/restaurant/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRestaurant, getRestaurantOrders, toggleRestaurantStatus, createRestaurant } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut, FiToggleLeft, FiToggleRight, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';
import './Restaurant.css';

export default function RestaurantDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noRestaurant, setNoRestaurant] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', street: '', area: '', cuisine: '', description: '', minimumOrder: 100, deliveryFee: 30 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [restRes, ordersRes] = await Promise.all([
        getMyRestaurant(),
        getRestaurantOrders({ limit: 5 })
      ]);
      setRestaurant(restRes.data.restaurant);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      if (err.response?.status === 404) setNoRestaurant(true);
    }
    finally { setLoading(false); }
  };

  const handleToggle = async () => {
    try {
      const res = await toggleRestaurantStatus();
      setRestaurant(prev => ({ ...prev, isActive: res.data.isActive }));
      toast.success(res.data.message);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.street || !form.area) return toast.error('Fill all required fields');
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('address[street]', form.street);
      formData.append('address[area]', form.area);
      formData.append('address[city]', 'Rangpur');
      await createRestaurant(formData);
      toast.success('Restaurant submitted for approval!');
      fetchData();
    } catch {}
    finally { setCreating(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = () => (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">Restaurant</div><div className="sidebar-sub">Portal</div></div></div>
      <nav className="sidebar-nav">
        <Link to="/restaurant" className="sidebar-link active"><FiHome />Dashboard</Link>
        <Link to="/restaurant/orders" className="sidebar-link"><FiList />Orders</Link>
        <Link to="/restaurant/menu" className="sidebar-link"><FiGrid />Menu</Link>
        <Link to="/restaurant/analytics" className="sidebar-link"><FiBarChart2 />Analytics</Link>
        <Link to="/restaurant/settings" className="sidebar-link"><FiSettings />Settings</Link>
      </nav>
      <button className="sidebar-logout" onClick={handleLogout}><FiLogOut />Logout</button>
    </aside>
  );

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><div className="page-loader"><div className="spinner" /></div></main></div>;

  if (noRestaurant) return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar"><h1 className="dashboard-title">Create Your Restaurant</h1></div>
        <div className="dashboard-content">
          <div className="card" style={{ padding: 28, maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--secondary)' }}>
              <FiAlertCircle size={20} />
              <span style={{ fontSize: 14 }}>Your restaurant will be reviewed by admin before going live.</span>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Restaurant Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Cuisine (comma separated)</label><input className="form-input" placeholder="e.g. Biriyani, Burger, Chicken" value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group"><label className="form-label">Street *</label><input className="form-input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Area *</label><input className="form-input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Min. Order (৳)</label><input type="number" className="form-input" value={form.minimumOrder} onChange={e => setForm({ ...form, minimumOrder: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Delivery Fee (৳)</label><input type="number" className="form-input" value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={creating}>{creating ? 'Submitting...' : 'Submit for Approval'}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">{restaurant?.name}</h1>
          <button className={`online-toggle ${restaurant?.isActive ? 'online' : ''}`} onClick={handleToggle}>
            <div className={`online-dot ${restaurant?.isActive ? 'active' : ''}`} />
            {restaurant?.isActive ? 'Open' : 'Closed'}
          </button>
        </div>
        {!restaurant?.isApproved && (
          <div className="approval-notice"><FiAlertCircle /> Your restaurant is pending admin approval. It won't be visible to customers yet.</div>
        )}
        <div className="stats-grid">
          <div className="stat-card card"><div className="stat-card-icon orange"><FiList /></div><div><div className="stat-card-value">{restaurant?.totalOrders || 0}</div><div className="stat-card-label">Total Orders</div></div></div>
          <div className="stat-card card"><div className="stat-card-icon green"><FiBarChart2 /></div><div><div className="stat-card-value">৳{restaurant?.totalRevenue || 0}</div><div className="stat-card-label">Total Revenue</div></div></div>
          <div className="stat-card card"><div className="stat-card-icon yellow"><FiGrid /></div><div><div className="stat-card-value">{restaurant?.rating?.average || 'New'}</div><div className="stat-card-label">Rating ({restaurant?.rating?.count || 0} reviews)</div></div></div>
        </div>
        <div className="dashboard-section">
          <h2 className="section-title-sm">Recent Orders</h2>
          {orders.length === 0 ? <div className="empty-state"><p>No orders yet</p></div> : (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td>{o.orderNumber}</td>
                      <td>{o.customer?.name}</td>
                      <td>৳{o.total}</td>
                      <td><span className={`badge status-${o.status}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
