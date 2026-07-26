import { useEffect, useState } from 'react';
import api from '../api/client';

interface Faculty {
  id: string;
  name: string;
  code: string;
  maxUnits?: number;
  _count: { departments: number };
  departments?: Department[];
}
interface Department {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  programs: { id: string; name: string; duration: number }[];
  _count: { students: number };
}

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [facultyForm, setFacultyForm] = useState({ name: '', code: '', maxUnits: '24' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', facultyId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Max Units States
  const [showMaxUnitsModal, setShowMaxUnitsModal] = useState(false);
  const [selectedDeptForMaxUnits, setSelectedDeptForMaxUnits] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [maxUnits, setMaxUnits] = useState('24');

  const load = async () => {
    setLoading(true);
    const [f, d, s] = await Promise.all([
      api.get('/admin/faculties'),
      api.get('/admin/departments'),
      api.get('/admin/sessions').catch(() => ({ data: { data: [] } }))
    ]);
    setFaculties(f.data.data);
    setDepartments(d.data.data);
    setSessions(s.data.data || []);
    setLoading(false);
  };

  const handleOpenMaxUnits = async (dept: any) => {
    setSelectedDeptForMaxUnits(dept);
    const activeSess = sessions.find((x: any) => x.isCurrent) || sessions[0];
    if (activeSess) {
      setSelectedSessionId(activeSess.id);
      setSemesters(activeSess.semesters || []);
      const activeSem = activeSess.semesters?.find((sem: any) => sem.isCurrent) || activeSess.semesters?.[0];
      if (activeSem) {
        setSelectedSemesterId(activeSem.id);
        await loadCurrentMaxUnits(dept.id, activeSess.id, activeSem.id);
      }
    }
    setShowMaxUnitsModal(true);
  };

  const handleSessionChangeInModal = async (sessId: string) => {
    setSelectedSessionId(sessId);
    const sess = sessions.find(s => s.id === sessId);
    if (sess) {
      setSemesters(sess.semesters || []);
      const semId = sess.semesters?.find((x: any) => x.isCurrent)?.id || sess.semesters?.[0]?.id || '';
      setSelectedSemesterId(semId);
      if (selectedDeptForMaxUnits && semId) {
        await loadCurrentMaxUnits(selectedDeptForMaxUnits.id, sessId, semId);
      }
    }
  };

  const handleSemesterChangeInModal = async (semId: string) => {
    setSelectedSemesterId(semId);
    if (selectedDeptForMaxUnits && selectedSessionId && semId) {
      await loadCurrentMaxUnits(selectedDeptForMaxUnits.id, selectedSessionId, semId);
    }
  };

  const loadCurrentMaxUnits = async (deptId: string, sessId: string, semId: string) => {
    try {
      const { data } = await api.get(`/admin/departments/${deptId}/max-units`, {
        params: { sessionId: sessId, semesterId: semId }
      });
      setMaxUnits(String(data.data.maxUnits));
    } catch (e) {
      setMaxUnits('24');
    }
  };

  const handleSaveMaxUnits = async () => {
    if (!selectedDeptForMaxUnits || !selectedSessionId || !selectedSemesterId) return;
    setSaving(true);
    try {
      await api.post(`/admin/departments/${selectedDeptForMaxUnits.id}/max-units`, {
        sessionId: selectedSessionId,
        semesterId: selectedSemesterId,
        maxUnits: parseInt(maxUnits)
      });
      setShowMaxUnitsModal(false);
      alert('Department maximum units configuration updated successfully.');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to save maximum units limit.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredDepts = selectedFaculty ? departments.filter((d) => d.facultyId === selectedFaculty) : departments;

  const handleOpenCreateFaculty = () => {
    setEditingFaculty(null);
    setFacultyForm({ name: '', code: '', maxUnits: '24' });
    setError('');
    setShowFacultyModal(true);
  };

  const handleOpenEditFaculty = (fac: Faculty) => {
    setEditingFaculty(fac);
    setFacultyForm({ name: fac.name, code: fac.code, maxUnits: String(fac.maxUnits || 24) });
    setError('');
    setShowFacultyModal(true);
  };

  const handleCreateOrUpdateFaculty = async () => {
    if (!facultyForm.name || !facultyForm.code) { setError('Name and code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: facultyForm.name,
        code: facultyForm.code,
        maxUnits: parseInt(facultyForm.maxUnits) || 24
      };
      if (editingFaculty) {
        await api.put(`/admin/faculties/${editingFaculty.id}`, payload);
      } else {
        await api.post('/admin/faculties', payload);
      }
      setShowFacultyModal(false);
      setFacultyForm({ name: '', code: '', maxUnits: '24' });
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || `Failed to ${editingFaculty ? 'update' : 'create'} faculty.`);
    } finally { setSaving(false); }
  };

  const handleCreateDept = async () => {
    if (!deptForm.name || !deptForm.code || !deptForm.facultyId) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/admin/departments', deptForm);
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '', facultyId: '' });
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create department.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Faculties & Departments</div>
          <div className="page-subtitle">{faculties.length} faculties · {departments.length} departments</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowDeptModal(true); setError(''); }}>+ New Department</button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateFaculty}>+ New Faculty</button>
        </div>
      </div>

      <div className="grid-2">
        {/* Faculty Panel */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>Faculties ({faculties.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faculties.map((f) => (
              <div
                key={f.id}
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  border: selectedFaculty === f.id ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)',
                }}
                onClick={() => setSelectedFaculty(selectedFaculty === f.id ? null : f.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent-300)', fontWeight: 600, marginTop: 2 }}>
                      Code: {f.code} · Max Units: {f.maxUnits || 24}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditFaculty(f);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: 11 }}
                    >
                      ✏️ Edit
                    </button>
                    <span className="badge badge-info">{f._count.departments} dept{f._count.departments !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Panel */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
            Departments {selectedFaculty ? `(filtered: ${filteredDepts.length})` : `(${departments.length})`}
            {selectedFaculty && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => setSelectedFaculty(null)}>✕ Clear</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredDepts.map((d) => (
              <div key={d.id} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Code: {d.code}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="badge badge-success">{d._count.students} students</span>
                    <button 
                      onClick={() => handleOpenMaxUnits(d)}
                      className="btn btn-ghost btn-sm" 
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      ⚙️ Set Max Units
                    </button>
                  </div>
                </div>
                {d.programs?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {d.programs.map((p) => (
                      <span key={p.id} style={{ fontSize: 11, background: 'rgba(61,101,181,0.15)', border: '1px solid rgba(61,101,181,0.3)', borderRadius: 4, padding: '2px 8px', color: 'var(--primary-200)' }}>
                        {p.name} ({p.duration}yr)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredDepts.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">🏛️</div>
                <div className="empty-state-title">No departments found</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Faculty Modal */}
      {showFacultyModal && (
        <div className="modal-overlay" onClick={() => setShowFacultyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</div>
              <button className="modal-close" onClick={() => setShowFacultyModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ color: 'var(--danger-500)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Faculty Name</label>
                <input className="form-control" value={facultyForm.name} onChange={(e) => setFacultyForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Faculty of Natural Sciences" />
              </div>
              <div className="form-group">
                <label className="form-label">Faculty Code</label>
                <input className="form-control" value={facultyForm.code} onChange={(e) => setFacultyForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. NAS" maxLength={8} />
              </div>
              <div className="form-group">
                <label className="form-label">Base Maximum Credit Units</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={facultyForm.maxUnits} 
                  onChange={(e) => setFacultyForm((f) => ({ ...f, maxUnits: e.target.value }))} 
                  placeholder="e.g. 24" 
                  min="1"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowFacultyModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateOrUpdateFaculty} disabled={saving}>
                {saving ? 'Saving...' : editingFaculty ? 'Save Changes' : 'Create Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add New Department</div>
              <button className="modal-close" onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ color: 'var(--danger-500)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Faculty</label>
                <select className="form-control" value={deptForm.facultyId} onChange={(e) => setDeptForm((d) => ({ ...d, facultyId: e.target.value }))}>
                  <option value="">Select Faculty</option>
                  {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Department Name</label>
                <input className="form-control" value={deptForm.name} onChange={(e) => setDeptForm((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Computer Science" />
              </div>
              <div className="form-group">
                <label className="form-label">Department Code</label>
                <input className="form-control" value={deptForm.code} onChange={(e) => setDeptForm((d) => ({ ...d, code: e.target.value }))} placeholder="e.g. 335" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeptModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateDept} disabled={saving}>{saving ? 'Saving...' : 'Create Department'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Max Units Modal */}
      {showMaxUnitsModal && selectedDeptForMaxUnits && (
        <div className="modal-overlay" onClick={() => setShowMaxUnitsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Set Maximum Credit Units</div>
              <button className="modal-close" onClick={() => setShowMaxUnitsModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Configure the maximum credit units that students in <strong>{selectedDeptForMaxUnits.name}</strong> can register for in a given semester.
              </div>
              <div className="form-group">
                <label className="form-label">Academic Session</label>
                <select 
                  className="form-control" 
                  value={selectedSessionId} 
                  onChange={(e) => handleSessionChangeInModal(e.target.value)}
                >
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Semester</label>
                <select 
                  className="form-control" 
                  value={selectedSemesterId} 
                  onChange={(e) => handleSemesterChangeInModal(e.target.value)}
                >
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} Semester {s.isCurrent ? '(Current)' : ''}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Allowed Credit Units</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={maxUnits} 
                  onChange={(e) => setMaxUnits(e.target.value)}
                  placeholder="e.g. 21" 
                  min="1"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMaxUnitsModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveMaxUnits} disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
