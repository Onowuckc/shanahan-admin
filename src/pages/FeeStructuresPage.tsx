import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { PaymentsIcon, EditIcon, CrossIcon } from '../components/Icons';

interface FeeStructure {
  id: string;
  feeCategoryId: string;
  feeCategory: { name: string };
  sessionId: string;
  session: { name: string };
  semesterId: string;
  semester: { name: string };
  level: number | null;
  facultyId: string | null;
  faculty: { name: string } | null;
  departmentId: string | null;
  department: { name: string } | null;
  amount: number;
  isActive: boolean;
  createdAt: string;
}

interface FeeCategory {
  id: string;
  name: string;
}

interface Session {
  id: string;
  name: string;
  semesters: { id: string; name: string }[];
}

interface Faculty {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSessionId, setFilterSessionId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  // Form State
  const [feeCategoryId, setFeeCategoryId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [level, setLevel] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterSessionId) params.sessionId = filterSessionId;
      if (filterLevel) params.level = filterLevel;

      const { data } = await api.get('/admin/fee-structures', { params });
      setStructures(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterSessionId, filterLevel]);

  const loadDependencies = useCallback(async () => {
    try {
      const [catRes, sesRes, facRes, deptRes] = await Promise.all([
        api.get('/admin/fee-categories'),
        api.get('/admin/sessions'),
        api.get('/admin/faculties'),
        api.get('/admin/departments')
      ]);
      setCategories(catRes.data.data || []);
      setSessions(sesRes.data.data || []);
      setFaculties(facRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      console.error('Failed loading fee dependencies:', err);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const handleOpenCreate = () => {
    setEditingStructure(null);
    setFeeCategoryId('');
    setSessionId('');
    setSemesterId('');
    setLevel('');
    setFacultyId('');
    setDepartmentId('');
    setAmount('');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (st: FeeStructure) => {
    setEditingStructure(st);
    setFeeCategoryId(st.feeCategoryId);
    setSessionId(st.sessionId);
    setSemesterId(st.semesterId);
    setLevel(st.level ? String(st.level) : '');
    setFacultyId(st.facultyId || '');
    setDepartmentId(st.departmentId || '');
    setAmount(String(st.amount));
    setIsActive(st.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeCategoryId || !sessionId || !semesterId || !amount) {
      showToast('Fee category, session, semester, and amount are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingStructure) {
        // Update
        await api.put(`/admin/fee-structures/${editingStructure.id}`, {
          amount: parseFloat(amount),
          isActive,
        });
        showToast('Fee structure updated.');
      } else {
        // Create
        await api.post('/admin/fee-structures', {
          feeCategoryId,
          sessionId,
          semesterId,
          level: level ? parseInt(level) : null,
          facultyId: facultyId || null,
          departmentId: departmentId || null,
          amount: parseFloat(amount),
        });
        showToast('Fee structure created successfully.');
      }
      setShowModal(false);
      fetchStructures();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save fee structure.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await api.delete(`/admin/fee-structures/${id}`);
      showToast('Fee structure deleted successfully.');
      fetchStructures();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to delete.');
    }
  };

  const getAvailableSemesters = () => {
    const selectedSes = sessions.find(s => s.id === sessionId);
    return selectedSes ? selectedSes.semesters : [];
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Fee Structures</div>
          <div className="page-subtitle">Define, configure, and allocate fees across sessions, departments, and levels</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>+ Configure Fee</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ gap: 12 }}>
        <select
          className="form-control"
          style={{ width: 200 }}
          value={filterSessionId}
          onChange={(e) => setFilterSessionId(e.target.value)}
        >
          <option value="">All Sessions</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          className="form-control"
          style={{ width: 150 }}
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="100">100 Level</option>
          <option value="200">200 Level</option>
          <option value="300">300 Level</option>
          <option value="400">400 Level</option>
          <option value="500">500 Level</option>
          <option value="600">600 Level</option>
        </select>
      </div>

      {/* Grid / Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading fee structures...</p>
          </div>
        ) : structures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><PaymentsIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No fee structures configured</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Academic Period</th>
                <th>Target Level</th>
                <th>Target Dept / Faculty</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {structures.map((st) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 600 }}>{st.feeCategory.name}</td>
                  <td>{st.session.name} — {st.semester.name} Semester</td>
                  <td>
                    {st.level ? (
                      <span className="badge badge-info">{st.level} Level</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>All Levels</span>
                    )}
                  </td>
                  <td>
                    {st.department ? (
                      <div>Dept: {st.department.name}</div>
                    ) : st.faculty ? (
                      <div>Faculty: {st.faculty.name}</div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>University-wide</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-200)' }}>
                    ₦{st.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`badge badge-${st.isActive ? 'success' : 'danger'}`}>
                      {st.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => handleOpenEdit(st)}>
                        <EditIcon size={14} />
                        <span>Edit</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => handleDelete(st.id)}>
                        <CrossIcon size={14} color="var(--danger-500)" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Configure Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">{editingStructure ? 'Edit Fee Configuration' : 'Configure Fee Allocation'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Fee Category</label>
                    <select
                      className="form-control"
                      value={feeCategoryId}
                      onChange={(e) => setFeeCategoryId(e.target.value)}
                      disabled={!!editingStructure}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (₦)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 150000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Academic Session</label>
                    <select
                      className="form-control"
                      value={sessionId}
                      onChange={(e) => { setSessionId(e.target.value); setSemesterId(''); }}
                      disabled={!!editingStructure}
                      required
                    >
                      <option value="">Select Session</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="form-control"
                      value={semesterId}
                      onChange={(e) => setSemesterId(e.target.value)}
                      disabled={!sessionId || !!editingStructure}
                      required
                    >
                      <option value="">Select Semester</option>
                      {getAvailableSemesters().map(sem => <option key={sem.id} value={sem.id}>{sem.name} Semester</option>)}
                    </select>
                  </div>
                </div>

                {!editingStructure && (
                  <>
                    <hr style={{ border: 0, borderTop: '1px solid var(--border-default)', margin: '8px 0' }} />
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Target Scope (Optional filters for specific targeting)</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Target Level</label>
                        <select className="form-control" value={level} onChange={(e) => setLevel(e.target.value)}>
                          <option value="">All Levels</option>
                          <option value="100">100 Level</option>
                          <option value="200">200 Level</option>
                          <option value="300">300 Level</option>
                          <option value="400">400 Level</option>
                          <option value="500">500 Level</option>
                          <option value="600">600 Level</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Target Faculty</label>
                        <select className="form-control" value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(''); }} disabled={!!departmentId}>
                          <option value="">All Faculties</option>
                          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Target Department</label>
                        <select className="form-control" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setFacultyId(''); }} disabled={!!facultyId}>
                          <option value="">All Departments</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {editingStructure && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input
                      type="checkbox"
                      id="is-active-fee"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <label htmlFor="is-active-fee" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Active Status</label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingStructure ? 'Save Changes' : 'Configure Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
