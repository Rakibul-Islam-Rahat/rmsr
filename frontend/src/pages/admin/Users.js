// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminUsers, toggleUserStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiGrid, FiUsers, FiPackage, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../admin/Dashboard.css';

export default function AdminUsers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      setUsers(res.data.users);
    } catch {}
    finally { setLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      toast.success('User status updated');
      fetchUsers();
    } catch {}
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo"><div className="sidebar-logo-icon">R</div><div><div className="sidebar-brand">RMSR Admin</div></div></div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link"><FiHome />Dashboard</Link>
          <Link to="/admin/restaurants" className="sidebar-link"><FiGrid />Restaurants</Link>
          <Link to="/admin/users" className="sidebar-link active"><FiUsers />Users</Link>
          <Link to="/admin/orders" className="sidebar-link"><FiPackage />Orders</Link>
        </nav>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/'); }}><FiLogOut />Logout</button>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-topbar"><h1 className="dashboard-title">Users</h1></div>
        <div className="dashboard-content">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} style={{ maxWidth: 300 }} />
            <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="restaurant_owner">Restaurant Owner</option>
              <option value="rider">Rider</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={fetchUsers}>Search</button>
          </div>
          {loading ? <div className="page-loader"><div className="spinner" /></div> : (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Orders</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-blue">{u.role.replace('_', ' ')}</span></td>
                      <td>{u.totalOrders || 0}</td>
                      <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td><button className={`btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-primary'}`} onClick={() => handleToggle(u._id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
