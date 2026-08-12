import { useEffect, useState } from 'react';
import api from '../api/client';
import { PaymentsIcon, CheckIcon, CrossIcon } from '../components/Icons';

export default function FeeCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/admin/fee-categories'); setCategories(data.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Category name required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/admin/fee-categories', form);
      setShowModal(false); setForm({ name: '', description: '' }); load();
    } catch (e: any) { setError(e.response?.data?.error || 'Creation failed'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await api.put(`/admin/fee-categories/${id}`, { isActive: !isActive }); load(); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Fee Categories</div>
          <div className="page-subtitle">{categories.length} fee types configured</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>+ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {categories.map((c: any) => (
          <div key={c.id} className="glass-card" style={{ padding: '20px 24px', border: c.isActive ? '1px solid var(--border-subtle)' : '1px solid rgba(255,0,0,0.1)', opacity: c.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(128,0,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentsIcon size={20} color="#800020" />
              </div>
              <span className={`badge badge-${c.isActive ? 'success' : 'danger'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#1F1115' }}>{c.name}</div>
            {c.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{c.description}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => toggleActive(c.id, c.isActive)}>
                {c.isActive ? <span>Deactivate</span> : <><CheckIcon size={14} /><span>Activate</span></>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Fee Category</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body">
              {error && <div style={{ color: 'var(--danger-500)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Category Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition Fee" />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input className="form-control" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of this fee" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
