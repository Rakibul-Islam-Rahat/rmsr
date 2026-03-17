// src/pages/admin/Restaurants.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminRestaurants, approveRestaurant, featureRestaurant } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut, FiStar, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

export default function AdminRestaurants() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchRestaurants(); }, [filter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { approved: filter === 'approved' } : {};
      const res = await getAdminRestaurants(params);
      setRestaurants(res.data.restaurants);
    } catch {}
    finally { setLoading(false); }
  };

  const handleApprove = async (id, approve) => {
    try {
      await approveRestaurant(id, approve);
      toast.success(`Restaurant ${approve ? 'approved' : 'rejected'}`);
      fetchRestaurants();
    } catch {}
  };

  const handleFeature = async (id, featured) => {
    try {
      await featureRestaurant(id, featured);
      toast.success(`Restaurant ${featured ? 'featured' : 'unfeatured'}`);
      fetchRestaurants();
    } catch {}
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">RMSR Admin</div></div></div>
        <nav className="sidebar-nav">
<Link to="/admin" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link active"><FiGrid />Restaurants</Link>
          <Link to="/admin/users" className="sidebar-link"><FiUsers />Users</Link>
          <Link to="/admin/orders" className="sidebar-link"><FiPackage />Orders</Link>
          <Link to="/admin/earnings" className="sidebar-link"><FiDollarSign />Earnings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut />Logout</button>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-home">RMSR Home</Link>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-section">Admin Dashboard</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Restaurants</span>
          </div></div>
        <div className="dashboard-content">
          <div className="filter-tabs" style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
            {['all', 'pending', 'approved'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {loading ? <div className="page-loader"><div className="spinner" /></div> : (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Owner</th><th>Area</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {restaurants.map(r => (
                    <tr key={r._id}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.owner?.name}</td>
                      <td>{r.address?.area}</td>
                      <td>
                        <span className={`badge ${r.isApproved ? 'badge-green' : 'badge-yellow'}`}>
                          {r.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        {r.isFeatured && <span className="badge badge-yellow" style={{ marginLeft: 4 }}>★ Featured</span>}
                      </td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!r.isApproved && <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r._id, true)}><FiCheck /></button>}
                        {r.isApproved && <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(r._id, false)}><FiX /></button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleFeature(r._id, !r.isFeatured)}><FiStar /></button>
                      </td>
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
