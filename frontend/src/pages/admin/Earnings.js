import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminEarnings } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut, FiDollarSign, FiTrendingUp, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import './Dashboard.css';

export default function AdminEarnings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEarnings(); }, []);

  const fetchEarnings = async () => {
    try {
      const res = await getAdminEarnings();
      setData(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const p = data?.platform || {};

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">RMSR Admin</div></div>
        </div>
        <nav className="sidebar-nav">
<Link to="/admin" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid />Restaurants</Link>
          <Link to="/admin/users" className="sidebar-link"><FiUsers />Users</Link>
          <Link to="/admin/orders" className="sidebar-link"><FiPackage />Orders</Link>
          <Link to="/admin/earnings" className="sidebar-link active"><FiDollarSign />Earnings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}>
          <FiLogOut />Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Earnings & Payments</h1>
          
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="dashboard-content">

            {/* ── Platform Summary ── */}
            <div className="stats-grid">
              <div className="stat-card card">
                <div className="stat-card-icon green"><FiDollarSign /></div>
                <div>
                  <div className="stat-card-value">৳{(p.totalRevenue || 0).toLocaleString()}</div>
                  <div className="stat-card-label">Total Platform Revenue</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon blue"><FiCreditCard /></div>
                <div>
                  <div className="stat-card-value">৳{(p.totalOnlinePayments || 0).toLocaleString()}</div>
                  <div className="stat-card-label">Online Payments Collected</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon orange"><FiTrendingUp /></div>
                <div>
                  <div className="stat-card-value">৳{(p.totalDeliveryFees || 0).toLocaleString()}</div>
                  <div className="stat-card-label">Total Delivery Fees</div>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-card-icon yellow"><FiPackage /></div>
                <div>
                  <div className="stat-card-value">{p.totalOrders || 0}</div>
                  <div className="stat-card-label">Total Delivered Orders</div>
                </div>
              </div>
            </div>

            {/* ── Payment Flow Explanation ── */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16 }}>💡 How RMSR Payment Works</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: 16, background: '#e8f5e9', borderRadius: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2e7d32', marginBottom: 8 }}>💵 Cash on Delivery</div>
                  <div style={{ fontSize: 13, color: '#558b2f', lineHeight: 1.7 }}>
                    Customer → pays cash to Rider → Rider gives to Restaurant Owner<br />
                    <strong>Platform earns: ৳0 (no cut)</strong>
                  </div>
                </div>
                <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1565c0', marginBottom: 8 }}>📱 Online (bKash/Nagad/Rocket)</div>
                  <div style={{ fontSize: 13, color: '#1976d2', lineHeight: 1.7 }}>
                    Customer → pays to 01794558994 (you) → You transfer food amount to restaurant<br />
                    <strong>Platform keeps: Delivery fee</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Per Restaurant Earnings ── */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 4 }}>What You Owe Each Restaurant</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                For online payments — you collected the full amount. You need to transfer the food subtotal back to each restaurant owner.
              </p>

              {!data?.earnings?.length ? (
                <div className="empty-state"><p>No delivered orders yet</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Owner</th>
                      <th>COD Orders</th>
                      <th>COD Amount</th>
                      <th>Online Orders</th>
                      <th>Online Collected</th>
                      <th style={{ background: '#fff8e1', color: '#f57f17' }}>⚠️ You Owe</th>
                      <th>Delivery Fees Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.earnings.map(e => (
                      <tr key={e._id}>
                        <td><strong>{e.restaurant?.name}</strong></td>
                        <td>
                          <div style={{ fontSize: 13 }}>{e.owner?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.owner?.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.owner?.phone}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{e.codOrders}</td>
                        <td style={{ color: '#2e7d32', fontWeight: 700 }}>৳{(e.codRevenue || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>{e.onlineOrders}</td>
                        <td style={{ color: '#1565c0', fontWeight: 700 }}>৳{(e.onlineRevenue || 0).toLocaleString()}</td>
                        <td>
                          <div style={{
                            background: e.onlineSubtotal > 0 ? '#fff8e1' : '#e8f5e9',
                            color: e.onlineSubtotal > 0 ? '#e65100' : '#2e7d32',
                            fontWeight: 800, fontSize: 15,
                            padding: '6px 12px', borderRadius: 8, textAlign: 'center'
                          }}>
                            {e.onlineSubtotal > 0 ? `৳${(e.onlineSubtotal || 0).toLocaleString()}` : '✅ Paid'}
                          </div>
                        </td>
                        <td style={{ color: 'var(--primary)', fontWeight: 700 }}>
                          ৳{(e.onlineDeliveryFee || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td colSpan={6} style={{ textAlign: 'right', paddingRight: 16, fontSize: 14 }}>Total you owe to all restaurants:</td>
                      <td style={{ color: '#e65100', fontSize: 16, fontWeight: 900 }}>
                        ৳{(data.earnings.reduce((s, e) => s + (e.onlineSubtotal || 0), 0)).toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 900 }}>
                        ৳{(data.earnings.reduce((s, e) => s + (e.onlineDeliveryFee || 0), 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {data?.earnings?.some(e => e.onlineSubtotal > 0) && (
                <div style={{ marginTop: 16, padding: '14px 18px', background: '#fff3e0', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <FiAlertCircle size={18} style={{ color: '#e65100', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#bf360c', lineHeight: 1.7 }}>
                    <strong>Action Required:</strong> You have collected online payments on behalf of restaurant owners.
                    Please transfer the "You Owe" amount to each restaurant owner via bKash/Nagad/Rocket using their registered phone number.
                    Check the owner's phone number in the table above.
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
