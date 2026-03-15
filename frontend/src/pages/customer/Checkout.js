import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createOrder, initiatePayment } from '../../services/api';
import { FiMapPin, FiCreditCard, FiClock, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'bkash', label: 'bKash', icon: '📱', color: '#e2136e', desc: 'Mobile banking' },
  { id: 'nagad', label: 'Nagad', icon: '💸', color: '#f6921e', desc: 'Mobile banking' },
  { id: 'rocket', label: 'Rocket', icon: '🚀', color: '#8b2fc9', desc: 'Mobile banking' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', color: '#27ae60', desc: 'Pay when delivered' },
];

export default function Checkout() {
  const { cartItems, cartRestaurant, cartTotal, clearCart, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    area: user?.address?.area || '',
    city: user?.address?.city || 'Rangpur',
    district: 'Rangpur'
  });

  const deliveryFee = cartRestaurant?.deliveryFee || 30;
  const loyaltyDiscount = Math.floor(loyaltyPoints / 100) * 10;
  const total = Math.max(0, cartTotal + deliveryFee - loyaltyDiscount);

  const handlePlaceOrder = async () => {
    if (!address.street.trim() || !address.area.trim()) {
      return toast.error('Please fill in your delivery address');
    }
    if (isScheduled && !scheduledTime) {
      return toast.error('Please select a scheduled time');
    }
    if (loyaltyPoints > (user?.loyaltyPoints || 0)) {
      return toast.error('Not enough loyalty points');
    }

    setLoading(true);
    try {
      const orderData = {
        restaurantId: cartRestaurant._id,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          addons: item.addons || []
        })),
        deliveryAddress: address,
        paymentMethod,
        specialInstructions: specialInstructions.trim(),
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : null,
        loyaltyPointsToUse: loyaltyPoints
      };

      const res = await createOrder(orderData);
      const order = res.data.order;

      if (!order || !order._id) {
        toast.error('Order creation failed. Please try again.');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'cash_on_delivery') {
        clearCart();
        toast.success('Order placed successfully! 🎉');
        setLoading(false);
        navigate(`/orders/${order._id}`);
        return;
      }

      // Online payment
      try {
        const payRes = await initiatePayment({ orderId: order._id });
        clearCart();
        setLoading(false);
        if (payRes.data?.gatewayUrl) {
          window.location.href = payRes.data.gatewayUrl;
        } else {
          toast.error('Payment gateway unavailable. Please use Cash on Delivery.');
          navigate(`/orders/${order._id}`);
        }
      } catch (payErr) {
        setLoading(false);
        toast.error('Payment gateway error. Your order was created. Please contact support or use Cash on Delivery next time.');
        clearCart();
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page container">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-left">
          {/* Delivery Address */}
          <div className="checkout-section card">
            <h3 className="section-heading"><FiMapPin /> Delivery Address</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Street / House No. *</label>
                <input className="form-input" placeholder="e.g. House 12, Road 4"
                  value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Area / Thana *</label>
                <input className="form-input" placeholder="e.g. Rangpur Sadar"
                  value={address.area} onChange={e => setAddress({ ...address, area: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Special Instructions (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Any instructions for your order..."
                value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Schedule */}
          <div className="checkout-section card">
            <h3 className="section-heading"><FiClock /> Schedule Order</h3>
            <label className="toggle-label">
              <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} />
              <span className="toggle-switch" />
              Schedule for later
            </label>
            {isScheduled && (
              <div className="form-group mt-2">
                <label className="form-label">Select Date & Time</label>
                <input type="datetime-local" className="form-input" value={scheduledTime}
                  min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                  onChange={e => setScheduledTime(e.target.value)} />
              </div>
            )}
          </div>

          {/* Loyalty */}
          {user?.loyaltyPoints > 0 && (
            <div className="checkout-section card">
              <h3 className="section-heading"><FiTag /> Loyalty Points</h3>
              <p className="loyalty-balance">
                You have <strong>{user.loyaltyPoints} points</strong> — worth ৳{Math.floor(user.loyaltyPoints / 100) * 10}
              </p>
              <div className="form-group">
                <label className="form-label">Points to redeem (100 pts = ৳10)</label>
                <input type="number" className="form-input" min={0} max={user.loyaltyPoints} step={100}
                  value={loyaltyPoints}
                  onChange={e => setLoyaltyPoints(Math.min(Number(e.target.value), user.loyaltyPoints))} />
              </div>
              {loyaltyDiscount > 0 && (
                <p className="loyalty-saving">✅ You save ৳{loyaltyDiscount} with loyalty points!</p>
              )}
            </div>
          )}

          {/* Payment */}
          <div className="checkout-section card">
            <h3 className="section-heading"><FiCreditCard /> Payment Method</h3>
            <div className="payment-methods">
              {PAYMENT_METHODS.map(method => (
                <button key={method.id}
                  className={`payment-option ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{ '--method-color': method.color }}
                >
                  <span className="payment-icon">{method.icon}</span>
                  <div>
                    <div className="payment-label">{method.label}</div>
                    <div className="payment-desc">{method.desc}</div>
                  </div>
                  <div className={`payment-radio ${paymentMethod === method.id ? 'selected' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="checkout-right">
          <div className="order-summary-card card">
            <h3>Order Summary</h3>
            <div className="summary-restaurant">{cartRestaurant?.name}</div>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.menuItemId} className="summary-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>৳{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-row"><span>Subtotal</span><span>৳{cartTotal.toFixed(0)}</span></div>
            <div className="summary-row"><span>Delivery fee</span><span>৳{deliveryFee}</span></div>
            {loyaltyDiscount > 0 && (
              <div className="summary-row discount"><span>Loyalty discount</span><span>-৳{loyaltyDiscount}</span></div>
            )}
            <div className="summary-divider" />
            <div className="summary-row total"><span>Total</span><span>৳{total.toFixed(0)}</span></div>
            <div className="loyalty-earn-note">
              🏆 You'll earn {Math.floor(total / 10)} loyalty points for this order
            </div>
            <button className="btn btn-primary w-full btn-lg" onClick={handlePlaceOrder}
              disabled={loading} style={{ marginTop: 16 }}>
              {loading ? 'Placing order...' :
                paymentMethod === 'cash_on_delivery'
                  ? `Place Order — ৳${total.toFixed(0)}`
                  : `Pay ৳${total.toFixed(0)} via ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
