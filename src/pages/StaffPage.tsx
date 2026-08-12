import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { SearchIcon, StaffIcon, TrashIcon, AlertIcon, EditIcon, CrossIcon, UploadIcon } from '../components/Icons';


interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  departmentId?: string;
  user: { email: string; role: string };
  courses: { code: string; title: string }[];
  metadata?: Record<string, any>;
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState(String(new Date().getFullYear()));
  const [uploading, setUploading] = useState(false);
  const [uploadDetails, setUploadDetails] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    departmentId: ''
  });
  const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (departmentId) params.departmentId = departmentId;

      const { data } = await api.get('/admin/staff', { params });
      setStaffList(data.data);
      setMeta(data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/departments'),
      api.get('/admin/settings/custom-fields?key=custom_staff_fields')
    ]).then(([deptRes, fieldsRes]) => {
      setDepartments(deptRes.data.data || []);
      setCustomFields(fieldsRes.data.data || []);
    }).catch(console.error);
  }, []);

  // Handle Edit Click
  const handleEditClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      phoneNumber: staff.phoneNumber || '',
      departmentId: staff.departmentId || ''
    });
    setEditMetadata(staff.metadata || {});
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      const payload = {
        ...editForm,
        metadata: editMetadata
      };
      await api.put(`/admin/staff/${selectedStaff.id}`, payload);
      showToast('Staff profile updated successfully.');
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      showToast('Failed to update staff profile.');
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      await api.delete(`/admin/staff/${selectedStaff.id}`);
      showToast('Staff member account deleted successfully.');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to delete staff member account.');
    }
  };

  // Handle Bulk Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select an Excel file.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadDetails(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('admissionYear', uploadYear);

    try {
      const { data } = await api.post('/admin/upload-staff', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadDetails(data);
      showToast(data.message);
      setUploadFile(null);
      fetchStaff();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to upload staff Excel sheet.';
      setUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const initials = (s: Staff) => `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Staff Management</div>
          <div className="page-subtitle">
            {meta ? `${meta.total.toLocaleString()} staff members found` : 'Loading...'}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowUploadModal(true)}><UploadIcon size={14} /> Bulk Import Staff</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ minWidth: 300 }}>
          <SearchIcon size={15} color="var(--text-muted)" />
          <input
            placeholder="Search name, staff ID, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="form-control" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading staff...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><StaffIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No staff members found</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Staff ID</th>
                <th>Department</th>
                <th>System Role</th>
                <th>Courses Taught</th>
                <th>Custom Columns</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(s)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary-200)' }}>{s.staffId}</span></td>
                  <td>{departments.find(d => d.id === s.departmentId)?.name || 'N/A'}</td>
                  <td><span className="badge badge-info">{s.user.role}</span></td>
                  <td>
                    {s.courses.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>
                    ) : (
                      s.courses.map(c => <span key={c.code} className="badge badge-neutral" style={{ marginRight: 4 }} title={c.title}>{c.code}</span>)
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {s.metadata ? (
                      Object.entries(s.metadata)
                        .filter(([k]) => k !== 'dateOfBirth')
                        .map(([k, v]) => (
                          <div key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}</div>
                        ))
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(s)}><EditIcon size={14} /><span style={{ marginLeft: 4 }}>Edit</span></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-400)', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => { setSelectedStaff(s); setShowDeleteModal(true); }}><TrashIcon size={13} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Staff Profile</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" value={editForm.phoneNumber} onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={editForm.departmentId} onChange={(e) => setEditForm({...editForm, departmentId: e.target.value})}>
                    <option value="">None / Administrative</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Render Custom Staff Columns */}
                {customFields.map((field) => (
                  <div className="form-group" key={field.name}>
                    <label className="form-label">
                      {field.label} {field.required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="form-control"
                        value={editMetadata[field.name] || ''}
                        onChange={(e) => setEditMetadata({ ...editMetadata, [field.name]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="form-control"
                        placeholder={`Enter ${field.label}`}
                        value={editMetadata[field.name] || ''}
                        onChange={(e) => setEditMetadata({ ...editMetadata, [field.name]: e.target.value })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Staff from Excel</h3>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); setUploadDetails(null); setUploadError(null); }}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Download the template, fill in your staff records, and upload it. Extra columns in your Excel will be dynamically saved as custom metadata fields!
                </p>

                <div className="form-group">
                  <label className="form-label">Select Excel File (.xlsx)</label>
                  <input
                    type="file"
                    accept=".xlsx"
                    className="form-control"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year of Entry (Optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                  />
                </div>

                {uploadError && (
                  <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', color: 'var(--danger-500)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertIcon size={16} /> {uploadError}
                  </div>
                )}

                {uploadDetails && (
                  <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: 'var(--success-500)', marginBottom: 4 }}>Success!</div>
                    <div>{uploadDetails.message}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      Temporary password assigned to imported staff: <strong>{uploadDetails.defaultPassword}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowUploadModal(false); setUploadDetails(null); setUploadError(null); }}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !!uploadDetails}>
                  {uploading ? 'Uploading...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger-400)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertIcon size={20} color="var(--danger-400)" /> Confirm Delete Staff Account</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                Are you sure you want to delete the staff account for <strong>{selectedStaff.firstName} {selectedStaff.lastName}</strong>?
              </p>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--danger-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div><strong>Staff ID:</strong> {selectedStaff.staffId}</div>
                <div><strong>Email:</strong> {selectedStaff.user?.email || 'N/A'}</div>
                <div><strong>Role:</strong> {selectedStaff.user?.role || 'N/A'}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <AlertIcon size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Warning: This action cannot be undone and will permanently remove staff login credentials and profile records.</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteStaff}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrashIcon size={14} /> Delete Staff Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
