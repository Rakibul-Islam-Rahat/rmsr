// src/pages/customer/Cart.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import './Cart.css';

export default function Cart() {
  const { cartItems, cartRestaurant, cartTotal, updateCartQuantity, removeFromCart, clearCart, user } = useAuth();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty container">
        <div className="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add items from a restaurant to get started</p>
        <Link to="/restaurants" className="btn btn-primary btn-lg">Browse Restaurants</Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="page-title">Your Cart</h1>
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
          <div className="summary-row total"><span>Total</span><span>৳{(cartTotal + (cartRestaurant?.deliveryFee || 30)).toFixed(0)}</span></div>
          {cartRestaurant?.minimumOrder > cartTotal && (
            <p className="min-order-warning">Minimum order ৳{cartRestaurant.minimumOrder} (need ৳{(cartRestaurant.minimumOrder - cartTotal).toFixed(0)} more)</p>
          )}
          {user ? (
            <button
              className="btn btn-primary w-full btn-lg"
              onClick={() => navigate('/checkout')}
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
  );
}
