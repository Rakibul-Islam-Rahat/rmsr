// src/pages/admin/Orders.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminOrders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut } from 'react-icons/fi';
import '../admin/Dashboard.css';

export default function AdminOrders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getAdminOrders(params);
      setOrders(res.data.orders);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">RMSR Admin</div></div></div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link"><FiHome /></Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid /></Link>
          <Link to="/admin/users" className="sidebar-link"><FiUsers /></Link>
          <Link to="/admin/orders" className="sidebar-link active"><FiPackage /></Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut /></button>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar"><h1 className="dashboard-title">All Orders</h1></div>
        <div className="dashboard-content">
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200, marginBottom: 20 }}>
            <option value="">All Statuses</option>
            {['pending','confirmed','preparing','ready_for_pickup','picked_up','on_the_way','delivered','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
          {loading ? <div className="page-loader"><div className="spinner" /></div> : (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Restaurant</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td>{o.orderNumber}</td>
                      <td>{o.customer?.name}</td>
                      <td>{o.restaurant?.name}</td>
                      <td>৳{o.total}</td>
                      <td>{o.paymentMethod?.replace(/_/g,' ')}</td>
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
