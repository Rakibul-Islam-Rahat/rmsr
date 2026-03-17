import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/api';
import { FiMapPin, FiCreditCard, FiClock, FiTag, FiCheckCircle, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CustomerSidebar from './CustomerSidebar';
import './CustomerDashboard.css';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'bkash', label: 'bKash', icon: '📱', color: '#e2136e', desc: 'Mobile banking' },
  { id: 'nagad', label: 'Nagad', icon: '💸', color: '#f6921e', desc: 'Mobile banking' },
  { id: 'rocket', label: 'Rocket', icon: '🚀', color: '#8b2fc9', desc: 'Mobile banking' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵', color: '#27ae60', desc: 'Pay when delivered' },
];

const PAYMENT_NUMBER = '01794558994'; // All mobile banking payments go to this number

export default function Checkout() {
  const { cartItems, cartRestaurant, cartTotal, clearCart, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    area: user?.address?.area || '',
    city: user?.address?.city || 'Rangpur',
    district: 'Rangpur'
  });

  const deliveryFee = cartRestaurant?.deliveryFee || 30;
  const loyaltyDiscount = Math.min(
    Math.floor(loyaltyPoints / 100) * 10,
    cartTotal  // discount cannot exceed subtotal — delivery fee always charged
  );
  const total = Math.max(0, cartTotal + deliveryFee - loyaltyDiscount);

  const isOnlinePayment = ['bkash', 'nagad', 'rocket'].includes(paymentMethod);

  const copyNumber = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    toast.success('Number copied!');
  };

  const handlePlaceOrder = async () => {
    if (!address.street.trim() || !address.area.trim()) {
      return toast.error('Please fill in your delivery address');
    }
    if (isScheduled && !scheduledTime) {
      return toast.error('Please select a scheduled time');
    }
    if (isOnlinePayment && !transactionId.trim()) {
      return toast.error(`Please enter your ${paymentMethod} Transaction ID after sending payment`);
    }
    // Basic format validation — TxnIDs are alphanumeric, min 6 chars
    if (isOnlinePayment && transactionId.trim()) {
      const txn = transactionId.trim();
      if (txn.length < 6) {
        return toast.error('Transaction ID is too short. Please check and enter the correct ID from your payment app.');
      }
      if (!/^[a-zA-Z0-9]+$/.test(txn)) {
        return toast.error('Transaction ID should only contain letters and numbers. Please copy it from your payment app.');
      }
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
        loyaltyPointsToUse: loyaltyPoints,
        transactionId: transactionId.trim() || undefined
      };

      const res = await createOrder(orderData);
      const order = res.data.order;

      if (!order || !order._id) {
        toast.error('Order creation failed. Please try again.');
        setLoading(false);
        return;
      }

      clearCart();
      setLoading(false);

      if (isOnlinePayment) {
        toast.success('Order placed! We will verify your payment shortly. 🎉');
      } else {
        toast.success('Order placed successfully! 🎉');
      }

      navigate(`/orders/${order._id}`);
    } catch (_) {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="customer-dashboard">
      <CustomerSidebar />
      <div className="customer-main">
        <div className="customer-topbar"><h1 className="customer-page-title">Checkout</h1></div>
        <div className="customer-content">
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
              <textarea className="form-input" rows={3} placeholder="Any instructions..."
                value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                style={{ resize: 'vertical' }} />
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

          {/* Payment Method */}
          <div className="checkout-section card">
            <h3 className="section-heading"><FiCreditCard /> Payment Method</h3>
            <div className="payment-methods">
              {PAYMENT_METHODS.map(method => (
                <button key={method.id}
                  className={`payment-option ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod(method.id); setTransactionId(''); }}
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

            {/* Manual payment instructions */}
            {isOnlinePayment && (
              <div style={{
                background: '#f0fff4',
                border: '1px solid #9ae6b4',
                borderLeft: '4px solid #27ae60',
                borderRadius: 10,
                padding: '18px 20px',
                marginTop: 16
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#276749', marginBottom: 10 }}>
                  📱 {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment Instructions
                </div>

                <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
                  Send <strong style={{ color: '#c0392b', fontSize: 16 }}>৳{total.toFixed(0)}</strong> to this {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} number:
                </p>

                {/* Payment number with copy button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: '2px solid #27ae60',
                  borderRadius: 8,
                  padding: '10px 16px',
                  marginBottom: 12
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#276749', letterSpacing: 2, flex: 1 }}>
                    {PAYMENT_NUMBER}
                  </span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FiCopy size={12} /> Copy
                  </button>
                </div>

                <p style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.6 }}>
                  ✅ Send as <strong>Send Money</strong><br />
                  ✅ Use reference: <strong>RMSR-{user?.name?.split(' ')[0]?.toUpperCase()}</strong><br />
                  ✅ After sending, enter your Transaction ID below
                </p>

                {/* Transaction ID input */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#276749', fontWeight: 700 }}>
                    Transaction ID (TxnID) *
                  </label>
                  <input
                    className="form-input"
                    placeholder={`Enter your ${paymentMethod} Transaction ID`}
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    style={{ borderColor: transactionId ? '#27ae60' : undefined }}
                  />
                  {transactionId && (
                    <p style={{ fontSize: 12, color: '#27ae60', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCheckCircle size={12} /> Transaction ID saved
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
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

            {isOnlinePayment && !transactionId && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#f57f17', fontWeight: 600 }}>
                ⚠️ Please send payment and enter Transaction ID above before placing order
              </div>
            )}

            <button
              className="btn btn-primary w-full btn-lg"
              onClick={handlePlaceOrder}
              disabled={loading || (isOnlinePayment && !transactionId.trim())}
              style={{ marginTop: 16 }}
            >
              {loading ? 'Placing order...' :
                paymentMethod === 'cash_on_delivery'
                  ? `Place Order — ৳${total.toFixed(0)}`
                  : transactionId
                    ? `Confirm Order — ৳${total.toFixed(0)}`
                    : `Enter Transaction ID First`
              }
            </button>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
