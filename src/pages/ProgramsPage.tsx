import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { AcademicIcon, EditIcon, SettingsIcon, CrossIcon, PlusIcon } from '../components/Icons';


interface Program {
  id: string;
  name: string;
  duration: number;
  departmentId: string;
  department: { name: string; faculty: { name: string } };
  _count: { students: number };
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [duration, setDuration] = useState('4');

  // Rules Modal State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [programForRule, setProgramForRule] = useState<Program | null>(null);
  const [rules, setRules] = useState<Record<string, number>>({});
  const [rulesLoading, setRulesLoading] = useState(false);

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/programs');
      setPrograms(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    api.get('/admin/departments').then(r => setDepartments(r.data.data)).catch(console.error);
  }, [fetchPrograms]);

  const handleOpenRules = async (prog: Program) => {
    setProgramForRule(prog);
    setShowRulesModal(true);
    setRulesLoading(true);
    try {
      const { data } = await api.get(`/admin/programs/${prog.id}/requirements`);
      const reqs = data.data || [];
      const rulesMap: Record<string, number> = {};
      reqs.forEach((r: any) => {
        rulesMap[`${r.level}-${r.semester}`] = r.minElectives;
      });
      setRules(rulesMap);
    } catch (e) {
      console.error(e);
      alert('Failed to load program requirement rules.');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleRuleChange = async (lvl: number, sem: number, val: string) => {
    if (!programForRule) return;
    const minElectives = parseInt(val) || 0;
    try {
      await api.post(`/admin/programs/${programForRule.id}/requirements`, {
        level: lvl,
        semester: sem,
        minElectives
      });
      setRules(prev => ({
        ...prev,
        [`${lvl}-${sem}`]: minElectives
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to save elective count requirement.');
    }
  };

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setName('');
    setDepartmentId('');
    setDuration('4');
    setShowModal(true);
  };

  const handleOpenEdit = (prog: Program) => {
    setEditingProgram(prog);
    setName(prog.name);
    setDepartmentId(prog.departmentId);
    setDuration(String(prog.duration));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !departmentId) {
      showToast('Program name and department are required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        departmentId,
        duration: parseInt(duration) || 4
      };

      if (editingProgram) {
        await api.put(`/admin/programs/${editingProgram.id}`, payload);
        showToast('Program updated successfully.');
      } else {
        await api.post('/admin/programs', payload);
        showToast('Program created successfully.');
      }
      setShowModal(false);
      fetchPrograms();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save program details.');
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Programmes Management</div>
          <div className="page-subtitle">Manage degree pathways, academic years, and departments</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleOpenCreate}><PlusIcon size={14} /> Create Programme</button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading programs...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><AcademicIcon size={48} color="var(--text-muted)" /></div>
            <div className="empty-state-title">No programmes registered</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Degree Pathway</th>
                <th>Department</th>
                <th>Faculty</th>
                <th>Duration (Years)</th>
                <th>Enrolled Students</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.department.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.department.faculty.name}</td>
                  <td><span className="badge badge-neutral">{p.duration} Years</span></td>
                  <td><span className="badge badge-info">{p._count.students} Students</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(p)}><EditIcon size={14} /><span style={{ marginLeft: 4 }}>Edit</span></button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: 'var(--primary-200)', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenRules(p)}><SettingsIcon size={14} /> Elective Rules</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingProgram ? 'Edit Degree Pathway' : 'Create New Degree Pathway'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Programme Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. B.Sc. Software Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Department</label>
                  <select
                    className="form-control"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Years)</label>
                  <select
                    className="form-control"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  >
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="4">4 Years (Standard B.Sc.)</option>
                    <option value="5">5 Years (Engineering/Law/Pharmacy)</option>
                    <option value="6">6 Years (Medicine & Surgery)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProgram ? 'Save Changes' : 'Create Pathway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Elective Rules Modal */}
      {showRulesModal && programForRule && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Elective Course Rules: {programForRule.name}</h3>
              <button className="modal-close" onClick={() => setShowRulesModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Define how many elective courses a student must select for registration at each level and semester.
              </p>

              {rulesLoading ? (
                <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Academic Period</th>
                      <th>Minimum Electives Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: programForRule.duration }).map((_, yearIdx) => {
                      const yr = (yearIdx + 1) * 100;
                      return [1, 2].map((sem) => {
                        const key = `${yr}-${sem}`;
                        const currentVal = rules[key] || 0;

                        return (
                          <tr key={key}>
                            <td style={{ fontWeight: 600 }}>{yr} Level - Semester {sem}</td>
                            <td>
                              <select
                                className="form-control"
                                style={{ width: 160, padding: '4px 8px' }}
                                value={currentVal}
                                onChange={(e) => handleRuleChange(yr, sem, e.target.value)}
                              >
                                <option value="0">0 (No electives)</option>
                                <option value="1">At least 1</option>
                                <option value="2">At least 2</option>
                                <option value="3">At least 3</option>
                                <option value="4">At least 4</option>
                                <option value="5">At least 5</option>
                                <option value="6">At least 6</option>
                              </select>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowRulesModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
