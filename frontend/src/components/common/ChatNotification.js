import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function ChatNotification({ activeOrderIds = [], onNewMessage }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const joinedRef = useRef(new Set());

  useEffect(() => {
    if (!user || activeOrderIds.length === 0) return;

    // Reuse existing socket if already connected
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });
    }

    const socket = socketRef.current;

    const joinRooms = () => {
      activeOrderIds.forEach(id => {
        if (!joinedRef.current.has(id)) {
          socket.emit('join_chat', id);
          joinedRef.current.add(id);
        }
      });
    };

    // Join immediately if already connected, else wait for connect
    if (socket.connected) {
      joinRooms();
    } else {
      socket.on('connect', joinRooms);
    }

    socket.on('reconnect', joinRooms);

    const handleMessage = (msg) => {
      if (!msg || !msg.sender) return;
      // Don't notify for own messages
      if (String(msg.sender._id) === String(user._id)) return;
      // Only handle messages for our active orders
      const orderId = msg.order?.toString?.() || msg.order;
      if (!activeOrderIds.map(String).includes(String(orderId))) return;

      const senderName = msg.sender?.name || 'Someone';
      const preview = msg.message?.length > 50
        ? msg.message.substring(0, 50) + '...'
        : msg.message || '';

      // Sound beep
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch (_) {}

      // Toast popup — always shown, no delay
      toast.custom((t) => (
        <div
          onClick={() => { toast.dismiss(t.id); if (onNewMessage) onNewMessage(msg); }}
          style={{
            background: '#1a1a2e', color: '#fff',
            padding: '14px 18px', borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            maxWidth: 340, cursor: 'pointer',
            borderLeft: '4px solid #c0392b',
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateX(0)' : 'translateX(100px)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ fontSize: 26, flexShrink: 0 }}>💬</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              New message from <span style={{ color: '#f39c12' }}>{senderName}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {preview}
            </div>
            <div style={{ fontSize: 11, color: '#e74c3c', marginTop: 6, fontWeight: 600 }}>
              Tap to open chat →
            </div>
          </div>
        </div>
      ), { duration: 7000, position: 'top-right', id: `chat-msg-${msg._id || Date.now()}` });

      if (onNewMessage) onNewMessage(msg);
    };

    socket.on('new_message', handleMessage);

    return () => {
      socket.off('connect', joinRooms);
      socket.off('reconnect', joinRooms);
      socket.off('new_message', handleMessage);
    };
  }, [activeOrderIds.join(','), user?._id]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        joinedRef.current.clear();
      }
    };
  }, []);

  return null;
}
