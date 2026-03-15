import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminDashboard, approveRestaurant, getAdminRestaurants } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiGrid, FiPackage, FiDollarSign, FiCheck, FiX, FiLogOut, FiHome, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dashRes, restRes] = await Promise.all([
        getAdminDashboard(),
        getAdminRestaurants({ approved: false })
      ]);
      setStats(dashRes.data.stats);
      setRecentOrders(dashRes.data.recentOrders);
      setPendingRestaurants(restRes.data.restaurants);
    } catch {}
    finally { setLoading(false); }
  };

  const handleApprove = async (id, approve) => {
    try {
      await approveRestaurant(id, approve);
      toast.success(`Restaurant ${approve ? 'approved' : 'rejected'}`);
      setPendingRestaurants(prev => prev.filter(r => r._id !== id));
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">RMSR Admin</div><div className="sidebar-sub">Control Panel</div></div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link active"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid />Restaurants</Link>
          <Link to="/admin/users" className="sidebar-link"><FiUsers />Users</Link>
          <Link to="/admin/orders" className="sidebar-link"><FiPackage />Orders</Link>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}><FiLogOut />Logout</button>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Dashboard Overview</h1>
        </div>

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card card">
                <div className="stat-card-icon blue"><FiUsers /></div>
                <div><div className="stat-card-value">{stats?.totalUsers}</div><div className="stat-card-label">Total Customers</div></div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon green"><FiGrid /></div>
                <div><div className="stat-card-value">{stats?.totalRestaurants}</div><div className="stat-card-label">Active Restaurants</div></div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon orange"><FiPackage /></div>
                <div><div className="stat-card-value">{stats?.totalOrders}</div><div className="stat-card-label">Total Orders</div></div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon red"><FiDollarSign /></div>
                <div><div className="stat-card-value">৳{stats?.totalRevenue?.toLocaleString()}</div><div className="stat-card-label">Total Revenue</div></div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon yellow"><FiStar /></div>
                <div><div className="stat-card-value">{stats?.activeOrders}</div><div className="stat-card-label">Active Orders</div></div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon purple"><FiPackage /></div>
                <div><div className="stat-card-value">{stats?.todayOrders}</div><div className="stat-card-label">Today's Orders</div></div>
              </div>
            </div>

            {/* Pending Restaurants */}
            {pendingRestaurants.length > 0 && (
              <div className="dashboard-section">
                <h2 className="section-title-sm">Pending Approvals ({pendingRestaurants.length})</h2>
                <div className="approval-list">
                  {pendingRestaurants.map(r => (
                    <div key={r._id} className="approval-card card">
                      <div className="approval-info">
                        <div className="approval-name">{r.name}</div>
                        <div className="approval-owner">{r.owner?.name} · {r.owner?.email}</div>
                        <div className="approval-address">{r.address?.area}, {r.address?.city}</div>
                      </div>
                      <div className="approval-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r._id, true)}><FiCheck /> Approve</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }} onClick={() => handleApprove(r._id, false)}><FiX /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="dashboard-section">
              <h2 className="section-title-sm">Recent Orders</h2>
              <div className="card">
                <table className="data-table">
                  <thead><tr><th>Order #</th><th>Customer</th><th>Restaurant</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.customer?.name}</td>
                        <td>{order.restaurant?.name}</td>
                        <td>৳{order.total}</td>
                        <td><span className={`badge status-${order.status}`}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
