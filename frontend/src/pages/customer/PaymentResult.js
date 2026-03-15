import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PaymentResult() {
  const location = useLocation();
  const isSuccess = location.pathname.includes('success');
  const isFail = location.pathname.includes('fail');
  const isCancel = location.pathname.includes('cancel');

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>
          {isSuccess ? '🎉' : isFail ? '❌' : '⚠️'}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          {isSuccess ? 'Payment Successful!' : isFail ? 'Payment Failed' : 'Payment Cancelled'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          {isSuccess ? 'Your order is being prepared.' : isFail ? 'Your payment could not be processed.' : 'You cancelled the payment.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-primary">My Orders</Link>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
