'use client';

import React from 'react';
import { Loader2, RefreshCcw, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actorName?: string;
  actorEmail?: string;
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);

  const isAdmin = user?.role === 'admin';

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs((response.data || []) as AuditLog[]);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin, loadLogs]);

  if (!isAdmin) {
    return (
      <div className="dash-card" style={{ maxWidth: 720, margin: '2rem auto' }}>
        <p className="fs-4 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin access required</p>
        <p className="text-muted-custom mb-0">You do not have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Audit Logs</h1>
          <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Track the most recent administrative actions and configuration changes.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm d-inline-flex align-items-center gap-2"
          style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600 }}
          onClick={loadLogs}
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="dash-card mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff' }}>
            <History size={18} />
          </div>
          <div>
            <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Tracked actions</p>
            <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Saved from the admin settings and user management endpoints.</p>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100 align-middle">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted-custom">
                    <Loader2 size={18} className="auth-spinner me-2" /> Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted-custom">No audit logs found.</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-muted-custom text-nowrap">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                  <td>
                    <div className="fw-medium text-white">{log.actorName || 'System'}</div>
                    <div className="text-muted-custom" style={{ fontSize: '0.75rem' }}>{log.actorEmail || '-'}</div>
                  </td>
                  <td className="text-white">{log.action}</td>
                  <td className="text-muted-custom">
                    {log.entityType}
                    {log.entityId ? ` #${log.entityId}` : ''}
                  </td>
                  <td className="text-muted-custom text-break" style={{ maxWidth: 420 }}>
                    <pre className="mb-0 text-muted-custom" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {log.details ? JSON.stringify(log.details, null, 2) : '-'}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
