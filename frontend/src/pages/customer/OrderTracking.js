import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getOrderById, getChatMessages, sendChatMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiSend, FiMapPin, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LiveMap from '../../components/customer/LiveMap';
import ChatNotification from '../../components/common/ChatNotification';
import './OrderTracking.css';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered'];
const STATUS_ICONS = {
  pending: '🕐', confirmed: '✅', preparing: '👨‍🍳',
  picked_up: '🏍️', on_the_way: '🚀', delivered: '🎉', cancelled: '❌'
};
const STATUS_LABELS = {
  pending: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing',
  picked_up: 'Picked Up', on_the_way: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled'
};

export default function OrderTracking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracking');
  const [riderLocation, setRiderLocation] = useState(null);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const paymentResult = searchParams.get('payment');

  useEffect(() => {
    if (paymentResult === 'success') toast.success('Payment successful! 🎉');
    if (paymentResult === 'failed') toast.error('Payment failed. Please try again.');
    if (paymentResult === 'cancelled') toast.error('Payment was cancelled.');
    fetchOrder();
    fetchMessages();
    setupSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSocket = () => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_order', id);
      socket.emit('join_chat', id);
    });

    socket.on('order_status_update', (data) => {
      if (String(data.orderId) === String(id)) {
        fetchOrder();
        toast.success('Order status updated!');
      }
    });

    socket.on('rider_location', (data) => {
      if (String(data.orderId) === String(id)) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
      }
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('reconnect', () => {
      socket.emit('join_order', id);
      socket.emit('join_chat', id);
    });
  };

  const fetchOrder = async () => {
    try {
      const res = await getOrderById(id);
      setOrder(res.data.order);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    try {
      const res = await getChatMessages(id);
      setMessages(res.data.messages || []);
    } catch (_) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');
    try {
      await sendChatMessage({ orderId: id, message: text });
    } catch (_) {
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleNewChatMessage = () => {
    setActiveTab('chat');
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!order) return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <h3>Order not found</h3>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const showMap = !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="tracking-page container">
      <ChatNotification
        activeOrderIds={[id]}
        onNewMessage={handleNewChatMessage}
      />

      <div className="tracking-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Order #{order.orderNumber}</h1>
          <p className="tracking-restaurant">{order.restaurant?.name}</p>
        </div>
        <div className={`badge badge-lg ${
          order.status === 'delivered' ? 'badge-green' :
          order.status === 'cancelled' ? 'badge-red' : 'badge-blue'
        }`}>
          {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status] || order.status}
        </div>
      </div>

      <div className="tracking-tabs">
        {['tracking', 'details', 'chat'].map(t => (
          <button
            key={t}
            className={`detail-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'chat' && messages.length > 0 && ` (${messages.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'tracking' && (
        <div className="tracking-content">
          {showMap && <LiveMap order={order} riderLocation={riderLocation} />}

          {order.status !== 'cancelled' && (
            <div className="status-stepper card">
              <h3>Order Progress</h3>
              <div className="stepper">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className={`step ${i <= currentStepIndex ? 'done' : ''} ${i === currentStepIndex ? 'current' : ''}`}>
                    <div className="step-icon">{i <= currentStepIndex ? STATUS_ICONS[step] : '○'}</div>
                    <div className="step-label">{STATUS_LABELS[step]}</div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`step-connector ${i < currentStepIndex ? 'done' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <h3>Order Cancelled</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{order.cancelReason || 'This order was cancelled.'}</p>
            </div>
          )}

          {order.rider && (
            <div className="rider-card card">
              <h3>Your Rider</h3>
              <div className="rider-info">
                <div className="rider-avatar">{order.rider.name?.charAt(0)?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div className="rider-name">{order.rider.name}</div>
                  <div className="rider-phone">{order.rider.phone}</div>
                </div>
                {order.rider.phone && (
                  <a href={`tel:${order.rider.phone}`} className="btn btn-outline btn-sm call-btn">
                    <FiPhone size={13} /> Call
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="delivery-card card">
            <h3><FiMapPin /> Delivery Address</h3>
            <p>{order.deliveryAddress?.street}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city}</p>
          </div>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="eta-card card">
              <div className="eta-icon">⏱️</div>
              <div>
                <div className="eta-label">Estimated Delivery</div>
                <div className="eta-value">
                  {order.restaurant?.deliveryTime?.min}–{order.restaurant?.deliveryTime?.max} minutes
                </div>
              </div>
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="card" style={{ padding: 28, textAlign: 'center', borderTop: '4px solid var(--accent)' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h3 style={{ color: 'var(--accent)' }}>Order Delivered!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                You earned <strong>{order.loyaltyPointsEarned} loyalty points</strong> for this order!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="order-details-tab">
          <div className="order-items-card card">
            <h3>Items Ordered</h3>
            {order.items?.map((item, i) => (
              <div key={i} className="order-detail-item">
                <span className="item-qty">{item.quantity}×</span>
                <span className="item-name">{item.name}</span>
                <span className="item-price">৳{item.subtotal}</span>
              </div>
            ))}
            <div className="order-detail-divider" />
            <div className="order-detail-item"><span>Subtotal</span><span /><span>৳{order.subtotal}</span></div>
            <div className="order-detail-item"><span>Delivery fee</span><span /><span>৳{order.deliveryFee}</span></div>
            {order.discount > 0 && (
              <div className="order-detail-item" style={{ color: 'var(--accent)' }}>
                <span>Loyalty discount</span><span /><span>-৳{order.discount}</span>
              </div>
            )}
            <div className="order-detail-divider" />
            <div className="order-detail-item total"><span>Total</span><span /><span>৳{order.total}</span></div>
            <div className="payment-info">
              <span>Payment: {order.paymentMethod?.replace(/_/g, ' ').toUpperCase()}</span>
              <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                {order.paymentStatus}
              </span>
            </div>
            {order.specialInstructions && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', borderLeft: '3px solid var(--secondary)' }}>
                <strong>Special instructions:</strong> {order.specialInstructions}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-tab">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                No messages yet. You can chat with the restaurant or rider here.
              </div>
            )}
            {messages.map((msg, i) => {
              const isMine = String(msg.sender?._id) === String(user?._id);
              return (
                <div key={msg._id || i} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <div className="chat-sender">{msg.sender?.name}</div>}
                  <div className="bubble-text">{msg.message}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="form-input"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary send-btn" disabled={sending || !newMessage.trim()}>
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
