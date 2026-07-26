import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

interface Course {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  departmentId: string;
  department: { name: string; faculty: { name: string } };
  lecturerId?: string;
  lecturer?: { firstName: string; lastName: string; staffId: string };
  _count: { registrations: number };
  level: number;
  semester: number;
  isCore: boolean;
  programId?: string;
  program?: { name: string };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [lecturers, setLecturers] = useState<{ id: string; firstName: string; lastName: string; staffId: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [creditUnits, setCreditUnits] = useState('2');
  const [formDeptId, setFormDeptId] = useState('');
  const [formLecturerId, setFormLecturerId] = useState('');
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const [level, setLevel] = useState('100');
  const [semester, setSemester] = useState('1');
  const [isCore, setIsCore] = useState(true);
  const [programId, setProgramId] = useState('');

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (departmentId) params.departmentId = departmentId;

      const { data } = await api.get('/admin/courses', { params });
      setCourses(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, departmentId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    api.get('/admin/departments').then(r => setDepartments(r.data.data)).catch(console.error);
    api.get('/admin/programs').then(r => setPrograms(r.data.data)).catch(console.error);
    api.get('/admin/staff').then(r => {
      // Filter for lecturers
      const staffList = r.data.data || [];
      const lecturerList = staffList.filter((s: any) => 
        s.user.role === 'LECTURER' || (s.user.roles && s.user.roles.includes('LECTURER'))
      );
      setLecturers(lecturerList);
    }).catch(console.error);
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setCode('');
    setTitle('');
    setCreditUnits('2');
    setFormDeptId('');
    setFormLecturerId('');
    setSelectedPrereqIds([]);
    setLevel('100');
    setSemester('1');
    setIsCore(true);
    setProgramId('');
    setShowModal(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    setCode(course.code);
    setTitle(course.title);
    setCreditUnits(String(course.creditUnits));
    setFormDeptId(course.departmentId);
    setFormLecturerId(course.lecturerId || '');
    setSelectedPrereqIds(course.prerequisites?.map((p: any) => p.prerequisiteId) || []);
    setLevel(String(course.level || 100));
    setSemester(String(course.semester || 1));
    setIsCore(course.isCore !== undefined ? course.isCore : true);
    setProgramId(course.programId || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title || !formDeptId) {
      showToast('Course code, title, and department are required.');
      return;
    }

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        creditUnits: parseInt(creditUnits) || 2,
        departmentId: formDeptId,
        lecturerId: formLecturerId || null,
        prerequisiteIds: selectedPrereqIds,
        level: parseInt(level),
        semester: parseInt(semester),
        isCore,
        programId: programId || null
      };

      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse.id}`, payload);
        showToast('Course updated successfully.');
      } else {
        await api.post('/admin/courses', payload);
        showToast('Course created successfully.');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save course details.');
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Courses Catalogue</div>
          <div className="page-subtitle">Manage departmental courses, assignments, and credit structures</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>+ Create Course</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ minWidth: 300 }}>
          <span>🔍</span>
          <input
            placeholder="Search code, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-control" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <div className="empty-state-title">No courses found</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Units</th>
                <th>Level/Sem</th>
                <th>Type</th>
                <th>Program Specific</th>
                <th>Assigned Lecturer</th>
                <th>Registered Students</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>{c.code}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td><span className="badge badge-neutral">{c.creditUnits} Units</span></td>
                  <td><span className="badge badge-neutral">{c.level}L / Sem {c.semester}</span></td>
                  <td>
                    <span className={`badge ${c.isCore ? 'badge-gold' : 'badge-neutral'}`}>
                      {c.isCore ? 'Core' : 'Elective'}
                    </span>
                  </td>
                  <td>{c.program?.name || <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>All Programs</span>}</td>
                  <td>
                    {c.lecturer ? (
                      <span style={{ fontWeight: 500 }}>{c.lecturer.firstName} {c.lecturer.lastName}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td><span className="badge badge-info">{c._count.registrations} Students</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(c)}>✏️ Edit</button>
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
              <h3 className="modal-title">{editingCourse ? 'Edit Course Details' : 'Create New Course'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Course Code</label>
                  <input
                    className="form-control"
                    placeholder="e.g. CMP 101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Introduction to Computer Science"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Credit Units</label>
                  <select
                    className="form-control"
                    value={creditUnits}
                    onChange={(e) => setCreditUnits(e.target.value)}
                    required
                  >
                    <option value="1">1 Unit</option>
                    <option value="2">2 Units (Standard)</option>
                    <option value="3">3 Units</option>
                    <option value="4">4 Units (Lab-based)</option>
                    <option value="5">5 Units</option>
                    <option value="6">6 Units (Project)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-control"
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <select
                      className="form-control"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      required
                    >
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                      <option value="600">600 Level</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="form-control"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                    >
                      <option value="1">First Semester</option>
                      <option value="2">Second Semester</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Course Type</label>
                    <select
                      className="form-control"
                      value={isCore ? 'true' : 'false'}
                      onChange={(e) => setIsCore(e.target.value === 'true')}
                      required
                    >
                      <option value="true">Core Course</option>
                      <option value="false">Elective Course</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Program (Optional)</label>
                    <select
                      className="form-control"
                      value={programId}
                      onChange={(e) => setProgramId(e.target.value)}
                    >
                      <option value="">All Programs in Department</option>
                      {programs
                        .filter(p => !formDeptId || p.departmentId === formDeptId)
                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Lecturer (Optional)</label>
                  <select
                    className="form-control"
                    value={formLecturerId}
                    onChange={(e) => setFormLecturerId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {lecturers.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName} ({l.staffId})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Prerequisites (Optional)</label>
                  <div style={{
                    maxHeight: 140,
                    overflowY: 'auto',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: 'rgba(255,255,255,0.01)'
                  }}>
                    {courses
                      .filter(c => c.id !== editingCourse?.id)
                      .map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedPrereqIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPrereqIds([...selectedPrereqIds, c.id]);
                              } else {
                                setSelectedPrereqIds(selectedPrereqIds.filter(id => id !== c.id));
                              }
                            }}
                          />
                          <span>{c.code} - {c.title}</span>
                        </label>
                      ))}
                    {courses.filter(c => c.id !== editingCourse?.id).length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No other courses available.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
