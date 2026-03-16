import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRiderOrders, getAvailableOrders, acceptRiderOrder, updateRiderLocation, toggleRiderOnline, updateOrderStatus, updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiMapPin, FiPhone, FiPackage, FiLogOut, FiNavigation, FiWifi, FiMessageSquare, FiTrash2, FiAlertTriangle, FiSettings, FiCamera } from 'react-icons/fi';
import { deleteAccount } from '../../services/api';
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
  const locationAskedRef = useRef(false); // prevent repeated permission asks
  const activeOrderRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

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
    socket.on('new_order', () => {
      fetchOrders();
      toast.success('New order available! 🛵');
    });
    socket.on('reconnect', () => {
      if (user?._id) socket.emit('join_user', user._id);
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [myRes, availRes] = await Promise.all([
        getRiderOrders(),
        getAvailableOrders()
      ]);
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
          lng: loc.lng
        });
      }
    } catch (_) {}
  };

  const startLocationTracking = () => {
    // Prevent asking for location multiple times
    if (locationIntervalRef.current) return;

    const defaultLoc = { lat: 25.7439, lng: 89.2752 };

    const getLocation = () => {
      // If we already know permission is denied, use default
      if (locationAskedRef.current === 'denied') {
        const loc = {
          lat: defaultLoc.lat + (Math.random() - 0.5) * 0.002,
          lng: defaultLoc.lng + (Math.random() - 0.5) * 0.002
        };
        setCurrentLocation(loc);
        sendLocationUpdate(loc);
        return;
      }

      if (!navigator.geolocation) {
        // No GPS support — use default
        setCurrentLocation(defaultLoc);
        sendLocationUpdate(defaultLoc);
        locationAskedRef.current = 'denied';
        return;
      }

      // Only request permission once
      if (!locationAskedRef.current) {
        locationAskedRef.current = 'asking';
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            locationAskedRef.current = 'granted';
            const loc = { lat: coords.latitude, lng: coords.longitude };
            setCurrentLocation(loc);
            sendLocationUpdate(loc);
          },
          () => {
            // Permission denied or error — use simulated location
            locationAskedRef.current = 'denied';
            setCurrentLocation(defaultLoc);
            sendLocationUpdate(defaultLoc);
          },
          { timeout: 8000, enableHighAccuracy: false, maximumAge: 30000 }
        );
      } else if (locationAskedRef.current === 'granted') {
        // Already granted — get position silently
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const loc = { lat: coords.latitude, lng: coords.longitude };
            setCurrentLocation(loc);
            sendLocationUpdate(loc);
          },
          () => {
            // Silently use last known or default
            const loc = currentLocation || defaultLoc;
            sendLocationUpdate(loc);
          },
          { timeout: 5000, enableHighAccuracy: false, maximumAge: 15000 }
        );
      }
    };

    // Get location immediately once
    getLocation();

    // Then every 10 seconds — no more permission popups
    locationIntervalRef.current = setInterval(getLocation, 10000);
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
        startLocationTracking(); // only called once here
      } else {
        toast.success('You are now offline');
        stopLocationTracking();
        locationAskedRef.current = false; // reset for next online session
      }
    } catch (_) {}
  };

  const handleAccept = async (orderId) => {
    try {
      await acceptRiderOrder(orderId);
      toast.success('Order accepted! Head to the restaurant 🏍️');
      fetchOrders();
      setActiveTab('my');
      if (!isOnline) {
        setIsOnline(true);
        startLocationTracking();
      }
    } catch (_) {}
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status });
      const msgs = {
        on_the_way: 'Marked as on the way! 🚀',
        delivered: 'Order delivered! ✅'
      };
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) return toast.error('Only JPG, PNG, WEBP, GIF allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await updateProfile(formData);
      toast.success('Profile photo updated! 📸');
    } catch (_) {
      setAvatarPreview('');
    } finally { setUploadingPhoto(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      stopLocationTracking();
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (_) {}
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  };

  const activeOrderIds = myOrders.map(o => String(o._id));

  return (
    <div className="dashboard-layout">
      <ChatNotification activeOrderIds={activeOrderIds} onNewMessage={handleNewMessage} />

      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div>
            <div className="sidebar-brand">RMSR Rider</div>
            <div className="sidebar-sub">Delivery Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`sidebar-link ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
            style={{ cursor: 'pointer' }}
          >
            <FiPackage /> Available
            {availableOrders.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {availableOrders.length}
              </span>
            )}
          </div>
          <div
            className={`sidebar-link ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
            style={{ cursor: 'pointer' }}
          >
            <FiNavigation /> My Deliveries
            {myOrders.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--secondary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {myOrders.length}
              </span>
            )}
          </div>
          <div
            className={`sidebar-link ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            style={{ cursor: 'pointer' }}
          >
            <FiSettings /> Settings
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
            {/* Clickable avatar */}
            <div
              style={{ position: 'relative', width: 40, height: 40, flexShrink: 0, cursor: 'pointer' }}
              onClick={() => photoInputRef.current?.click()}
              title="Change photo"
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, overflow: 'hidden' }}>
                {avatarPreview || user?.avatar
                  ? <img src={avatarPreview || user?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.name?.charAt(0)?.toUpperCase()
                }
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#27ae60', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--dark)' }}>
                <FiCamera size={8} color="#fff" />
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }} onChange={handlePhotoChange} />
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                {uploadingPhoto ? 'Uploading...' : 'Tap photo to change'}
              </div>
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
          <button
            className={`online-toggle ${isOnline ? 'online' : ''}`}
            onClick={handleToggleOnline}
          >
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
                      <span className={`badge status-${order.status}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
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
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowSettings(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20, fontSize: 18 }}>Account Settings</h3>
            <div className="delete-account-section">
              <h4><FiAlertTriangle size={15} /> Delete Account</h4>
              <p>Permanently delete your rider account. All your delivery history will be removed. This cannot be undone.</p>
              <button className="btn-danger" onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}>
                <FiTrash2 size={15} /> Delete My Account
              </button>
            </div>
            <button className="btn btn-outline" style={{ marginTop: 16, width: '100%' }} onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete Account?</h3>
            <p>Your rider account will be permanently deleted. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
