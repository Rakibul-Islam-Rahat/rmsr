import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRestaurantOrders, updateOrderStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiList, FiGrid, FiSettings, FiBarChart2, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { io } from 'socket.io-client';
import ChatPanel from '../../components/common/ChatPanel';
import ChatNotification from '../../components/common/ChatNotification';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready_for_pickup',
  ready_for_pickup: null
};

const STATUS_COLORS = {
  pending: 'badge-yellow', confirmed: 'badge-blue', preparing: 'badge-blue',
  ready_for_pickup: 'badge-green', picked_up: 'badge-green', on_the_way: 'badge-blue',
  delivered: 'badge-green', cancelled: 'badge-red'
};

export default function RestaurantOrders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [unreadChats, setUnreadChats] = useState({});

  useEffect(() => {
    fetchOrders();
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socket.on('new_order', () => {
      fetchOrders();
      toast.success('🔔 New order received!');
    });
    return () => socket.disconnect();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getRestaurantOrders(params);
      setOrders(res.data.orders || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status });
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (_) {}
  };

  const handleNewMessage = (msg) => {
    const orderId = msg.order;
    setUnreadChats(prev => ({ ...prev, [orderId]: (prev[orderId] || 0) + 1 }));
    const order = orders.find(o => o._id === orderId || String(o._id) === String(orderId));
    if (order && (!activeChatOrder || activeChatOrder._id !== orderId)) {
      setActiveChatOrder(order);
    }
  };

  const activeOrderIds = orders
    .filter(o => !['delivered', 'cancelled'].includes(o.status))
    .map(o => o._id);

  return (
    <div className="dashboard-layout">
      <ChatNotification activeOrderIds={activeOrderIds} onNewMessage={handleNewMessage} />

      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">Restaurant</div></div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/restaurant" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/restaurant/orders" className="sidebar-link active"><FiList />Orders</Link>
          <Link to="/restaurant/menu" className="sidebar-link"><FiGrid />Menu</Link>
          <Link to="/restaurant/analytics" className="sidebar-link"><FiBarChart2 />Analytics</Link>
          <Link to="/restaurant/settings" className="sidebar-link"><FiSettings />Settings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}>
          <FiLogOut />Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Orders</h1>
          <select className="form-input" value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Orders</option>
            {['pending','confirmed','preparing','ready_for_pickup','delivered','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 20, padding: '20px 28px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
              <div className="empty-state"><p>No orders found</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(o => (
                  <div key={o._id} className="card" style={{
                    padding: '16px 20px',
                    borderLeft: activeChatOrder?._id === o._id ? '4px solid var(--primary)' : undefined
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>#{o.orderNumber} — {o.customer?.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0' }}>📞 {o.customer?.phone}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                        </div>
                        {o.specialInstructions && (
                          <div style={{ fontSize: 12, color: '#f57f17', background: '#fff8e1', padding: '4px 8px', borderRadius: 6, marginTop: 4 }}>
                            📝 {o.specialInstructions}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          📍 {o.deliveryAddress?.area}, {o.deliveryAddress?.city}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>৳{o.total}</div>
                        <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>
                          {o.status?.replace(/_/g,' ')}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {o.paymentMethod?.replace(/_/g,' ')} · {o.paymentStatus}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {NEXT_STATUS[o.status] && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateStatus(o._id, NEXT_STATUS[o.status])}>
                          ✓ Mark as {NEXT_STATUS[o.status]?.replace(/_/g,' ')}
                        </button>
                      )}
                      {o.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}
                          onClick={() => handleUpdateStatus(o._id, 'cancelled')}>
                          ✗ Cancel
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                          color: activeChatOrder?._id === o._id ? 'var(--primary)' : undefined,
                          background: activeChatOrder?._id === o._id ? 'rgba(192,57,43,0.08)' : undefined
                        }}
                        onClick={() => {
                          setActiveChatOrder(prev => prev?._id === o._id ? null : o);
                          setUnreadChats(prev => ({ ...prev, [o._id]: 0 }));
                        }}
                      >
                        <FiMessageSquare size={14} />
                        Chat
                        {unreadChats[o._id] > 0 && (
                          <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {unreadChats[o._id]}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeChatOrder && (
            <div style={{ width: 340, flexShrink: 0, position: 'sticky', top: 80 }}>
              <ChatPanel
                orderId={activeChatOrder._id}
                orderNumber={activeChatOrder.orderNumber}
                onClose={() => setActiveChatOrder(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
