import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminOrders, verifyPayment, rejectPayment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut, FiDollarSign,
         FiCheckCircle, FiXCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

const STATUS_COLORS = {
  payment_pending:  'badge-yellow',
  payment_rejected: 'badge-red',
  pending:          'badge-yellow',
  confirmed:        'badge-blue',
  preparing:        'badge-blue',
  ready_for_pickup: 'badge-green',
  picked_up:        'badge-green',
  on_the_way:       'badge-blue',
  delivered:        'badge-green',
  cancelled:        'badge-red',
};

export default function AdminOrders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null); // order being rejected
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await getAdminOrders(params);
      setOrders(res.data.orders || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleVerify = async (orderId) => {
    setActionLoading(orderId + '_verify');
    try {
      await verifyPayment(orderId);
      toast.success('✅ Payment verified! Order is now active.');
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to verify payment');
    } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id + '_reject');
    try {
      await rejectPayment(rejectModal._id, rejectReason || 'Invalid or unverified transaction ID');
      toast.success('Payment rejected. Customer has been notified.');
      setRejectModal(null);
      setRejectReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject payment');
    } finally { setActionLoading(null); }
  };

  const pendingPayments = orders.filter(o => o.status === 'payment_pending');

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">RMSR Admin</div></div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin"            className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid />Restaurants</Link>
          <Link to="/admin/users"       className="sidebar-link"><FiUsers />Users</Link>
          <Link to="/admin/orders"      className="sidebar-link active"><FiPackage />Orders</Link>
          <Link to="/admin/earnings"    className="sidebar-link"><FiDollarSign />Earnings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}>
          <FiLogOut />Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">All Orders</h1>
          
        </div>

        <div className="dashboard-content">

          {/* ── PAYMENT VERIFICATION ALERT SECTION ── */}
          {pendingPayments.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
              border: '2px solid #f59e0b',
              borderRadius: 14, padding: '18px 22px', marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <FiAlertCircle size={20} color="#d97706" />
                <span style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>
                  {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} waiting for your verification
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingPayments.map(o => (
                  <div key={o._id} style={{
                    background: '#fff', borderRadius: 10, padding: '14px 18px',
                    border: '1px solid #fde68a',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>
                        Order #{o.orderNumber} — {o.customer?.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>
                        {o.restaurant?.name} · ৳{o.total}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        Payment: <strong style={{ textTransform: 'capitalize' }}>{o.paymentMethod}</strong>
                      </div>
                    </div>

                    {/* Transaction ID */}
                    <div style={{
                      background: o.transactionId ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${o.transactionId ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 8, padding: '8px 14px', minWidth: 180
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: 1, color: o.transactionId ? '#166534' : '#991b1b', marginBottom: 3 }}>
                        Transaction ID
                      </div>
                      {o.transactionId ? (
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', letterSpacing: 1 }}>
                          {o.transactionId}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                          ⚠️ Not provided
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleVerify(o._id)}
                        disabled={actionLoading === o._id + '_verify'}
                      >
                        <FiCheckCircle size={14} />
                        {actionLoading === o._id + '_verify' ? 'Verifying...' : 'Verify ✓'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#dc2626', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => { setRejectModal(o); setRejectReason(''); }}
                        disabled={!!actionLoading}
                      >
                        <FiXCircle size={14} />
                        Reject ✗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#92400e' }}>
                💡 Check your bKash/Nagad/Rocket app for <strong>01794558994</strong> to confirm each payment before verifying.
              </div>
            </div>
          )}

          {/* ── FILTER ── */}
          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 220, marginBottom: 20 }}
          >
            <option value="">All Orders</option>
            <option value="payment_pending">⏳ Awaiting Payment Verification</option>
            <option value="payment_rejected">❌ Payment Rejected</option>
            {['pending','confirmed','preparing','ready_for_pickup','picked_up','on_the_way','delivered','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>

          {/* ── TABLE ── */}
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state"><p>No orders found</p></div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>TxnID</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{
                      background: o.status === 'payment_pending' ? '#fffbeb' :
                                  o.status === 'payment_rejected' ? '#fef2f2' : undefined
                    }}>
                      <td><strong>#{o.orderNumber}</strong></td>
                      <td>
                        <div>{o.customer?.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{o.customer?.phone}</div>
                      </td>
                      <td>{o.restaurant?.name}</td>
                      <td><strong>৳{o.total}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{o.paymentMethod?.replace(/_/g,' ')}</td>
                      <td>
                        {o.transactionId ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f0fdf4',
                            color: '#166534', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>
                            {o.transactionId}
                          </span>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}
                          style={{ textTransform: 'capitalize' }}>
                          {o.status === 'payment_pending' ? '⏳ Awaiting Verification' :
                           o.status === 'payment_rejected' ? '❌ Payment Rejected' :
                           o.status?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td>
                        {o.status === 'payment_pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: '#16a34a', fontSize: 11, padding: '5px 10px' }}
                              onClick={() => handleVerify(o._id)}
                              disabled={!!actionLoading}
                            >✓ Verify</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#dc2626', fontSize: 11, padding: '5px 10px' }}
                              onClick={() => { setRejectModal(o); setRejectReason(''); }}
                              disabled={!!actionLoading}
                            >✗ Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: 32, width: 460,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FiXCircle size={22} color="#dc2626" />
              <h3 style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>Reject Payment</h3>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
              Rejecting Order <strong>#{rejectModal.orderNumber}</strong> from <strong>{rejectModal.customer?.name}</strong>.
              The customer will be notified with your reason.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
                Reason for rejection
              </label>
              <select
                className="form-input"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ width: '100%', marginBottom: 8 }}
              >
                <option value="">Select a reason...</option>
                <option value="Invalid transaction ID — not found in our account">Invalid transaction ID — not found in our account</option>
                <option value="Payment amount does not match order total">Payment amount does not match order total</option>
                <option value="Transaction ID already used on another order">Transaction ID already used on another order</option>
                <option value="No payment received for this transaction ID">No payment received for this transaction ID</option>
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="Or type a custom reason..."
                value={rejectReason.startsWith('Invalid') || rejectReason.startsWith('Payment') || rejectReason.startsWith('Transaction') || rejectReason.startsWith('No payment') ? '' : rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626' }}
                onClick={handleReject}
                disabled={!rejectReason || actionLoading === rejectModal._id + '_reject'}
              >
                {actionLoading === rejectModal._id + '_reject' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
