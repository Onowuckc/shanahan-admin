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
      const params: any = {
        page,
        limit: 15,
      };
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
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant Name</th>
                  <th>Applied Programme</th>
                  <th>JAMB No</th>
                  <th>Admission Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>
                        {a.applicationNo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.program.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.program.department.name}</div>
                    </td>
                    <td>{a.jambRegNo || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>N/A</span>}</td>
                    <td><span className="badge badge-neutral">{a.admissionYear}</span></td>
                    <td>
                      <span className={`badge badge-${getStatusBadgeClass(a.admissionStatus)}`}>
                        {a.admissionStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => handleOpenDetail(a)}>
                          <EyeIcon size={13} /> Review
                        </button>
                        {a.admissionStatus === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateStatus(a.id, 'ADMITTED')}
                            >
                              Offer Admission
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing page {meta.page} of {meta.totalPages} (Total: {meta.total} applicants)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedApplicant && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Application Review</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Personal Information */}
                <div className="section-card" style={{ margin: 0 }}>
                  <div className="section-card-header">
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--primary-200)' }}>Personal Information</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 13 }}>
                    <div><strong>Full Name:</strong> {selectedApplicant.firstName} {selectedApplicant.lastName}</div>
                    <div><strong>Email Address:</strong> {selectedApplicant.user.email}</div>
                    <div><strong>Phone Number:</strong> {selectedApplicant.phoneNumber || 'N/A'}</div>
                    <div><strong>Gender:</strong> {selectedApplicant.gender}</div>
                    <div><strong>Admission Year:</strong> {selectedApplicant.admissionYear}</div>
                    <div><strong>Residential Address:</strong> {selectedApplicant.residentialAddress || 'N/A'}</div>
                    <div><strong>Origin:</strong> {selectedApplicant.lga || 'N/A'}, {selectedApplicant.state || 'N/A'}, {selectedApplicant.country || 'N/A'}</div>
                  </div>
                </div>

                {/* Academic Request */}
                <div className="section-card" style={{ margin: 0 }}>
                  <div className="section-card-header">
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--primary-200)' }}>Proposed Studies</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 13 }}>
                    <div><strong>Programme:</strong> {selectedApplicant.program?.name || 'N/A'}</div>
                    <div><strong>Department:</strong> {selectedApplicant.program?.department?.name || 'N/A'}</div>
                    <div><strong>Faculty:</strong> {selectedApplicant.program?.department?.faculty?.name || 'N/A'}</div>
                    <div><strong>JAMB Registration No:</strong> {selectedApplicant.jambRegNo || 'N/A'}</div>
                  </div>
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
                    ) : 'Not Submitted'}
                  </div>
                  <div>
                    <strong>O'Level Result:</strong>{' '}
                    {selectedApplicant.oLevelResultUrl ? (
                      <a href={selectedApplicant.oLevelResultUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                  <div>
                    <strong>Birth Certificate:</strong>{' '}
                    {selectedApplicant.birthCertificateUrl ? (
                      <a href={selectedApplicant.birthCertificateUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                  <div>
                    <strong>UTME Result Slip:</strong>{' '}
                    {selectedApplicant.utmeResultUrl ? (
                      <a href={selectedApplicant.utmeResultUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
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
                  <div>
                    <strong>Medical Certificate:</strong>{' '}
                    {selectedApplicant.medicalCertUrl ? (
                      <a href={selectedApplicant.medicalCertUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                  <div>
                    <strong>Guarantor Letter / Form:</strong>{' '}
                    {selectedApplicant.guarantorFormUrl ? (
                      <a href={selectedApplicant.guarantorFormUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-300)', textDecoration: 'underline' }}>View Document</a>
                    ) : 'Not Submitted'}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="section-card" style={{ margin: 0, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Status</div>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge badge-${getStatusBadgeClass(selectedApplicant.admissionStatus)}`}>
                        {selectedApplicant.admissionStatus}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
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
