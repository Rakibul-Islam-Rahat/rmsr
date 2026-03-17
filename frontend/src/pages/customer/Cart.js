import toast from 'react-hot-toast';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import CustomerSidebar from './CustomerSidebar';
import './CustomerDashboard.css';
import './Cart.css';

export default function Cart() {
  const { user, cartItems, cartRestaurant, cartTotal, updateCartQuantity, removeFromCart, clearCart } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (user && user.role !== 'customer') {
      const msgs = {
        restaurant_owner: 'Restaurant owners cannot checkout. Please use a customer account.',
        rider: 'Riders cannot checkout. Please use a customer account.',
        admin: 'Admin accounts cannot checkout. Please use a customer account.',
      };
      toast.error(msgs[user.role] || 'This account cannot checkout.');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="customer-dashboard">
        <CustomerSidebar />
        <div className="customer-main">
          <div className="customer-topbar">
            <h1 className="customer-page-title">Your Cart</h1>
          </div>
          <div className="customer-content">
            <div className="cart-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
              <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Add items from a restaurant to get started</p>
              <Link to="/restaurants" className="btn btn-primary btn-lg">Browse Restaurants</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <CustomerSidebar />
      <div className="customer-main">
        <div className="customer-topbar">
          <h1 className="customer-page-title">Your Cart</h1>
        </div>
        <div className="customer-content">
          <div className="cart-layout">
            <div className="cart-items">
              {cartRestaurant && (
                <div className="cart-restaurant-info card">
                  <div className="cart-rest-header">
                    <h3>Ordering from: {cartRestaurant.name}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear cart</button>
                  </div>
                </div>
              )}
              {cartItems.map(item => (
                <div key={item.menuItemId} className="cart-item card">
                  <div className="cart-item-image">
                    {item.image ? <img src={item.image} alt={item.name} /> : <span>🍽️</span>}
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">৳{item.price} each</p>
                  </div>
                  <div className="cart-item-controls">
                    <button className="qty-btn" onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}><FiMinus /></button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}><FiPlus /></button>
                  </div>
                  <div className="cart-item-subtotal">৳{(item.price * item.quantity).toFixed(0)}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.menuItemId)}><FiTrash2 /></button>
                </div>
              ))}
            </div>

            <div className="cart-summary card">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>৳{cartTotal.toFixed(0)}</span></div>
              <div className="summary-row"><span>Delivery fee</span><span>৳{cartRestaurant?.deliveryFee || 30}</span></div>
              <div className="summary-divider" />
              <div className="summary-row total">
                <span>Total</span>
                <span>৳{(cartTotal + (cartRestaurant?.deliveryFee || 30)).toFixed(0)}</span>
              </div>
              {cartRestaurant?.minimumOrder > cartTotal && (
                <p className="min-order-warning">Minimum order ৳{cartRestaurant.minimumOrder} (need ৳{(cartRestaurant.minimumOrder - cartTotal).toFixed(0)} more)</p>
              )}
              {user ? (
                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={handleCheckout}
                  disabled={cartRestaurant?.minimumOrder > cartTotal}
                >
                  Proceed to Checkout
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary w-full btn-lg">Login to Checkout</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
