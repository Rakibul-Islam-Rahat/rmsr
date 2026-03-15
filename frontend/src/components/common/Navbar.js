import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../../services/api';
import {
  FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX,
  FiBell, FiHome, FiGrid, FiPackage, FiAward, FiChevronDown
} from 'react-icons/fi';
import './Navbar.css';

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
    { to: '/', label: 'Home', icon: <FiHome /> },
    { to: '/restaurants', label: 'Restaurants', icon: <FiGrid /> },
  ];

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
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn cart-btn">
            <FiShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              {/* Notifications */}
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="nav-icon-btn"
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                >
                  <FiBell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div className="notif-list">
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
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="user-menu-wrapper" ref={userRef}>
                <button className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="user-avatar">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} />
                      : <span>{user.name?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <span className="user-name">{user.name?.split(' ')[0]}</span>
                  <FiChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user.name}</div>
                      <div className="user-dropdown-role">{user.role.replace('_', ' ')}</div>
                    </div>
                    {user.role === 'customer' && (
                      <>
                        <Link to="/profile" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiUser size={15} /> My Profile
                        </Link>
                        <Link to="/orders" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiPackage size={15} /> My Orders
                        </Link>
                        <Link to="/loyalty" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiAward size={15} /> Loyalty Points
                        </Link>
                      </>
                    )}
                    {user.role === 'restaurant_owner' && (
                      <Link to="/restaurant" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiGrid size={15} /> My Dashboard
                      </Link>
                    )}
                    {user.role === 'rider' && (
                      <Link to="/rider" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiGrid size={15} /> Rider Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiGrid size={15} /> Admin Panel
                      </Link>
                    )}
                    <button className="user-dropdown-item logout" onClick={handleLogout}>
                      <FiLogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
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
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              {link.icon} {link.label}
            </Link>
          ))}
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link to="/orders" className="mobile-nav-link" onClick={() => setMenuOpen(false)}><FiPackage /> Orders</Link>
                  <Link to="/loyalty" className="mobile-nav-link" onClick={() => setMenuOpen(false)}><FiAward /> Loyalty</Link>
                  <Link to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}><FiUser /> Profile</Link>
                </>
              )}
              <button className="mobile-nav-link logout" onClick={handleLogout}><FiLogOut /> Logout</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10, padding: '10px 20px' }}>
              <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
