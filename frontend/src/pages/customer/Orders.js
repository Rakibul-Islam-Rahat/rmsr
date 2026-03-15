import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/api';
import { FiPackage, FiClock, FiChevronRight } from 'react-icons/fi';
import './Orders.css';

const STATUS_LABELS = {
  pending: { label: 'Pending', class: 'status-pending' },
  confirmed: { label: 'Confirmed', class: 'status-confirmed' },
  preparing: { label: 'Preparing', class: 'status-preparing' },
  ready_for_pickup: { label: 'Ready for Pickup', class: 'status-preparing' },
  picked_up: { label: 'Picked Up', class: 'status-on_the_way' },
  on_the_way: { label: 'On the Way', class: 'status-on_the_way' },
  delivered: { label: 'Delivered', class: 'status-delivered' },
  cancelled: { label: 'Cancelled', class: 'status-cancelled' }
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
    <div className="orders-page container">
      <h1 className="page-title">My Orders</h1>

      <div className="order-filters">
        {[
          { value: '', label: 'All Orders' },
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
            <Link key={order._id} to={`/orders/${order._id}`} className="order-card card">
              <div className="order-card-left">
                <div className="order-restaurant-icon">🍽️</div>
                <div>
                  <div className="order-restaurant-name">{order.restaurant?.name}</div>
                  <div className="order-number">#{order.orderNumber}</div>
                  <div className="order-items-preview">
                    {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                    {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                  </div>
                </div>
              </div>
              <div className="order-card-right">
                <span className={`badge ${STATUS_LABELS[order.status]?.class || 'badge-gray'}`}>
                  {STATUS_LABELS[order.status]?.label || order.status}
                </span>
                <div className="order-total">৳{order.total}</div>
                <FiChevronRight color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
