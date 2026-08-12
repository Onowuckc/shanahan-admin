import { useState, useEffect } from 'react';
import api from '../api/client';
import { StudentsIcon, FileIcon } from '../components/Icons';

interface BiodataRequest {
  id: string;
  studentId: string;
  reason: string;
  documentUrl?: string;
  requestedData: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  student: {
    matricNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    user?: { email: string; username: string };
    department?: { name: string; code: string };
    program?: { name: string };
  };
}

export default function BiodataRequestsPage() {
  const [requests, setRequests] = useState<BiodataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedReq, setSelectedReq] = useState<BiodataRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/admin/biodata-requests' : `/admin/biodata-requests?status=${statusFilter}`;
      const res = await api.get(url);
      setRequests(res.data.requests || []);
    } catch (err: any) {
      console.error('Failed to fetch biodata requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/biodata-requests/${id}/approve`, { adminNote });
      setToast({ type: 'success', text: 'Biodata request approved and student profile updated successfully.' });
      setSelectedReq(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.error || 'Failed to approve request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/biodata-requests/${id}/reject`, { adminNote });
      setToast({ type: 'success', text: 'Biodata request rejected.' });
      setSelectedReq(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.error || 'Failed to reject request.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>Student Biodata Change Requests</h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Review official applications from students requesting modifications to their verified biodata.
          </p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: 13, padding: '6px 14px' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: 14,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: toast.type === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
        }}>
          {toast.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No {statusFilter.toLowerCase()} biodata requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map((req) => {
            const requested = req.requestedData || {};
            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: 20,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StudentsIcon size={16} color="var(--primary-200)" />
                      {req.student.firstName} {req.student.lastName}
                      <span style={{ fontSize: 13, color: 'var(--primary-200)', fontWeight: 600 }}>({req.student.matricNumber})</span>
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Department: {req.student.department?.name || 'N/A'} | Email: {req.student.user?.email}
                    </div>
                  </div>

                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: req.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : req.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                    color: req.status === 'APPROVED' ? '#22c55e' : req.status === 'REJECTED' ? '#ef4444' : '#eab308'
                  }}>
                    {req.status}
                  </span>
                </div>

                {/* Proposed changes comparison grid */}
                <div style={{ background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Requested Field Changes:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {Object.entries(requested).map(([key, val]) => {
                      const currentVal = (req.student as any)[key] ?? 'N/A';
                      return (
                        <div key={key} style={{ fontSize: 13 }}>
                          <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)', fontWeight: 600 }}>{key}: </span>
                          <span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: 6 }}>{String(currentVal)}</span>
                          <span style={{ color: '#22c55e', fontWeight: 700 }}>&rarr; {String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason & Document link */}
                <div style={{ fontSize: 13 }}>
                  <strong>Reason:</strong> {req.reason}
                </div>

                {req.documentUrl && (
                  <div style={{ fontSize: 13 }}>
                    <strong>Supporting Document: </strong>
                    <a href={req.documentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-200)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <FileIcon size={14} color="var(--primary-200)" />
                      <span>View Uploaded Document / Affidavit</span>
                    </a>
                  </div>
                )}

                {/* Action buttons if PENDING */}
                {req.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 12, borderTop: '1px dashed var(--border-default)' }}>
                    <button
                      onClick={() => { setSelectedReq(req); setAdminNote(''); }}
                      className="btn btn-primary"
                      style={{ fontSize: 13 }}
                    >
                      Review & Approve / Reject
                    </button>
                  </div>
                )}

                {req.adminNote && req.status !== 'PENDING' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                    Admin Note: {req.adminNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            padding: 24,
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 500,
            border: '1px solid var(--border-default)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Review Request</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Student: <strong>{selectedReq.student.firstName} {selectedReq.student.lastName}</strong> ({selectedReq.student.matricNumber})
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Admin Note / Comments</label>
              <textarea
                className="input"
                rows={3}
                style={{ width: '100%' }}
                placeholder="Add comments or reason for approval/rejection..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedReq(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReject(selectedReq.id)}
                disabled={actionLoading}
              >
                Reject Request
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleApprove(selectedReq.id)}
                disabled={actionLoading}
              >
                Approve & Update Biodata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
