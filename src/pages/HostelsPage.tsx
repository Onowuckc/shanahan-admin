import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Hostel {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  totalCapacity: number;
  allowedLevels: number[];
  description: string | null;
  _count: { allocations: number };
}

interface HostelAllocation {
  id: string;
  sessionId: string;
  session: { name: string };
  hostelId: string;
  hostel: { name: string; gender: string };
  student: { firstName: string; lastName: string; matricNumber: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string | null;
  allocatedAt: string;
}

interface Session {
  id: string;
  name: string;
}

export default function HostelsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'blocks' | 'allocations'>('blocks');
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [loadingHostels, setLoadingHostels] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters for Allocations
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterHostelId, setFilterHostelId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<HostelAllocation | null>(null);

  // Hostel Form State
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [hostelName, setHostelName] = useState('');
  const [hostelGender, setHostelGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [hostelCapacity, setHostelCapacity] = useState('');
  const [allowedLevels, setAllowedLevels] = useState<number[]>([]);
  const [hostelDesc, setHostelDesc] = useState('');

  // Allocation Approval Form State
  const [allocationStatus, setAllocationStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [allocationNote, setAllocationNote] = useState('');

  const canManageHostels = ['SUPER_ADMIN', 'ICT_ADMIN', 'HOSTEL_ADMIN'].includes(user?.role || '');

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchHostels = useCallback(async () => {
    setLoadingHostels(true);
    try {
      const { data } = await api.get('/admin/hostels');
      setHostels(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHostels(false);
    }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setLoadingAllocations(true);
    try {
      const params: any = {};
      if (filterSessionId) params.sessionId = filterSessionId;
      if (filterHostelId) params.hostelId = filterHostelId;
      if (filterStatus) params.status = filterStatus;

      const { data } = await api.get('/admin/hostel-allocations', { params });
      setAllocations(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAllocations(false);
    }
  }, [filterSessionId, filterHostelId, filterStatus]);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/sessions');
      setSessions(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchHostels();
    loadSessions();
  }, [fetchHostels, loadSessions]);

  useEffect(() => {
    if (activeTab === 'allocations') {
      fetchAllocations();
    }
  }, [activeTab, fetchAllocations]);

  const handleOpenHostelCreate = () => {
    setEditingHostel(null);
    setHostelName('');
    setHostelGender('MALE');
    setHostelCapacity('');
    setAllowedLevels([]);
    setHostelDesc('');
    setShowHostelModal(true);
  };

  const handleOpenHostelEdit = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setHostelName(hostel.name);
    setHostelGender(hostel.gender);
    setHostelCapacity(String(hostel.totalCapacity));
    setAllowedLevels(hostel.allowedLevels);
    setHostelDesc(hostel.description || '');
    setShowHostelModal(true);
  };

  const handleSaveHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName || !hostelCapacity) {
      showToast('Name and Capacity are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: hostelName.trim(),
        gender: hostelGender,
        totalCapacity: parseInt(hostelCapacity),
        allowedLevels,
        description: hostelDesc.trim() || null,
      };

      if (editingHostel) {
        await api.put(`/admin/hostels/${editingHostel.id}`, payload);
        showToast('Hostel block updated successfully.');
      } else {
        await api.post('/admin/hostels', payload);
        showToast('Hostel block created successfully.');
      }
      setShowHostelModal(false);
      fetchHostels();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save hostel block.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAllocateModal = (alloc: HostelAllocation) => {
    setSelectedAllocation(alloc);
    setAllocationStatus(alloc.status === 'REJECTED' ? 'REJECTED' : 'APPROVED');
    setAllocationNote(alloc.note || '');
    setShowAllocateModal(true);
  };

  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;

    setSaving(true);
    try {
      await api.put(`/admin/hostel-allocations/${selectedAllocation.id}`, {
        status: allocationStatus,
        note: allocationNote.trim() || null,
      });
      showToast(`Allocation status updated to ${allocationStatus}.`);
      setShowAllocateModal(false);
      fetchAllocations();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update allocation.');
    } finally {
      setSaving(false);
    }
  };

  const handleLevelCheckboxChange = (level: number, checked: boolean) => {
    if (checked) {
      setAllowedLevels([...allowedLevels, level]);
    } else {
      setAllowedLevels(allowedLevels.filter(l => l !== level));
    }
  };


  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Hostels & Allocations</div>
          <div className="page-subtitle">Configure student hostel blocks and process bedding allocation requests</div>
        </div>
        {activeTab === 'blocks' && canManageHostels && (
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" onClick={handleOpenHostelCreate}>+ Create Hostel Block</button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('blocks')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'blocks' ? '2px solid var(--primary-500)' : 'none',
            color: activeTab === 'blocks' ? 'var(--primary-200)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'blocks' ? 700 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          🏨 Hostel Blocks
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'allocations' ? '2px solid var(--primary-500)' : 'none',
            color: activeTab === 'allocations' ? 'var(--primary-200)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'allocations' ? 700 : 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          🛏️ Allocation Requests
        </button>
      </div>

      {activeTab === 'blocks' ? (
        /* Tab 1: Hostel Blocks */
        <div className="table-wrapper">
          {loadingHostels ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Loading hostel blocks...</p>
            </div>
          ) : hostels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏨</div>
              <div className="empty-state-title">No hostels registered</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Block Name</th>
                  <th>Gender Type</th>
                  <th>Capacity Status</th>
                  <th>Target Levels</th>
                  <th>Description</th>
                  {canManageHostels && <th></th>}
                </tr>
              </thead>
              <tbody>
                {hostels.map((h) => {
                  const percent = Math.min(Math.round((h._count.allocations / h.totalCapacity) * 100), 100);
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>
                        <span className={`badge badge-${h.gender === 'MALE' ? 'info' : 'danger'}`}>
                          {h.gender === 'MALE' ? 'Male' : 'Female'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{h._count.allocations} / {h.totalCapacity} beds</div>
                        <div style={{ width: 120, height: 6, background: 'var(--border-default)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? 'var(--danger-500)' : 'var(--primary-500)' }} />
                        </div>
                      </td>
                      <td>
                        {h.allowedLevels.length === 0 ? (
                          <span className="badge badge-neutral">All Levels</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {h.allowedLevels.map(lvl => (
                              <span key={lvl} className="badge badge-info">{lvl}L</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{h.description || 'N/A'}</td>
                      {canManageHostels && (
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleOpenHostelEdit(h)}>
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Tab 2: Hostel Allocations */
        <>
          {/* Filters Bar for allocations */}
          <div className="filters-bar" style={{ gap: 12 }}>
            <select
              className="form-control"
              style={{ width: 180 }}
              value={filterSessionId}
              onChange={(e) => setFilterSessionId(e.target.value)}
            >
              <option value="">All Sessions</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select
              className="form-control"
              style={{ width: 180 }}
              value={filterHostelId}
              onChange={(e) => setFilterHostelId(e.target.value)}
            >
              <option value="">All Hostels</option>
              {hostels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.gender === 'MALE' ? 'M' : 'F'})</option>)}
            </select>

            <select
              className="form-control"
              style={{ width: 150 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="table-wrapper">
            {loadingAllocations ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading requests...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛏️</div>
                <div className="empty-state-title">No allocation requests found</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Matric Number</th>
                    <th>Requested Block</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th>Approval Details</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => (
                    <tr key={alloc.id}>
                      <td style={{ fontWeight: 600 }}>{alloc.student.firstName} {alloc.student.lastName}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>
                          {alloc.student.matricNumber}
                        </span>
                      </td>
                      <td>
                        {alloc.hostel.name}
                        <span className={`badge badge-${alloc.hostel.gender === 'MALE' ? 'info' : 'danger'}`} style={{ marginLeft: 6 }}>
                          {alloc.hostel.gender === 'MALE' ? 'M' : 'F'}
                        </span>
                      </td>
                      <td>{alloc.session.name}</td>
                      <td>
                        <span className={`badge badge-${alloc.status === 'APPROVED' ? 'success' : alloc.status === 'PENDING' ? 'warning' : 'danger'}`}>
                          {alloc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alloc.note || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>N/A</span>}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenAllocateModal(alloc)}>
                          ✏️ Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Hostel Create/Edit Modal */}
      {showHostelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingHostel ? 'Edit Hostel Block' : 'Create Hostel Block'}</h3>
              <button className="modal-close" onClick={() => setShowHostelModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveHostel}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Hostel Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. St. Augustine Hall"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Gender Restriction</label>
                    <select
                      className="form-control"
                      value={hostelGender}
                      onChange={(e) => setHostelGender(e.target.value as any)}
                      required
                    >
                      <option value="MALE">Male Block</option>
                      <option value="FEMALE">Female Block</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Bed Spaces Capacity</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 120"
                      value={hostelCapacity}
                      onChange={(e) => setHostelCapacity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Allowed Levels (Select none to allow all levels)</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                    {[100, 200, 300, 400, 500, 600].map(lvl => (
                      <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={allowedLevels.includes(lvl)}
                          onChange={(e) => handleLevelCheckboxChange(lvl, e.target.checked)}
                        />
                        {lvl}L
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Near Faculty of Engineering"
                    value={hostelDesc}
                    onChange={(e) => setHostelDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowHostelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (editingHostel ? 'Saving...' : 'Creating...') : (editingHostel ? 'Save Changes' : 'Create Block')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Edit Modal */}
      {showAllocateModal && selectedAllocation && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Evaluate Bed Request</h3>
              <button className="modal-close" onClick={() => setShowAllocateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateAllocation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <strong>Student:</strong> {selectedAllocation.student.firstName} {selectedAllocation.student.lastName} ({selectedAllocation.student.matricNumber})
                </div>
                <div>
                  <strong>Requested Hostel:</strong> {selectedAllocation.hostel.name} ({selectedAllocation.hostel.gender})
                </div>

                <div className="form-group">
                  <label className="form-label">Decision Status</label>
                  <select
                    className="form-control"
                    value={allocationStatus}
                    onChange={(e) => setAllocationStatus(e.target.value as any)}
                    required
                  >
                    <option value="APPROVED">Approve Allocation</option>
                    <option value="REJECTED">Reject Allocation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Note / Bed Number Assignment</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Allocated Room 102 Bed B"
                    value={allocationNote}
                    onChange={(e) => setAllocationNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAllocateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
