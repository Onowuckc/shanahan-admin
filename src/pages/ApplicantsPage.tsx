import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { SearchIcon, ApplicantsIcon, EyeIcon, CrossIcon } from '../components/Icons';

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  applicationNo: string;
  jambRegNo?: string;
  gender: string;
  admissionStatus: 'PENDING' | 'ADMITTED' | 'REJECTED' | 'WITHDRAWN';
  admissionYear: number;
  program: {
    id: string;
    name: string;
    department: {
      name: string;
      faculty: { name: string };
    };
  };
  user: {
    email: string;
    isEmailVerified: boolean;
  };
  createdAt: string;
  phoneNumber?: string;
  residentialAddress?: string;
  country?: string;
  state?: string;
  lga?: string;
  passportPhotoUrl?: string;
  oLevelResultUrl?: string;
  birthCertificateUrl?: string;
  utmeResultUrl?: string;
  jambAdmissionLetterUrl?: string;
  stateOfOriginCertUrl?: string;
  medicalCertUrl?: string;
  guarantorFormUrl?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');

  // Detail Modal
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const showToast = (msg: string) => {
    alert(msg);
  };

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (programId) params.programId = programId;
      if (status) params.admissionStatus = status;
      if (gender) params.gender = gender;

      const { data } = await api.get('/admin/applicants', { params });
      setApplicants(data.data);
      setMeta(data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, programId, status, gender]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  useEffect(() => {
    api.get('/admin/programs')
      .then(r => setPrograms(r.data.data || []))
      .catch(console.error);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'PENDING' | 'ADMITTED' | 'REJECTED' | 'WITHDRAWN') => {
    setSavingStatus(true);
    try {
      await api.put(`/admin/applicants/${id}/admission-status`, { admissionStatus: newStatus });
      showToast(`Applicant admission status updated to ${newStatus}.`);
      fetchApplicants();
      if (selectedApplicant && selectedApplicant.id === id) {
        setSelectedApplicant({ ...selectedApplicant, admissionStatus: newStatus });
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleEnrolApplicant = async (id: string) => {
    setSavingStatus(true);
    try {
      const { data } = await api.post(`/admin/applicants/${id}/enrol`);
      const creds = data.credentials || {};
      alert(
        `🎉 Applicant Enrolled Successfully!\n\n` +
        `Matriculation Number: ${creds.matricNumber || data.data.matricNumber}\n` +
        `Institutional Email: ${creds.generatedEmail || creds.email}\n` +
        `Temporary Password: ${creds.temporaryPassword}\n\n` +
        `The applicant can now log in to the Student Portal.`
      );
      setShowModal(false);
      fetchApplicants();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to enrol applicant.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleOpenDetail = (app: Applicant) => {
    setSelectedApplicant(app);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ADMITTED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Admissions & Applicants</div>
          <div className="page-subtitle">Review admissions applications, evaluate credentials, and make admission offers</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="search-input-wrapper" style={{ minWidth: 260, flex: '1 1 auto' }}>
          <SearchIcon size={15} color="var(--text-muted)" />
          <input
            placeholder="Search name, application no, jamb no..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 200 }}
          value={programId}
          onChange={(e) => { setProgramId(e.target.value); setPage(1); }}
        >
          <option value="">All Programmes</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          className="form-control"
          style={{ width: 160 }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Evaluation</option>
          <option value="ADMITTED">Admitted</option>
          <option value="REJECTED">Rejected</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>

        <select
          className="form-control"
          style={{ width: 120 }}
          value={gender}
          onChange={(e) => { setGender(e.target.value); setPage(1); }}
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading applicants list...</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ApplicantsIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No applicant applications found</div>
            <div className="empty-state-desc">Try adjusting your search or filter criteria.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>App Number</th>
                <th>Programme</th>
                <th>JAMB Reg No</th>
                <th>Gender</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(app)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.user.email}</div>
                  </td>
                  <td><code style={{ fontSize: 12 }}>{app.applicationNo}</code></td>
                  <td>{app.program?.name || 'Unassigned'}</td>
                  <td>{app.jambRegNo || 'N/A'}</td>
                  <td>{app.gender}</td>
                  <td><span className={`badge badge-${getStatusBadgeClass(app.admissionStatus)}`}>{app.admissionStatus}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenDetail(app); }}>
                      <EyeIcon size={14} /> Review
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
              <button className="page-btn" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>›</button>
              <button className="page-btn" onClick={() => setPage(meta.totalPages)} disabled={page === meta.totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedApplicant && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 720, width: '100%' }}>
            <div className="modal-header">
              <h3>Applicant Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Applicant Info */}
              <div className="section-card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{selectedApplicant.firstName} {selectedApplicant.lastName}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{selectedApplicant.user.email}</div>
                  </div>
                  <span className={`badge badge-${getStatusBadgeClass(selectedApplicant.admissionStatus)}`}>
                    {selectedApplicant.admissionStatus}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, fontSize: 13 }}>
                  <div><strong>Application No:</strong> {selectedApplicant.applicationNo}</div>
                  <div><strong>Program:</strong> {selectedApplicant.program?.name || 'N/A'}</div>
                  <div><strong>Department:</strong> {selectedApplicant.program?.department?.name || 'N/A'}</div>
                  <div><strong>Faculty:</strong> {selectedApplicant.program?.department?.faculty?.name || 'N/A'}</div>
                  <div><strong>Gender:</strong> {selectedApplicant.gender}</div>
                  <div><strong>Phone:</strong> {selectedApplicant.phoneNumber || 'N/A'}</div>
                  <div><strong>JAMB Reg No:</strong> {selectedApplicant.jambRegNo || 'N/A'}</div>
                </div>
              </div>

              {/* Submitted Documents */}
              <div className="section-card" style={{ margin: 0 }}>
                <div className="section-card-header">
                  <h4 style={{ margin: 0, fontSize: 14, color: 'var(--primary-200)' }}>Submitted Documents</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, fontSize: 13 }}>
                  <div>
                    <strong>Passport Photo:</strong>{' '}
                    {selectedApplicant.passportPhotoUrl ? (
                      <a href={selectedApplicant.passportPhotoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : <span style={{ color: 'var(--danger-400)' }}>Not Submitted</span>}
                  </div>
                  <div>
                    <strong>O'Level Result:</strong>{' '}
                    {selectedApplicant.oLevelResultUrl ? (
                      <a href={selectedApplicant.oLevelResultUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : <span style={{ color: 'var(--danger-400)' }}>Not Submitted</span>}
                  </div>
                  <div>
                    <strong>Birth Certificate:</strong>{' '}
                    {selectedApplicant.birthCertificateUrl ? (
                      <a href={selectedApplicant.birthCertificateUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : <span style={{ color: 'var(--danger-400)' }}>Not Submitted</span>}
                  </div>
                  <div>
                    <strong>UTME Result Slip:</strong>{' '}
                    {selectedApplicant.utmeResultUrl ? (
                      <a href={selectedApplicant.utmeResultUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : <span style={{ color: 'var(--danger-400)' }}>Not Submitted</span>}
                  </div>
                  <div>
                    <strong>JAMB Admission Letter:</strong>{' '}
                    {selectedApplicant.jambAdmissionLetterUrl ? (
                      <a href={selectedApplicant.jambAdmissionLetterUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                  <div>
                    <strong>State of Origin Cert:</strong>{' '}
                    {selectedApplicant.stateOfOriginCertUrl ? (
                      <a href={selectedApplicant.stateOfOriginCertUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="section-card" style={{ margin: 0, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Status</div>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge badge-${getStatusBadgeClass(selectedApplicant.admissionStatus)}`}>
                        {selectedApplicant.admissionStatus}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedApplicant.admissionStatus === 'ADMITTED' && (
                      <button
                        className="btn btn-primary"
                        style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                        disabled={savingStatus}
                        onClick={() => handleEnrolApplicant(selectedApplicant.id)}
                      >
                        🎓 Enrol as Student
                      </button>
                    )}
                    {selectedApplicant.admissionStatus !== 'ADMITTED' && (
                      <button
                        className="btn btn-primary"
                        disabled={savingStatus}
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'ADMITTED')}
                      >
                        Offer Admission
                      </button>
                    )}
                    {selectedApplicant.admissionStatus !== 'REJECTED' && (
                      <button
                        className="btn btn-ghost"
                        style={{ color: 'var(--danger-500)', border: '1px solid var(--danger-800)' }}
                        disabled={savingStatus}
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'REJECTED')}
                      >
                        Reject Application
                      </button>
                    )}
                    {selectedApplicant.admissionStatus !== 'PENDING' && (
                      <button
                        className="btn btn-ghost"
                        disabled={savingStatus}
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'PENDING')}
                      >
                        Set to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
