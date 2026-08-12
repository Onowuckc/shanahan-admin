import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { EyeIcon, CheckIcon, CrossIcon } from '../components/Icons';

interface Registration {
  id: string;
  studentId: string;
  student: { firstName: string; lastName: string; matricNumber: string; department: { name: string } };
  session: { name: string };
  semester: { name: string };
  level: number;
  isApproved: boolean;
  createdAt: string;
  courses: { id: string; course: { code: string; title: string; creditUnits: number } }[];
}

export default function CourseRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isApprovedFilter, setIsApprovedFilter] = useState('');

  // Modals
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (isApprovedFilter === 'true') params.isApproved = 'true';
      if (isApprovedFilter === 'false') params.isApproved = 'false';

      const { data } = await api.get('/admin/course-registrations', { params });
      setRegistrations(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, isApprovedFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleToggleApproval = async (reg: Registration, approve: boolean) => {
    try {
      await api.put(`/admin/course-registrations/${reg.id}/approve`, { isApproved: approve });
      showToast(`Registration ${approve ? 'approved' : 'unapproved'} successfully.`);
      fetchRegistrations();
      if (selectedReg && selectedReg.id === reg.id) {
        setSelectedReg({ ...reg, isApproved: approve });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update registration status.');
    }
  };

  const handleOpenDetail = (reg: Registration) => {
    setSelectedReg(reg);
    setShowDetailModal(true);
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Course Registrations</div>
          <div className="page-subtitle">Review and approve or reject student course registration submissions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          className="form-control"
          value={isApprovedFilter}
          onChange={(e) => { setIsApprovedFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="false">Pending Approval</option>
          <option value="true">Approved</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CheckIcon size={48} color="var(--success-500)" /></div>
            <div className="empty-state-title">No registrations found</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Matric Number</th>
                <th>Academic Period</th>
                <th>Level</th>
                <th>Total Courses</th>
                <th>Total Units</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const totalUnits = r.courses.reduce((sum, c) => sum + c.course.creditUnits, 0);
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.student.firstName} {r.student.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.student.department.name}</div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary-200)' }}>{r.student.matricNumber}</span></td>
                    <td>{r.session.name} — {r.semester.name} Semester</td>
                    <td><span className="badge badge-info">{r.level}L</span></td>
                    <td>{r.courses.length} Courses</td>
                    <td><span className="badge badge-neutral">{totalUnits} Units</span></td>
                    <td>
                      <span className={`badge badge-${r.isApproved ? 'success' : 'warning'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenDetail(r)}><EyeIcon size={13} /> Details</button>
                        {r.isApproved ? (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => handleToggleApproval(r, false)}>Reject</button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handleToggleApproval(r, true)}>Approve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReg && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Registered Courses Details</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedReg.student.firstName} {selectedReg.student.lastName} ({selectedReg.student.matricNumber})
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <strong>Session:</strong> {selectedReg.session.name} | <strong>Semester:</strong> {selectedReg.semester.name} Semester
                </div>
                <div>
                  <strong>Total Units:</strong> {selectedReg.courses.reduce((sum, c) => sum + c.course.creditUnits, 0)} Units
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Title</th>
                    <th style={{ textAlign: 'right' }}>Credit Units</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReg.courses.map((rc) => (
                    <tr key={rc.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>{rc.course.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{rc.course.title}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{rc.course.creditUnits} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>Close</button>
              {selectedReg.isApproved ? (
                <button className="btn btn-danger" onClick={() => handleToggleApproval(selectedReg, false)}>Reject Registration</button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleToggleApproval(selectedReg, true)}>Approve Registration</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
