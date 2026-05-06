'use client';

import React from 'react';
import { Loader2, RefreshCcw, Save, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  isActive: number | boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [drafts, setDrafts] = React.useState<Record<number, { role: 'admin' | 'agent'; isActive: boolean }>>({});

  const isAdmin = user?.role === 'admin';

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      const rows = (response.data || []) as AdminUser[];
      setUsers(rows);
      setDrafts(
        Object.fromEntries(
          rows.map((row) => [row.id, { role: row.role, isActive: Boolean(row.isActive) }])
        )
      );
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const handleSave = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    try {
      await api.patch(`/admin/users/${id}`, {
        role: draft.role,
        isActive: draft.isActive ? 1 : 0,
      });
      toast.success('User updated successfully.');
      await loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error('Could not update user.');
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="dash-card" style={{ maxWidth: 720, margin: '2rem auto' }}>
        <p className="fs-4 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin access required</p>
        <p className="text-muted-custom mb-0">You do not have permission to manage users.</p>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((row) => Boolean(row.isActive)).length;
  const adminUsers = users.filter((row) => row.role === 'admin').length;

  return (
    <div className="container-fluid px-0">
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin Users</h1>
          <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Manage agent and admin access for the whole platform.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm d-inline-flex align-items-center gap-2"
          style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600 }}
          onClick={loadUsers}
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-sm-4">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff' }}>
                <Users size={18} />
              </div>
              <div>
                <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{totalUsers}</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Total users</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{activeUsers}</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Active accounts</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                <ShieldOff size={18} />
              </div>
              <div>
                <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{adminUsers}</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Admin accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100 align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted-custom">
                    <Loader2 size={18} className="auth-spinner me-2" /> Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted-custom">No users found.</td>
                </tr>
              ) : users.map((row) => {
                const draft = drafts[row.id] || { role: row.role, isActive: Boolean(row.isActive) };
                return (
                  <tr key={row.id}>
                    <td className="fw-medium text-white">{row.name}</td>
                    <td className="text-muted-custom">{row.email}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={draft.role}
                        onChange={(e) => setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, role: e.target.value as 'admin' | 'agent' },
                        }))}
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${draft.isActive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}
                        onClick={() => setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, isActive: !draft.isActive },
                        }))}
                      >
                        {draft.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="text-muted-custom text-nowrap">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm d-inline-flex align-items-center gap-2"
                        style={{ background: '#4F46E5', color: '#fff', fontWeight: 600 }}
                        disabled={savingId === row.id}
                        onClick={() => handleSave(row.id)}
                      >
                        {savingId === row.id ? <Loader2 size={14} className="auth-spinner" /> : <Save size={14} />}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
