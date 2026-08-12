import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { DownloadIcon, PaymentsIcon, CheckIcon, ClockIcon, SearchIcon, CrossIcon } from '../components/Icons';

const fmt = (n: number) => n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', sessionId: '' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [detailPayment, setDetailPayment] = useState<any | null>(null);

  useEffect(() => {
    api.get('/admin/sessions').then((r) => setSessions(r.data.data)).catch(() => {});
    api.get('/admin/payments/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.sessionId) params.sessionId = filters.sessionId;
      const { data } = await api.get('/admin/payments', { params });
      setPayments(data.data);
      setMeta(data.meta);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-subtitle">{meta ? `${meta.total.toLocaleString()} payment records` : 'Loading...'}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><DownloadIcon size={14} /><span>Export Excel</span></button>
          <button className="btn btn-primary btn-sm">+ Record Payment</button>
        </div>
      </div>

      {/* Financial Summary */}
      {stats && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Billed', value: fmt(stats.totalDue), icon: <PaymentsIcon size={24} color="#3d65b5" />, color: '#3d65b5' },
            { label: 'Total Collected', value: fmt(stats.totalPaid), icon: <CheckIcon size={24} color="#22c55e" />, color: '#22c55e' },
            { label: 'Outstanding', value: fmt(stats.totalOutstanding), icon: <ClockIcon size={24} color="#f59e0b" />, color: '#f59e0b' },
            { label: 'Total Records', value: stats.totalRecords?.toLocaleString(), icon: <PaymentsIcon size={24} color="#8b5cf6" />, color: '#8b5cf6' },
          ].map((k) => (
            <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as any}>
              <div className="kpi-icon" style={{ color: k.color }}>{k.icon}</div>
              <div className="kpi-value" style={{ fontSize: 24 }}>{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <SearchIcon size={18} color="var(--text-muted)" />
          <input placeholder="Search student/applicant name, matric, app number..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="form-control" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className="form-control" value={filters.sessionId} onChange={(e) => setFilters((f) => ({ ...f, sessionId: e.target.value }))}>
          <option value="">All Sessions</option>
          {sessions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><PaymentsIcon size={48} color="var(--text-muted)" /></div><div className="empty-state-title">No payments found</div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>ID / Matric No.</th>
                <th>Department / Program</th>
                <th>Session</th>
                <th>Semester</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => {
                const outstanding = p.amountDue - p.amountPaid;
                const displayName = p.student 
                  ? `${p.student.firstName} ${p.student.lastName}`
                  : p.applicant 
                    ? `${p.applicant.firstName} ${p.applicant.lastName}` 
                    : 'Unknown User';
                const displayId = p.student ? p.student.matricNumber : p.applicant ? p.applicant.applicationNo : '—';
                const displayDept = p.student ? p.student.department?.name : p.applicant ? p.applicant.program?.name : 'Acceptance Fee';
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setDetailPayment(p)}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{displayName}</div>
                        <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 4, background: p.student ? 'rgba(61,101,181,0.2)' : 'rgba(245,158,11,0.2)', color: p.student ? '#7ca1eb' : '#f7c06d' }}>
                          {p.student ? 'STUDENT' : 'APPLICANT'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--primary-200)' }}>{displayId}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayDept}</td>
                    <td style={{ fontSize: 12 }}>{p.session?.name}</td>
                    <td style={{ fontSize: 12 }}>{p.semester?.name}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amountDue)}</td>
                    <td style={{ color: 'var(--success-500)', fontWeight: 700 }}>{fmt(p.amountPaid)}</td>
                    <td style={{ color: outstanding > 0 ? 'var(--danger-500)' : 'var(--text-muted)', fontWeight: 600 }}>{fmt(outstanding)}</td>
                    <td><span className={`badge badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'PARTIAL' ? 'warning' : 'danger'}`}>{p.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="pagination">
            <span>Page {meta.page} of {meta.totalPages} ({meta.total.toLocaleString()} records)</span>
            <div className="pagination-buttons">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              <button className="page-btn active">{page}</button>
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}>›</button>
              <button className="page-btn" onClick={() => setPage(meta.totalPages)} disabled={page === meta.totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & History Modal */}
      {detailPayment && (
        <div className="modal-overlay" onClick={() => setDetailPayment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Payment Details & Paystack Audit</h3>
              <button className="modal-close" onClick={() => setDetailPayment(null)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Details */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid var(--border-default)', paddingBottom: 4, color: 'var(--primary-200)', fontSize: 14 }}>User Profile</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                  <div>Name: <strong>{detailPayment.student 
                    ? `${detailPayment.student.firstName} ${detailPayment.student.lastName}`
                    : detailPayment.applicant
                      ? `${detailPayment.applicant.firstName} ${detailPayment.applicant.lastName}`
                      : 'N/A'}</strong></div>
                  <div>Account Type: <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: detailPayment.student ? 'rgba(61,101,181,0.2)' : 'rgba(245,158,11,0.2)', color: detailPayment.student ? '#7ca1eb' : '#f7c06d', fontWeight: 600 }}>{detailPayment.student ? 'Student' : 'Applicant'}</span></div>
                  <div>ID / Matric No: <strong style={{ fontFamily: 'monospace' }}>{detailPayment.student 
                    ? detailPayment.student.matricNumber 
                    : detailPayment.applicant 
                      ? detailPayment.applicant.applicationNo 
                      : '—'}</strong></div>
                  <div>Department / Programme: <strong>{detailPayment.student 
                    ? detailPayment.student.department?.name 
                    : detailPayment.applicant?.program?.name || 'Acceptance Fee'}</strong></div>
                </div>
              </div>

              {/* Financial Ledger details */}
              <div>
                <h4 style={{ margin: '8px 0 8px 0', borderBottom: '1px solid var(--border-default)', paddingBottom: 4, color: 'var(--primary-200)', fontSize: 14 }}>Financial Ledger Overview</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                  <div>Session: <strong>{detailPayment.session?.name || '—'} Session</strong></div>
                  <div>Semester: <strong>{detailPayment.semester?.name || '—'} Semester</strong></div>
                  <div>Amount Due: <strong style={{ color: 'var(--text-default)' }}>{fmt(detailPayment.amountDue)}</strong></div>
                  <div>Amount Paid: <strong style={{ color: 'var(--success-500)' }}>{fmt(detailPayment.amountPaid)}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    Outstanding Balance: <strong style={{ color: (detailPayment.amountDue - detailPayment.amountPaid) > 0 ? 'var(--danger-400)' : 'var(--text-muted)' }}>
                      {fmt(detailPayment.amountDue - detailPayment.amountPaid)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              {detailPayment.items && detailPayment.items.length > 0 && (
                <div>
                  <h4 style={{ margin: '8px 0 8px 0', borderBottom: '1px solid var(--border-default)', paddingBottom: 4, color: 'var(--primary-200)', fontSize: 14 }}>Fee Category Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detailPayment.items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border-default)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{item.feeCategory?.name}:</span>
                        <span>Due: <strong>{fmt(item.amountDue)}</strong> | Paid: <strong style={{ color: 'var(--success-500)' }}>{fmt(item.amountPaid)}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction Logs & Channels */}
              <div>
                <h4 style={{ margin: '8px 0 8px 0', borderBottom: '1px solid var(--border-default)', paddingBottom: 4, color: 'var(--primary-200)', fontSize: 14 }}>Transaction Details & Audit</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>Payment Channel: <strong>
                    {detailPayment.paystackRef 
                      ? (detailPayment.paystackRef.startsWith('SU_MOCK_') ? 'Paystack Sandbox Simulation' : 'Paystack online checkout gateway')
                      : detailPayment.txReference 
                        ? 'Paystack transaction checkout initiated'
                        : 'Manual Offline posting (Bursary Office)'
                    }
                  </strong></div>
                  <div>Initialized Reference: <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                    {detailPayment.txReference || 'N/A'}
                  </code></div>
                  <div>Verified Paystack Reference: <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                    {detailPayment.paystackRef || 'N/A'}
                  </code></div>
                  <div>Status: <span className={`badge badge-${detailPayment.status === 'COMPLETED' ? 'success' : detailPayment.status === 'PARTIAL' ? 'warning' : 'danger'}`}>{detailPayment.status}</span></div>
                  <div>Date Logged: <strong>{detailPayment.paymentDate ? new Date(detailPayment.paymentDate).toLocaleString() : 'N/A'}</strong></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailPayment(null)}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
