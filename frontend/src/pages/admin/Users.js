import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminUsers, toggleUserStatus, adminDeleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut, FiTrash2, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

export default function AdminUsers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      setUsers(res.data.users);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      toast.success('User status updated');
      fetchUsers();
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteUser(deleteTarget._id);
      toast.success(`${deleteTarget.name}'s account deleted`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (_) {}
    finally { setDeleting(false); }
  };

  const getRoleBadge = (role) => {
    const colors = {
      customer: 'badge-blue',
      restaurant_owner: 'badge-yellow',
      rider: 'badge-green',
      admin: 'badge-red'
    };
    return colors[role] || 'badge-gray';
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="sidebar-rmsr-home">RMSR Home</Link>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <div><div className="sidebar-brand">RMSR Admin</div></div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid />Restaurants</Link>
          <Link to="/admin/users" className="sidebar-link active"><FiUsers />Users</Link>
          <Link to="/admin/orders" className="sidebar-link"><FiPackage />Orders</Link>
          <Link to="/admin/earnings" className="sidebar-link"><FiDollarSign />Earnings</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}>
          <FiLogOut />Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Users</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="dashboard-content">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              className="form-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              style={{ maxWidth: 300 }}
            />
            <select
              className="form-input"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ maxWidth: 180 }}
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="restaurant_owner">Restaurant Owner</option>
              <option value="rider">Rider</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={fetchUsers}>Search</button>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state"><p>No users found</p></div>
          ) : (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{u.totalOrders || 0}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {u.role !== 'admin' && (
                            <button
                              className={`btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-primary'}`}
                              onClick={() => handleToggle(u._id)}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <FiTrash2 size={13} /> Delete
                            </button>
                          )}
                          {u.role === 'admin' && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Admin — protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete Account?</h3>
            <p>
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>'s account?
              <br /><br />
              Role: <strong>{deleteTarget.role.replace('_', ' ')}</strong><br />
              Email: <strong>{deleteTarget.email}</strong>
              <br /><br />
              This action <strong>cannot be undone</strong>.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
