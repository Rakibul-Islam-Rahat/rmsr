import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    fetchMessages();
    setupSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSocket = () => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_chat', orderId));
    socket.on('new_message', (msg) => {
      setMessages(prev => {
        // avoid duplicates
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });
    socket.on('reconnect', () => socket.emit('join_chat', orderId));
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await getChatMessages(orderId);
      setMessages(res.data.messages || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');
    try {
      await sendChatMessage({ orderId, message: text });
    } catch (_) {
      setNewMessage(text); // restore on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          <FiMessageSquare size={16} />
          <span>Chat — Order #{orderNumber}</span>
        </div>
        {onClose && (
          <button className="chat-panel-close" onClick={onClose} title="Close chat">
            <FiX size={18} />
          </button>
        )}
      </div>

      <div className="chat-panel-messages">
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
            <div key={msg._id || i} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <div className="chat-sender-name">
                  {msg.sender?.name}
                  {msg.senderRole && (
                    <span className="sender-role"> ({msg.senderRole.replace('_', ' ')})</span>
                  )}
                </div>
              )}
              <div className="bubble-text">{msg.message}</div>
              <div className="bubble-time">{formatTime(msg.createdAt)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
