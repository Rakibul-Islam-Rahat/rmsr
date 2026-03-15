import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRiderOrders, getAvailableOrders, acceptRiderOrder, updateRiderLocation, toggleRiderOnline, updateOrderStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiMapPin, FiPhone, FiPackage, FiLogOut, FiNavigation, FiWifi, FiMessageSquare } from 'react-icons/fi';
import ChatPanel from '../../components/common/ChatPanel';
import ChatNotification from '../../components/common/ChatNotification';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';
import './Rider.css';

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [unreadChats, setUnreadChats] = useState({});
  const socketRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const activeOrderRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    setupSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    const active = myOrders.find(o => ['picked_up', 'on_the_way'].includes(o.status));
    activeOrderRef.current = active || null;
  }, [myOrders]);

  const setupSocket = () => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      if (user?._id) socket.emit('join_user', user._id);
    });
    socket.on('new_order', () => { fetchOrders(); toast.success('New order available! 🛵'); });
    socket.on('reconnect', () => {
      if (user?._id) socket.emit('join_user', user._id);
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [myRes, availRes] = await Promise.all([getRiderOrders(), getAvailableOrders()]);
      setMyOrders(myRes.data.orders || []);
      setAvailableOrders(availRes.data.orders || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const sendLocationUpdate = async (loc) => {
    try {
      await updateRiderLocation(loc);
      if (socketRef.current && activeOrderRef.current) {
        socketRef.current.emit('rider_location_update', {
          orderId: activeOrderRef.current._id,
          lat: loc.lat,
          lng: loc.lng,
          riderId: user?._id
        });
      }
    } catch (_) {}
  };

  const startLocationTracking = () => {
    const defaultLoc = { lat: 25.7439, lng: 89.2752 };

    const getAndSend = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const loc = { lat: coords.latitude, lng: coords.longitude };
            setCurrentLocation(loc);
            sendLocationUpdate(loc);
          },
          () => {
            // GPS unavailable — use simulated movement for demo
            setCurrentLocation(prev => {
              const base = prev || defaultLoc;
              const loc = {
                lat: base.lat + (Math.random() - 0.5) * 0.001,
                lng: base.lng + (Math.random() - 0.5) * 0.001
              };
              sendLocationUpdate(loc);
              return loc;
            });
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      } else {
        setCurrentLocation(defaultLoc);
        sendLocationUpdate(defaultLoc);
      }
    };

    getAndSend();
    locationIntervalRef.current = setInterval(getAndSend, 10000);
  };

  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setCurrentLocation(null);
  };

  const handleToggleOnline = async () => {
    try {
      const res = await toggleRiderOnline();
      setIsOnline(res.data.isOnline);
      if (res.data.isOnline) {
        toast.success('You are now online! 🟢');
        startLocationTracking();
      } else {
        toast.success('You are now offline');
        stopLocationTracking();
      }
    } catch (_) {}
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
      toast.success('Order accepted! Head to the restaurant 🏍️');
      fetchOrders();
      setActiveTab('my');
      if (!isOnline) { startLocationTracking(); setIsOnline(true); }
    } catch (_) {}
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status });
      const msgs = { on_the_way: 'Marked as on the way!', delivered: 'Order delivered! ✅' };
      toast.success(msgs[status] || 'Status updated');
      fetchOrders();
      if (status === 'delivered') stopLocationTracking();
    } catch (_) {}
  };

  const handleNewMessage = (msg) => {
    const orderId = String(msg.order);
    setUnreadChats(prev => ({ ...prev, [orderId]: (prev[orderId] || 0) + 1 }));
    const order = myOrders.find(o => String(o._id) === orderId);
    if (order && (!activeChatOrder || String(activeChatOrder._id) !== orderId)) {
      setActiveChatOrder(order);
    }
  };

  const activeOrderIds = myOrders.map(o => String(o._id));

  return (
    <div className="dashboard-layout">
      <ChatNotification activeOrderIds={activeOrderIds} onNewMessage={handleNewMessage} />

      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">RMSR Rider</div><div className="sidebar-sub">Delivery Portal</div></div>
        </div>
        <nav className="sidebar-nav">
          <div className={`sidebar-link ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')} style={{ cursor: 'pointer' }}>
            <FiPackage /> Available
            {availableOrders.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {availableOrders.length}
              </span>
            )}
          </div>
          <div className={`sidebar-link ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')} style={{ cursor: 'pointer' }}>
            <FiNavigation /> My Deliveries
            {myOrders.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--secondary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {myOrders.length}
              </span>
            )}
          </div>
        </nav>

        {currentLocation && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#27ae60', fontSize: 12, fontWeight: 600 }}>
              <FiWifi size={12} /> GPS Active
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </div>
          </div>
        )}

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Rider</div>
            </div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={() => { stopLocationTracking(); logout(); navigate('/'); }}>
          <FiLogOut /> Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">
            {activeTab === 'available' ? 'Available Orders' : 'My Deliveries'}
          </h1>
          <button className={`online-toggle ${isOnline ? 'online' : ''}`} onClick={handleToggleOnline}>
            <div className={`online-dot ${isOnline ? 'active' : ''}`} />
            {isOnline ? 'Online' : 'Go Online'}
          </button>
        </div>

        {!isOnline && (
          <div className="rider-offline-banner">
            <FiNavigation size={16} />
            <span>You are offline. Click "Go Online" to start receiving orders.</span>
          </div>
        )}

        <div className="dashboard-content">
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : activeTab === 'available' ? (
            availableOrders.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 56 }}>🏍️</div>
                <h3>No orders available</h3>
                <p>{isOnline ? 'Waiting for new orders...' : 'Go online to see available orders'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {availableOrders.map(order => (
                  <div key={order._id} className="rider-order-card card">
                    <div className="rider-order-header">
                      <div>
                        <div className="rider-order-number">#{order.orderNumber}</div>
                        <div className="rider-restaurant-name">{order.restaurant?.name}</div>
                        <div className="rider-restaurant-address">
                          <FiMapPin size={12} /> {order.restaurant?.address?.area}, {order.restaurant?.address?.city}
                        </div>
                      </div>
                      <div className="rider-order-amount">৳{order.total}</div>
                    </div>
                    <div className="rider-delivery-info">
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deliver to:</span><br />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{order.deliveryAddress?.area}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Items:</span><br />
                        <span style={{ fontSize: 13 }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment:</span><br />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{order.paymentMethod?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="rider-order-actions">
                      {order.restaurant?.phone && (
                        <a href={`tel:${order.restaurant.phone}`} className="btn btn-ghost btn-sm">
                          <FiPhone size={13} /> Call Restaurant
                        </a>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={() => handleAccept(order._id)}>
                        Accept Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            myOrders.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 56 }}>📦</div>
                <h3>No active deliveries</h3>
                <p>Accept orders from the Available tab</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myOrders.map(order => (
                  <div key={order._id} className="rider-order-card card active-delivery">
                    <div className="rider-order-header">
                      <div>
                        <div className="rider-order-number">#{order.orderNumber}</div>
                        <div className="rider-restaurant-name">{order.restaurant?.name}</div>
                      </div>
                      <span className={`badge status-${order.status}`}>{order.status?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="rider-delivery-route">
                      <div className="route-point pickup">
                        <div className="route-dot" />
                        Pick up: {order.restaurant?.address?.area}
                      </div>
                      <div className="route-line" />
                      <div className="route-point deliver">
                        <div className="route-dot deliver" />
                        Deliver to: {order.deliveryAddress?.area}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {order.customer?.phone && (
                        <a href={`tel:${order.customer.phone}`} className="btn btn-ghost btn-sm">
                          <FiPhone size={13} /> Customer
                        </a>
                      )}
                      {order.restaurant?.phone && (
                        <a href={`tel:${order.restaurant.phone}`} className="btn btn-ghost btn-sm">
                          <FiPhone size={13} /> Restaurant
                        </a>
                      )}
                      {order.status === 'picked_up' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(order._id, 'on_the_way')}>
                          <FiNavigation size={13} /> On the Way
                        </button>
                      )}
                      {order.status === 'on_the_way' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(order._id, 'delivered')}>
                          ✅ Mark Delivered
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => {
                          setActiveChatOrder(prev => prev?._id === order._id ? null : order);
                          setUnreadChats(prev => ({ ...prev, [order._id]: 0 }));
                        }}
                      >
                        <FiMessageSquare size={14} /> Chat
                        {unreadChats[order._id] > 0 && (
                          <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {unreadChats[order._id]}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Floating chat panel */}
        {activeChatOrder && (
          <div style={{ position: 'fixed', bottom: 20, right: 20, width: 340, zIndex: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', borderRadius: 14 }}>
            <ChatPanel
              orderId={activeChatOrder._id}
              orderNumber={activeChatOrder.orderNumber}
              onClose={() => setActiveChatOrder(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
