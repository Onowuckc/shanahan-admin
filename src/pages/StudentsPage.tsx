import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SearchIcon, StudentsIcon, EyeIcon, CrossIcon, UploadIcon, PlusIcon } from '../components/Icons';

interface Student {
  id: string;
  matricNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  level: number;
  admissionStatus: string;
  modeOfEntry: string;
  passportPhotoUrl?: string;
  department: { id: string; name: string; code: string; faculty: { name: string } };
  program: { name: string };
  user: { email: string };
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

interface FilterState {
  search: string;
  departmentId: string;
  level: string;
  gender: string;
  admissionStatus: string;
  modeOfEntry: string;
}

const LEVELS = ['100', '200', '300', '400', '500', '600'];
const GENDERS = ['MALE', 'FEMALE'];
const ADMISSION_STATUSES = ['ADMITTED', 'PENDING', 'REJECTED', 'WITHDRAWN'];
const MODES = ['UTME', 'DIRECT_ENTRY', 'TRANSFER', 'POSTGRADUATE'];

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '', departmentId: '', level: '', gender: '', admissionStatus: '', modeOfEntry: '',
  });

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'MALE',
    dateOfBirth: '2005-01-01',
    departmentId: '',
    programId: '',
    level: '100',
    modeOfEntry: 'UTME',
  });

  // Fetch departments & programs for dropdowns
  useEffect(() => {
    api.get('/admin/departments').then((r) => setDepartments(r.data.data)).catch(() => {});
    api.get('/admin/programs').then((r) => setPrograms(r.data.data || [])).catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.level) params.level = filters.level;
      if (filters.gender) params.gender = filters.gender;
      if (filters.admissionStatus) params.admissionStatus = filters.admissionStatus;
      if (filters.modeOfEntry) params.modeOfEntry = filters.modeOfEntry;

      const { data } = await api.get('/admin/students', { params });
      setStudents(data.data);
      setMeta(data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', departmentId: '', level: '', gender: '', admissionStatus: '', modeOfEntry: '' });
    setPage(1);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName || !addForm.lastName || !addForm.departmentId || !addForm.programId) {
      alert('Please fill in all required fields (First Name, Last Name, Department, Program).');
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post('/admin/students', addForm);
      const creds = data.credentials || {};
      alert(
        `🎉 Student Account Created Successfully!\n\n` +
        `Matriculation Number: ${creds.matricNumber}\n` +
        `Institutional Email: ${creds.email}\n` +
        `Temporary Password: ${creds.temporaryPassword}\n\n` +
        `Share these credentials with the student to allow login to the Student Portal.`
      );
      setShowAddModal(false);
      setAddForm({
        firstName: '', lastName: '', email: '', phoneNumber: '',
        gender: 'MALE', dateOfBirth: '2005-01-01', departmentId: '', programId: '',
        level: '100', modeOfEntry: 'UTME',
      });
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create student account.');
    } finally {
      setCreating(false);
    }
  };

  const initials = (s: Student) => `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { ADMITTED: 'success', PENDING: 'warning', REJECTED: 'danger', WITHDRAWN: 'neutral' };
    return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
  };

  const pages = meta ? Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => i + 1) : [];

  const availablePrograms = addForm.departmentId
    ? programs.filter((p) => p.departmentId === addForm.departmentId)
    : programs;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Student Records</div>
          <div className="page-subtitle">
            {meta ? `${meta.total.toLocaleString()} students found` : 'Loading...'}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/students/upload')}>
            <UploadIcon size={14} /> Bulk Upload
          </button>
          <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAddModal(true)}>
            <PlusIcon size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ minWidth: 260 }}>
          <SearchIcon size={15} color="var(--text-muted)" />
          <input
            id="student-search"
            placeholder="Search name, matric number, email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <select id="filter-dept" className="form-control" value={filters.departmentId} onChange={(e) => handleFilterChange('departmentId', e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select id="filter-level" className="form-control" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}L</option>)}
        </select>

        <select id="filter-gender" className="form-control" value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}>
          <option value="">All Genders</option>
          {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <select id="filter-admission-status" className="form-control" value={filters.admissionStatus} onChange={(e) => handleFilterChange('admissionStatus', e.target.value)}>
          <option value="">Admission Status</option>
          {ADMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select id="filter-mode" className="form-control" value={filters.modeOfEntry} onChange={(e) => handleFilterChange('modeOfEntry', e.target.value)}>
          <option value="">Mode of Entry</option>
          {MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
        </select>

        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}><CrossIcon size={14} /><span style={{ marginLeft: 4 }}>Clear</span></button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><StudentsIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No students found</div>
            <div className="empty-state-desc">Try adjusting your search or click "Add Student" to create one.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Matric Number</th>
                <th>Department</th>
                <th>Level</th>
                <th>Gender</th>
                <th>Mode</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.passportPhotoUrl ? (
                        <img src={s.passportPhotoUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }} />
                      ) : (
                        <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(s)}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary-200)' }}>{s.matricNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{s.department.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.department.faculty.name}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{s.level}L</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.gender}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.modeOfEntry?.replace(/_/g, ' ')}</td>
                  <td>{statusBadge(s.admissionStatus)}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={(e) => { e.stopPropagation(); navigate(`/students/${s.id}`); }}
                      title="View Details"
                    >
                      <EyeIcon size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="pagination">
            <span>Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()}</span>
            <div className="pagination-buttons">
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pages.map((p) => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>›</button>
              <button className="page-btn" onClick={() => setPage(meta.totalPages)} disabled={page === meta.totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 640, width: '100%' }}>
            <div className="modal-header">
              <h3>Create Student Record</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>First Name *</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Chidi"
                      required
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Last Name *</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Okafor"
                      required
                      value={addForm.lastName}
                      onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Auto-generated if empty"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Phone Number</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 08012345678"
                      value={addForm.phoneNumber}
                      onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Department *</label>
                    <select
                      className="form-control"
                      required
                      value={addForm.departmentId}
                      onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value, programId: '' })}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Academic Program *</label>
                    <select
                      className="form-control"
                      required
                      disabled={!addForm.departmentId}
                      value={addForm.programId}
                      onChange={(e) => setAddForm({ ...addForm, programId: e.target.value })}
                    >
                      <option value="">Select Program...</option>
                      {availablePrograms.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Level</label>
                    <select
                      className="form-control"
                      value={addForm.level}
                      onChange={(e) => setAddForm({ ...addForm, level: e.target.value })}
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l} Level</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Gender</label>
                    <select
                      className="form-control"
                      value={addForm.gender}
                      onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Mode of Entry</label>
                    <select
                      className="form-control"
                      value={addForm.modeOfEntry}
                      onChange={(e) => setAddForm({ ...addForm, modeOfEntry: e.target.value })}
                    >
                      {MODES.map((m) => (
                        <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating Student...' : 'Create Student Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
