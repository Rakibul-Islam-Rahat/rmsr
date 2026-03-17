import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../../services/api';
import {
  FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX,
  FiBell, FiHome, FiGrid, FiPackage, FiAward, FiChevronDown
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import './Navbar.css';

const ROLE_CONFIG = {
  admin:            { label: 'Admin',      color: '#8e44ad', bg: '#f3e5f5', dashPath: '/admin' },
  restaurant_owner: { label: 'Restaurant', color: '#e67e22', bg: '#fff3e0', dashPath: '/restaurant' },
  rider:            { label: 'Rider',      color: '#27ae60', bg: '#e8f5e9', dashPath: '/rider' },
  customer:         { label: 'Customer',   color: '#2980b9', bg: '#e3f2fd', dashPath: '/orders' },
};

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Real-time notification refresh via socket
  useEffect(() => {
    if (!user) return;
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    const join = () => {
      socket.emit('join_user', user._id);
      if (user.role === 'admin') socket.emit('join_admin');
    };
    if (socket.connected) join(); else socket.on('connect', join);
    // Refresh notification badge on any new notification
    socket.on('new_notification', () => fetchNotifications());
    socket.on('payment_pending', () => fetchNotifications());
    return () => socket.disconnect();
  }, [user?._id]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications.slice(0, 8));
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/restaurants', label: 'Restaurants' },
  ];

  const roleConf = user ? (ROLE_CONFIG[user.role] || ROLE_CONFIG.customer) : null;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">R</div>
          <span className="logo-text">RMSR</span>
          <span className="logo-sub">Food</span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          {user && (
            <div className="notif-wrapper" ref={notifRef}>
              <button className="icon-btn" onClick={() => {
                setNotifOpen(!notifOpen);
                if (!notifOpen) fetchNotifications();
              }}>
                <FiBell size={20} />
                {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart - customers only */}
          {(!user || user.role === 'customer') && (
            <Link to="/cart" className="icon-btn cart-btn">
              <FiShoppingCart size={20} />
              {cartCount > 0 && <span className="badge-dot">{cartCount}</span>}
            </Link>
          )}

          {/* User menu */}
          {user ? (
            <div className="user-menu-wrapper" ref={userRef}>
              <button className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="user-avatar-sm">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} />
                    : <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                  }
                </div>
                <div className="user-btn-info">
                  <span className="user-name">{user.name?.split(' ')[0]}</span>
                  <span className="user-role-tag" style={{ background: roleConf.bg, color: roleConf.color }}>
                    {roleConf.label}
                  </span>
                </div>
                <FiChevronDown size={13} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  {/* Header card */}
                  <div className="user-dropdown-card">
                    <div className="user-dropdown-avatar">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.name} />
                        : <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">{user.name}</div>
                      <div className="user-dropdown-email">{user.email}</div>
                      <span className="user-dropdown-badge" style={{ background: roleConf.bg, color: roleConf.color }}>
                        {roleConf.label}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Home - always shown */}
                  <Link to="/" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <FiHome size={15} /> Home
                  </Link>

                  {/* Dashboard link — role specific */}
                  {user.role === 'customer' && (
                    <Link to="/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <FiPackage size={15} /> My Dashboard
                    </Link>
                  )}
                  {user.role === 'restaurant_owner' && (
                    <Link to="/restaurant" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <FiGrid size={15} /> Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <FiGrid size={15} /> Admin Panel
                    </Link>
                  )}
                  {user.role === 'rider' && (
                    <Link to="/rider" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <FiGrid size={15} /> Rider Dashboard
                    </Link>
                  )}

                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FiLogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMenuOpen(false)}><FiHome /> Home</Link>
          <Link to="/restaurants" className="mobile-link" onClick={() => setMenuOpen(false)}><FiGrid /> Restaurants</Link>
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link to="/orders" className="mobile-link" onClick={() => setMenuOpen(false)}><FiPackage /> My Orders</Link>
                  <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}><FiUser /> Profile</Link>
                </>
              )}
              {user.role === 'restaurant_owner' && (
                <Link to="/restaurant" className="mobile-link" onClick={() => setMenuOpen(false)}><FiGrid /> Dashboard</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="mobile-link" onClick={() => setMenuOpen(false)}><FiGrid /> Admin Panel</Link>
              )}
              {user.role === 'rider' && (
                <Link to="/rider" className="mobile-link" onClick={() => setMenuOpen(false)}><FiGrid /> Rider Dashboard</Link>
              )}
              <button className="mobile-link" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
