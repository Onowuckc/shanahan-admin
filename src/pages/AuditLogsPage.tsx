import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    email: string;
    username: string;
    role: string;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
      };
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entityType = entityTypeFilter;

      const { data } = await api.get('/admin/audit-logs', { params });
      setLogs(data.data || []);
      setMeta(data.meta || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">System Audit Logs</div>
          <div className="page-subtitle">Security events, administrative actions, and data modifications history</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ gap: 12 }}>
        <div className="search-input-wrapper" style={{ minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search action..."
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 180 }}
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Entities</option>
          <option value="USER">USER</option>
          <option value="STUDENT_PROFILE">STUDENT_PROFILE</option>
          <option value="STAFF_PROFILE">STAFF_PROFILE</option>
          <option value="FEE_STRUCTURE">FEE_STRUCTURE</option>
          <option value="COURSE">COURSE</option>
          <option value="PAYMENT">PAYMENT</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔒</div>
            <div className="empty-state-title">No audit logs found</div>
          </div>
        ) : (
          <>
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Actor (Username)</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>({log.user.username})</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.user.role}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-200)' }}>{log.action}</td>
                    <td>
                      {log.entityType ? (
                        <span className="badge badge-neutral">{log.entityType}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-all' }}>{log.details || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{log.ipAddress || 'Unknown'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing page {meta.page} of {meta.totalPages} (Total: {meta.total} entries)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
