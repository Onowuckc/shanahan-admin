import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { AcademicIcon, EditIcon, CrossIcon } from '../components/Icons';

interface Program {
  id: string;
  name: string;
  department: { name: string; faculty: { name: string } };
}

interface OLevelRequirement {
  id: string;
  programId: string;
  minCredits: number;
  requireMath: boolean;
  requireEnglish: boolean;
  notes: string | null;
}

export default function OLevelRequirementsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [requirements, setRequirements] = useState<OLevelRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Form State
  const [minCredits, setMinCredits] = useState<number>(5);
  const [requireMath, setRequireMath] = useState<boolean>(true);
  const [requireEnglish, setRequireEnglish] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [programsRes, reqsRes] = await Promise.all([
        api.get('/admin/programs'),
        api.get('/admin/programs-olevel')
      ]);
      setPrograms(programsRes.data.data || []);
      setRequirements(reqsRes.data.data || []);
    } catch (e) {
      console.error(e);
      showToast('Failed to load O\'Level requirements.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenEdit = (prog: Program) => {
    const existing = requirements.find(r => r.programId === prog.id);
    setSelectedProgram(prog);
    setMinCredits(existing ? existing.minCredits : 5);
    setRequireMath(existing ? existing.requireMath : true);
    setRequireEnglish(existing ? existing.requireEnglish : true);
    setNotes(existing?.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    setSaving(true);
    try {
      await api.post('/admin/programs-olevel', {
        programId: selectedProgram.id,
        minCredits,
        requireMath,
        requireEnglish,
        notes: notes.trim(),
      });
      showToast('O\'Level requirements updated successfully.');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save O\'Level requirements.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const getReqForProgram = (programId: string) => {
    return requirements.find(r => r.programId === programId);
  };

  return (
    <div className="animate-fade">
      {toast && (
        <div className="toast-container">
          <div className={`toast badge-${toast.type === 'success' ? 'success' : 'danger'}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-title">O'Level Requirements Configuration</div>
          <div className="page-subtitle">Configure minimum O'Level credits, subject passes, and specific notes for academic admissions</div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading pathways...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><AcademicIcon size={48} color="var(--text-muted)" /></div>
            <div className="empty-state-title">No academic programs found</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Degree Pathway</th>
                <th>Department & Faculty</th>
                <th>Min. Credits</th>
                <th>Math Required</th>
                <th>English Required</th>
                <th>Additional Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => {
                const req = getReqForProgram(p.id);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.department.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.department.faculty.name}</div>
                    </td>
                    <td>
                      {req ? (
                        <span className="badge badge-info">{req.minCredits} Credits</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ opacity: 0.7 }}>Not Configured (Default 5)</span>
                      )}
                    </td>
                    <td>
                      {req ? (
                        <span className={`badge badge-${req.requireMath ? 'danger' : 'neutral'}`}>
                          {req.requireMath ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ opacity: 0.7 }}>Yes</span>
                      )}
                    </td>
                    <td>
                      {req ? (
                        <span className={`badge badge-${req.requireEnglish ? 'danger' : 'neutral'}`}>
                          {req.requireEnglish ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ opacity: 0.7 }}>Yes</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {req?.notes || '—'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(p)}>
                        <EditIcon size={14} /><span style={{ marginLeft: 4 }}>Edit Requirements</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Requirements Modal */}
      {showModal && selectedProgram && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Configure Requirements</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: '8px 12px', background: 'var(--bg-neutral)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Programme</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{selectedProgram.name}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Credit Passes</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minCredits}
                    onChange={(e) => setMinCredits(parseInt(e.target.value) || 0)}
                    min={0}
                    max={9}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="req-math"
                      checked={requireMath}
                      onChange={(e) => setRequireMath(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="req-math" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      Mathematics Credit Pass is Required
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="req-english"
                      checked={requireEnglish}
                      onChange={(e) => setRequireEnglish(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="req-english" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      English Language Credit Pass is Required
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Requirements / Notes</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Must include Chemistry and Physics at single sitting."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Save Requirements'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
