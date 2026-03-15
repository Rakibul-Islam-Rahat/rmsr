import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRestaurant, getRestaurantOrders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut, FiTrendingUp, FiShoppingBag, FiStar, FiDollarSign } from 'react-icons/fi';
import '../admin/Dashboard.css';

export default function RestaurantAnalytics() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [restRes, ordersRes] = await Promise.all([
        getMyRestaurant(),
        getRestaurantOrders({ limit: 100 })
      ]);
      setRestaurant(restRes.data.restaurant);
      setOrders(ordersRes.data.orders);
    } catch {}
    finally { setLoading(false); }
  };

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status));
  const avgOrderValue = deliveredOrders.length > 0
    ? (deliveredOrders.reduce((s, o) => s + o.total, 0) / deliveredOrders.length).toFixed(0)
    : 0;

  const paymentBreakdown = orders.reduce((acc, o) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + 1;
    return acc;
  }, {});

  const Sidebar = () => (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">Restaurant</div></div></div>
      <nav className="sidebar-nav">
        <Link to="/restaurant" className="sidebar-link"><FiHome />Dashboard</Link>
        <Link to="/restaurant/orders" className="sidebar-link"><FiList />Orders</Link>
        <Link to="/restaurant/menu" className="sidebar-link"><FiGrid />Menu</Link>
        <Link to="/restaurant/analytics" className="sidebar-link active"><FiBarChart2 />Analytics</Link>
        <Link to="/restaurant/settings" className="sidebar-link"><FiSettings />Settings</Link>
      </nav>
      <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut />Logout</button>
    </aside>
  );

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><div className="page-loader"><div className="spinner" /></div></main></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar"><h1 className="dashboard-title">Analytics</h1></div>
        <div className="stats-grid">
          <div className="stat-card card"><div className="stat-card-icon green"><FiDollarSign /></div><div><div className="stat-card-value">৳{restaurant?.totalRevenue?.toLocaleString() || 0}</div><div className="stat-card-label">Total Revenue</div></div></div>
          <div className="stat-card card"><div className="stat-card-icon orange"><FiShoppingBag /></div><div><div className="stat-card-value">{restaurant?.totalOrders || 0}</div><div className="stat-card-label">Total Orders</div></div></div>
          <div className="stat-card card"><div className="stat-card-icon blue"><FiTrendingUp /></div><div><div className="stat-card-value">৳{avgOrderValue}</div><div className="stat-card-label">Avg Order Value</div></div></div>
          <div className="stat-card card"><div className="stat-card-icon yellow"><FiStar /></div><div><div className="stat-card-value">{restaurant?.rating?.average || 'N/A'}</div><div className="stat-card-label">Rating ({restaurant?.rating?.count || 0})</div></div></div>
        </div>
        <div className="dashboard-section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Order breakdown */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Order Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Delivered', value: deliveredOrders.length, color: 'var(--accent)' },
                  { label: 'Active', value: pendingOrders.length, color: 'var(--secondary)' },
                  { label: 'Cancelled', value: cancelledOrders.length, color: 'var(--primary)' }
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontWeight: 700 }}>{item.value}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${orders.length > 0 ? (item.value / orders.length) * 100 : 0}%`, background: item.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Payment methods */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Payment Methods</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(paymentBreakdown).map(([method, count]) => (
                  <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{method.replace(/_/g, ' ')}</span>
                    <span className="badge badge-blue">{count} orders</span>
                  </div>
                ))}
                {Object.keys(paymentBreakdown).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No payment data yet</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
