import { useEffect, useState } from 'react';
import api from '../api/client';
import { CalendarIcon, CrossIcon } from '../components/Icons';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/admin/sessions');
    setSessions(data.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { setError('Session name is required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/admin/sessions', { name: form.name });
      setShowModal(false); setForm({ name: '' }); load();
    } catch (e: any) { setError(e.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const setCurrentSession = async (id: string) => {
    try { await api.put(`/admin/sessions/${id}/set-current`); load(); } catch (e) { console.error(e); }
  };

  const setCurrentSemester = async (semId: string) => {
    try { await api.put(`/admin/sessions/semesters/${semId}/set-current`); load(); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Academic Sessions</div>
          <div className="page-subtitle">{sessions.length} sessions configured</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>+ New Session</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sessions.map((s: any) => (
          <div key={s.id} className="glass-card" style={{ padding: '24px 28px', border: s.isCurrent ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.name}</div>
                {s.isCurrent && <span className="badge badge-gold">CURRENT SESSION</span>}
              </div>
              {!s.isCurrent && (
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentSession(s.id)}>Set as Current</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {s.semesters?.map((sem: any) => (
                <div key={sem.id} style={{
                  background: sem.isCurrent ? 'rgba(43,74,138,0.3)' : 'rgba(255,255,255,0.04)',
                  border: sem.isCurrent ? '1px solid var(--primary-300)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 20px',
                  minWidth: 160,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{sem.name} Semester</span>
                    {sem.isCurrent && <span className="badge badge-info" style={{ fontSize: 9 }}>CURRENT</span>}
                  </div>
                  {!sem.isCurrent && s.isCurrent && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 26 }} onClick={() => setCurrentSemester(sem.id)}>Set Active</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No academic sessions yet</div>
            <div className="empty-state-desc">Create the first academic session to get started.</div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Academic Session</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body">
              {error && <div style={{ color: 'var(--danger-500)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Session Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. 2026/2027" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>First and Second semesters will be created automatically.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Session'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
