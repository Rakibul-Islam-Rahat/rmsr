import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/api';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import CustomerSidebar from './CustomerSidebar';
import './CustomerDashboard.css';
import './Orders.css';

const STATUS_LABELS = {
  payment_pending:  { label: '⏳ Awaiting Payment Verification', class: 'badge-yellow' },
  payment_rejected: { label: '❌ Payment Rejected',              class: 'badge-red' },
  pending:          { label: 'Pending',          class: 'status-pending' },
  confirmed:        { label: 'Confirmed',        class: 'status-confirmed' },
  preparing:        { label: 'Preparing',        class: 'status-preparing' },
  ready_for_pickup: { label: 'Ready for Pickup', class: 'status-preparing' },
  picked_up:        { label: 'Picked Up',        class: 'status-on_the_way' },
  on_the_way:       { label: 'On the Way',       class: 'status-on_the_way' },
  delivered:        { label: 'Delivered',        class: 'status-delivered' },
  cancelled:        { label: 'Cancelled',        class: 'status-cancelled' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => { fetchOrders(); }, [activeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = activeFilter ? { status: activeFilter } : {};
      const res = await getMyOrders(params);
      setOrders(res.data.orders);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="customer-dashboard">
      <CustomerSidebar />
      <div className="customer-main">
        <div className="customer-topbar">
          <h1 className="customer-page-title">My Orders</h1>
        </div>
        <div className="customer-content">
          <div className="order-filters" style={{ marginBottom: 20 }}>
            {[
              { value: '', label: 'All Orders' },
              { value: 'payment_pending', label: '⏳ Awaiting Verification' },
              { value: 'pending', label: 'Active' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' }
            ].map(f => (
              <button
                key={f.value}
                className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <div style={{ fontSize: 64 }}>📦</div>
              <h3>No orders yet</h3>
              <p>Your orders will appear here</p>
              <Link to="/restaurants" className="btn btn-primary">Order Now</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <Link
                  key={order._id}
                  to={order.status === 'payment_pending' || order.status === 'payment_rejected'
                    ? '#'
                    : `/orders/${order._id}`}
                  className="order-card card"
                  onClick={e => (order.status === 'payment_pending' || order.status === 'payment_rejected') && e.preventDefault()}
                >
                  <div className="order-card-left">
                    <div className="order-restaurant-icon">🍽️</div>
                    <div>
                      <div className="order-restaurant-name">{order.restaurant?.name}</div>
                      <div className="order-number">#{order.orderNumber}</div>
                      <div className="order-items-preview">
                        {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                        {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                      {order.status === 'payment_pending' && (
                        <div style={{ fontSize: 12, color: '#d97706', background: '#fffbeb', padding: '3px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>
                          Your payment is being verified by admin
                        </div>
                      )}
                      {order.status === 'payment_rejected' && order.statusHistory?.slice(-1)[0]?.note && (
                        <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>
                          {order.statusHistory.slice(-1)[0].note}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="order-card-right">
                    <span className={`badge ${STATUS_LABELS[order.status]?.class || 'badge-gray'}`}>
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </span>
                    <div className="order-total">৳{order.total}</div>
                    {order.status !== 'payment_pending' && order.status !== 'payment_rejected' && (
                      <FiChevronRight color="var(--text-muted)" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
