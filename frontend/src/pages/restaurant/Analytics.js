import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRestaurant, getRestaurantOrders, getRestaurantEarnings } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut,
  FiTrendingUp, FiShoppingBag, FiStar, FiDollarSign,
  FiCreditCard, FiAlertCircle, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import '../admin/Dashboard.css';

export default function RestaurantAnalytics() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [restRes, ordersRes, earningsRes] = await Promise.all([
        getMyRestaurant(),
        getRestaurantOrders({ limit: 100 }),
        getRestaurantEarnings()
      ]);
      setRestaurant(restRes.data.restaurant);
      setOrders(ordersRes.data.orders || []);
      setEarnings(earningsRes.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const pendingOrders = orders.filter(o => ['pending','confirmed','preparing','ready_for_pickup'].includes(o.status));
  const avgOrderValue = deliveredOrders.length > 0
    ? (deliveredOrders.reduce((s,o) => s + o.total, 0) / deliveredOrders.length).toFixed(0) : 0;

  const s = earnings?.summary || {};

  const Sidebar = () => (
    <aside className="dashboard-sidebar">
      <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo">
        <div className="sidebar-logo-icon">R</div>
        <div><div className="sidebar-brand">Restaurant</div></div>
      </div>
      <nav className="sidebar-nav">
<Link to="/restaurant" className="sidebar-link"><FiHome />Dashboard</Link>
        <Link to="/restaurant/orders" className="sidebar-link"><FiList />Orders</Link>
        <Link to="/restaurant/menu" className="sidebar-link"><FiGrid />Menu</Link>
        <Link to="/restaurant/analytics" className="sidebar-link active"><FiBarChart2 />Analytics</Link>
        <Link to="/restaurant/settings" className="sidebar-link"><FiSettings />Settings</Link>
      </nav>
      <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}>
        <FiLogOut />Logout
      </button>
    </aside>
  );

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><div className="page-loader"><div className="spinner" /></div></main></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Analytics</h1>
          
        </div>

        <div className="dashboard-content">

          {/* ── Overview Stats ── */}
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-card-icon green"><FiDollarSign /></div>
              <div>
                <div className="stat-card-value">৳{(s.totalRevenue || 0).toLocaleString()}</div>
                <div className="stat-card-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card card">
              <div className="stat-card-icon orange"><FiShoppingBag /></div>
              <div>
                <div className="stat-card-value">{s.totalOrders || 0}</div>
                <div className="stat-card-label">Total Delivered</div>
              </div>
            </div>
            <div className="stat-card card">
              <div className="stat-card-icon blue"><FiTrendingUp /></div>
              <div>
                <div className="stat-card-value">৳{avgOrderValue}</div>
                <div className="stat-card-label">Avg Order Value</div>
              </div>
            </div>
            <div className="stat-card card">
              <div className="stat-card-icon yellow"><FiStar /></div>
              <div>
                <div className="stat-card-value">{restaurant?.rating?.average || 'N/A'}</div>
                <div className="stat-card-label">Rating ({restaurant?.rating?.count || 0})</div>
              </div>
            </div>
          </div>

          {/* ── Payment Breakdown ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* COD Summary */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                💵 Cash on Delivery
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                You receive this money directly from the rider
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#e8f5e9', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#2e7d32' }}>Total COD Orders</span>
                  <span style={{ fontWeight: 800, color: '#2e7d32' }}>{s.codOrders || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#e8f5e9', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#2e7d32' }}>Total COD Amount</span>
                  <span style={{ fontWeight: 800, color: '#2e7d32' }}>৳{(s.codRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f1f8e9', borderRadius: 8, fontSize: 12, color: '#558b2f', display: 'flex', gap: 6 }}>
                <FiCheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Rider collects cash from customer and delivers it to you directly.</span>
              </div>
            </div>

            {/* Online Payment Summary */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                📱 Online Payments (bKash/Nagad/Rocket)
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Platform collects this — you receive food amount minus delivery fee
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#e3f2fd', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#1565c0' }}>Online Orders</span>
                  <span style={{ fontWeight: 800, color: '#1565c0' }}>{s.onlineOrders || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#e3f2fd', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#1565c0' }}>Total Collected by Platform</span>
                  <span style={{ fontWeight: 800, color: '#1565c0' }}>৳{(s.onlineRevenue || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff8e1', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#f57f17' }}>Your Food Amount (owed to you)</span>
                  <span style={{ fontWeight: 800, color: '#f57f17' }}>৳{(s.onlineSubtotal || 0).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff3e0', borderRadius: 8, fontSize: 12, color: '#e65100', display: 'flex', gap: 6 }}>
                <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Platform (Admin) holds online payments. Contact admin to receive your food amount: ৳{(s.onlineSubtotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── Earnings Summary ── */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16 }}>💰 Earnings Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <div style={{ padding: 16, background: '#e8f5e9', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#558b2f', fontWeight: 700, marginBottom: 4 }}>RECEIVED (COD)</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2e7d32' }}>৳{(s.codRevenue || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#558b2f', marginTop: 4 }}>Cash in hand ✅</div>
              </div>
              <div style={{ padding: 16, background: '#fff8e1', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f57f17', fontWeight: 700, marginBottom: 4 }}>PENDING FROM PLATFORM</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#e65100' }}>৳{(s.onlineSubtotal || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#f57f17', marginTop: 4 }}>Contact admin to receive ⏳</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, textAlign: 'center', border: '2px solid var(--primary)' }}>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>TOTAL EARNED</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>৳{((s.codRevenue || 0) + (s.onlineSubtotal || 0)).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>All time 🏆</div>
              </div>
            </div>
          </div>

          {/* ── Recent Online Payment Orders ── */}
          {earnings?.recentOnlineOrders?.length > 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 4 }}>Recent Online Payment Orders</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                These payments were collected by the platform. Your food amount will be transferred by admin.
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Total Paid</th>
                    <th>Your Share (Food)</th>
                    <th>Delivery Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.recentOnlineOrders.map(o => (
                    <tr key={o._id}>
                      <td><strong>#{o.orderNumber}</strong></td>
                      <td><span className="badge badge-blue">{o.paymentMethod}</span></td>
                      <td>
                        {o.transactionId
                          ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#27ae60', fontWeight: 700 }}>{o.transactionId}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not provided</span>
                        }
                      </td>
                      <td><strong>৳{o.total}</strong></td>
                      <td style={{ color: '#f57f17', fontWeight: 700 }}>৳{o.subtotal}</td>
                      <td style={{ color: 'var(--text-muted)' }}>৳{o.deliveryFee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Order Status Breakdown ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Order Status</h3>
              {[
                { label: 'Delivered', value: deliveredOrders.length, color: 'var(--accent)' },
                { label: 'Active', value: pendingOrders.length, color: 'var(--secondary)' },
                { label: 'Cancelled', value: cancelledOrders.length, color: 'var(--primary)' }
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 12 }}>
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

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>How You Get Paid</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: '#e8f5e9', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>💵</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2e7d32' }}>Cash on Delivery</div>
                    <div style={{ color: '#558b2f', fontSize: 13, marginTop: 2 }}>Rider collects from customer → gives to you directly</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, background: '#e3f2fd', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>📱</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1565c0' }}>bKash / Nagad / Rocket</div>
                    <div style={{ color: '#1976d2', fontSize: 13, marginTop: 2 }}>Customer pays platform → Admin transfers your food amount to you</div>
                  </div>
                </div>
                <div style={{ padding: 12, background: '#fff3e0', borderRadius: 8, fontSize: 13, color: '#e65100' }}>
                  <FiInfo size={13} style={{ marginRight: 4 }} />
                  Contact admin at <strong>01794558994</strong> to receive your pending online payment earnings.
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
