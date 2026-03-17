import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiPackage, FiUser, FiAward, FiShoppingCart,
  FiHome, FiLogOut
} from 'react-icons/fi';
import './CustomerDashboard.css';

export default function CustomerSidebar() {
  const { user, logout, cartCount } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="customer-sidebar">
      {/* Profile strip */}
      <div className="cs-profile">
        <div className="cs-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} />
            : user?.name?.charAt(0)?.toUpperCase()
          }
        </div>
        <div>
          <div className="cs-name">{user?.name?.split(' ')[0] || 'Customer'}</div>
          <div className="cs-pts">🏆 {user?.loyaltyPoints || 0} pts</div>
        </div>
      </div>

      <nav className="cs-nav">
        <div className="cs-section-label">Menu</div>

        <Link to="/" className="cs-link">
          <FiHome size={16} /> Home
        </Link>

        <Link to="/orders" className={`cs-link ${isActive('/orders') ? 'active' : ''}`}>
          <FiPackage size={16} /> My Orders
        </Link>

        <Link to="/cart" className={`cs-link ${isActive('/cart') ? 'active' : ''}`}>
          <FiShoppingCart size={16} /> Cart
          {cartCount > 0 && <span className="cs-badge">{cartCount}</span>}
        </Link>

        <Link to="/loyalty" className={`cs-link ${isActive('/loyalty') ? 'active' : ''}`}>
          <FiAward size={16} /> Loyalty Points
        </Link>

        <div className="cs-section-label">Account</div>

        <Link to="/profile" className={`cs-link ${isActive('/profile') ? 'active' : ''}`}>
          <FiUser size={16} /> My Profile
        </Link>

        <button className="cs-link" onClick={logout} style={{ color: 'var(--primary)' }}>
          <FiLogOut size={16} /> Logout
        </button>
      </nav>
    </aside>
  );
}
