import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getChatMessages, sendChatMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { FiSend, FiMessageSquare, FiX } from 'react-icons/fi';
import './ChatPanel.css';

export default function ChatPanel({ orderId, orderNumber, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const containerRef = useRef(null);   // scroll container
  const inputRef = useRef(null);
  // seenIds: _ids we've already added — prevents duplicates from socket echo
  const seenIdsRef = useRef(new Set());
  // pendingTexts: texts being sent by ME — socket echo of own msg is skipped
  // keyed by tempId, value is the message text
  const pendingRef = useRef(new Map());

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const c = containerRef.current;
      if (c) c.scrollTop = c.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (!orderId) return;
    seenIdsRef.current.clear();
    pendingRef.current.clear();
    fetchMessages();
    setupSocket();
    return () => {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [orderId]);

  useEffect(() => { scrollBottom(); }, [messages, scrollBottom]);

  const setupSocket = () => {
    const s = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'], reconnection: true,
    });
    socketRef.current = s;

    const join = () => s.emit('join_chat', orderId);
    if (s.connected) join(); else s.on('connect', join);
    s.on('reconnect', join);

    s.on('new_message', (msg) => {
      const msgId = String(msg?._id || '');
      // 1. Skip if already seen by _id
      if (msgId && seenIdsRef.current.has(msgId)) return;

      // 2. If sender is ME — check pending. This handles the race condition where
      //    socket fires BEFORE the API response updates seenIds with the real _id
      const isFromMe = String(msg.sender?._id) === String(user?._id);
      if (isFromMe) {
        // Find a pending send with matching text and replace the optimistic
        for (const [tempId, text] of pendingRef.current.entries()) {
          if (text === msg.message) {
            // Mark real id as seen, remove pending entry
            if (msgId) seenIdsRef.current.add(msgId);
            pendingRef.current.delete(tempId);
            // Replace the optimistic bubble with the real confirmed message
            setMessages(prev => prev.map(m => m._id === tempId ? msg : m));
            return;
          }
        }
        // No matching pending — skip to avoid duplicate
        if (msgId) seenIdsRef.current.add(msgId);
        return;
      }

      // 3. Message from someone else — add normally
      if (msgId) seenIdsRef.current.add(msgId);
      setMessages(prev => [...prev, msg]);
    });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await getChatMessages(orderId);
      const msgs = res.data.messages || [];
      msgs.forEach(m => { if (m._id) seenIdsRef.current.add(m._id); });
      setMessages(msgs);
    } catch (_) {}
    finally {
      setLoading(false);
      setTimeout(() => { scrollBottom(); inputRef.current?.focus(); }, 50);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimistic = {
      _id: tempId, message: text,
      sender: { _id: user?._id, name: user?.name },
      senderRole: user?.role,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    // Register in pending so socket echo of this text is intercepted
    pendingRef.current.set(tempId, text);
    seenIdsRef.current.add(tempId);
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await sendChatMessage({ orderId, message: text });
      const real = res.data.message;
      if (real?._id) seenIdsRef.current.add(real._id);
      // Remove from pending (socket might not have fired yet)
      pendingRef.current.delete(tempId);
      // Replace optimistic with confirmed real message
      setMessages(prev => prev.map(m => m._id === tempId ? real : m));
    } catch (_) {
      pendingRef.current.delete(tempId);
      seenIdsRef.current.delete(tempId);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          <FiMessageSquare size={16} />
          <span>Chat — Order #{orderNumber}</span>
        </div>
        {onClose && (
          <button className="chat-panel-close" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        )}
      </div>

      <div className="chat-panel-messages" ref={containerRef}>
        {loading && <div className="chat-status-msg">Loading messages...</div>}
        {!loading && messages.length === 0 && (
          <div className="chat-status-msg">
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = String(msg.sender?._id) === String(user?._id);
          return (
            <div key={msg._id || i} className={`chat-bubble ${isMine ? 'mine' : 'theirs'} ${msg._optimistic ? 'optimistic' : ''}`}>
              {!isMine && (
                <div className="chat-sender-name">
                  {msg.sender?.name}
                  {msg.senderRole && <span className="sender-role"> ({msg.senderRole.replace('_', ' ')})</span>}
                </div>
              )}
              <div className="bubble-text">{msg.message}</div>
              <div className="bubble-time">{msg._optimistic ? '···' : fmt(msg.createdAt)}</div>
            </div>
          );
        })}
      </div>

      <form className="chat-panel-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder="Type a message... (Enter to send)"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          maxLength={500}
        />
        <button
          type="submit"
          className="btn btn-primary send-btn"
          disabled={sending || !newMessage.trim()}
        >
          <FiSend size={15} />
        </button>
      </form>
    </div>
  );
}
