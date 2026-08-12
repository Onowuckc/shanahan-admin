import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MapPinIcon, FileIcon, FolderIcon, PaymentsIcon, AcademicIcon, HostelsIcon, EditIcon, CheckIcon, CrossIcon, ArrowLeftIcon } from '../components/Icons';


interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'courses' | 'hostel'>('profile');

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    phoneNumber: '',
    level: 100,
    admissionStatus: 'ADMITTED',
    modeOfEntry: 'UTME',
    programType: 'Full-Time'
  });
  const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/admin/students/${id}`),
      api.get('/admin/settings/custom-fields?key=custom_student_fields')
    ])
      .then(([studentRes, fieldsRes]) => {
        setStudent(studentRes.data.data);
        setCustomFields(fieldsRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;
  if (!student) return <div className="empty-state"><div className="empty-state-title">Student not found.</div></div>;

  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
  const fmt = (n: number) => n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

  const docLinks = [
    { label: 'O\'Level Result', url: student.oLevelResultUrl, key: 'oLevel' },
    { label: 'Birth Certificate', url: student.birthCertificateUrl, key: 'birthCert' },
    { label: 'UTME Result', url: student.utmeResultUrl, key: 'utme' },
    { label: 'JAMB Admission Letter', url: student.jambAdmissionLetterUrl, key: 'jambLetter' },
    { label: 'State of Origin Certificate', url: student.stateOfOriginCertUrl, key: 'stateOfOrigin' },
    { label: 'Medical Certificate', url: student.medicalCertUrl, key: 'medical' },
    { label: 'Guarantor Form', url: student.guarantorFormUrl, key: 'guarantor' },
  ].filter((d) => d.url);

  const openEditModal = () => {
    setEditForm({
      phoneNumber: student.phoneNumber || '',
      level: student.level || 100,
      admissionStatus: student.admissionStatus || 'ADMITTED',
      modeOfEntry: student.modeOfEntry || 'UTME',
      programType: student.programType || 'Full-Time'
    });
    setEditMetadata(student.metadata || {});
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        metadata: editMetadata
      };
      const response = await api.put(`/admin/students/${student.id}`, payload);
      setStudent(response.data.data);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update student profile.');
    }
  };

  const handleMetadataChange = (key: string, value: any) => {
    setEditMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateDocStatus = async (docKey: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    const currentStatus = student.docVerificationStatus || {};
    const updatedStatus = { ...currentStatus, [docKey]: status };

    try {
      const response = await api.put(`/admin/students/${student.id}`, {
        docVerificationStatus: updatedStatus
      });
      setStudent(response.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to update document verification status.');
    }
  };

  const canVerifyDocs = ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF'].includes(currentUser?.role || '');

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/students')}><ArrowLeftIcon size={16} /></button>
          <div>
            <div className="page-title">{student.firstName} {student.lastName}</div>
            <div className="page-subtitle">{student.matricNumber} · {student.department?.name}</div>
          </div>
        </div>
        <div className="page-actions">
          <button onClick={openEditModal} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><EditIcon size={14} /> Edit Profile</button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0 }}>
            {student.passportPhotoUrl ? (
              <img src={student.passportPhotoUrl} alt="Profile" style={{ width: 100, height: 100, borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '3px solid var(--border-default)' }} />
            ) : (
              <div style={{
                width: 100, height: 100,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: '#fff',
                border: '3px solid var(--border-default)',
              }}>{initials}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{student.firstName} {student.lastName}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="badge badge-info">{student.level}L</span>
              <span className={`badge badge-${student.admissionStatus === 'ADMITTED' ? 'success' : 'warning'}`}>{student.admissionStatus}</span>
              <span className="badge badge-neutral">{student.gender}</span>
              <span className="badge badge-neutral">{student.modeOfEntry?.replace(/_/g, ' ')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Matric Number', value: student.matricNumber },
                { label: 'JAMB Reg. No.', value: student.jambRegNo || '—' },
                { label: 'Email', value: student.user?.email },
                { label: 'Phone', value: student.phoneNumber || '—' },
                { label: 'Department', value: student.department?.name },
                { label: 'Faculty', value: student.department?.faculty?.name },
                { label: 'Programme', value: student.program?.name },
                { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—' },
              ].map((f) => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 6 }}>
        {(['profile', 'payments', 'courses', 'hostel'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab ? 'var(--primary-500)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition)',
              textTransform: 'capitalize',
            }}
          >{tab === 'courses' ? 'Course Registrations' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid-2">
          {/* Personal & Custom Details */}
          <div className="section-card">
            <div className="section-card-header"><div className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPinIcon size={16} /> Personal & Dynamic Fields</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Residential Address', value: student.residentialAddress || '—' },
                { label: 'State', value: student.state || '—' },
                { label: 'LGA', value: student.lga || '—' },
                { label: 'Country', value: student.country || 'Nigeria' },
                { label: 'Programme Type', value: student.programType || '—' },
              ].map((f) => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f.value}</span>
                </div>
              ))}

              {/* Dynamic Metadata Fields */}
              {customFields.map((field) => (
                <div key={field.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{field.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, fontFamily: field.type === 'number' ? 'monospace' : 'inherit' }}>
                    {student.metadata?.[field.name] || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-card-header"><div className="section-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileIcon size={16} /> Admission Documents</div></div>
            {docLinks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {docLinks.map((doc) => {
                  const status = student.docVerificationStatus?.[doc.key] || 'PENDING';
                  return (
                    <div key={doc.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                      background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileIcon size={14} color="var(--primary-300)" />
                        <div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                            color: 'var(--primary-200)', fontWeight: 600, fontSize: 13, textDecoration: 'none'
                          }}>
                            {doc.label}
                          </a>
                          <div style={{ marginTop: 4 }}>
                            <span className={`badge badge-${status === 'VERIFIED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canVerifyDocs && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleUpdateDocStatus(doc.key, 'VERIFIED')}
                              className="btn btn-gold btn-sm"
                              style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <CheckIcon size={12} /> Verify
                            </button>
                          )}
                          {status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateDocStatus(doc.key, 'REJECTED')}
                              className="btn btn-neutral btn-sm"
                              style={{ padding: '4px 8px', fontSize: 11, color: 'var(--danger-400)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <CrossIcon size={12} /> Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><FolderIcon size={32} color="var(--text-muted)" /></div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No documents uploaded yet.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="table-wrapper">
          {student.payments?.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Session</th><th>Semester</th><th>Amount Due</th><th>Amount Paid</th><th>Outstanding</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {student.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.session?.name}</td>
                    <td>{p.semester?.name}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amountDue)}</td>
                    <td style={{ color: 'var(--success-500)', fontWeight: 600 }}>{fmt(p.amountPaid)}</td>
                    <td style={{ color: p.amountDue - p.amountPaid > 0 ? 'var(--danger-500)' : 'var(--text-muted)', fontWeight: 600 }}>{fmt(p.amountDue - p.amountPaid)}</td>
                    <td><span className={`badge badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'PARTIAL' ? 'warning' : 'danger'}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state"><div className="empty-state-icon"><PaymentsIcon size={48} color="#800020" /></div><div className="empty-state-title">No payment records</div></div>}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="table-wrapper">
          {student.registrations?.length > 0 ? (
            student.registrations.map((reg: any) => (
              <div key={reg.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{reg.session?.name} — {reg.semester?.name} Semester ({reg.level}L)</div>
                  <span className={`badge badge-${reg.isApproved ? 'success' : 'warning'}`}>{reg.isApproved ? 'Approved' : 'Pending Approval'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {reg.courses?.map((rc: any) => (
                    <div key={rc.id} style={{ background: 'var(--bg-input)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                      <strong>{rc.course?.code}</strong> — {rc.course?.title}
                      {rc.grade && <span className="badge badge-success" style={{ marginLeft: 6 }}>{rc.grade}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : <div className="empty-state"><div className="empty-state-icon"><AcademicIcon size={48} color="#800020" /></div><div className="empty-state-title">No course registrations</div></div>}
        </div>
      )}

      {activeTab === 'hostel' && (
        <div className="table-wrapper">
          {student.hostelAllocations?.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Hostel</th><th>Session</th><th>Status</th><th>Allocated</th><th>Approved</th></tr></thead>
              <tbody>
                {student.hostelAllocations.map((h: any) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.hostel?.name}</td>
                    <td>{h.session?.name}</td>
                    <td><span className={`badge badge-${h.status === 'APPROVED' ? 'success' : h.status === 'REJECTED' ? 'danger' : 'warning'}`}>{h.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(h.allocatedAt).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{h.approvedAt ? new Date(h.approvedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state"><div className="empty-state-icon"><HostelsIcon size={48} color="#800020" /></div><div className="empty-state-title">No hostel allocation</div></div>}
        </div>
      )}

      {/* Profile Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Student Profile</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select className="form-control" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) })}>
                    <option value="100">100L</option>
                    <option value="200">200L</option>
                    <option value="300">300L</option>
                    <option value="400">400L</option>
                    <option value="500">500L</option>
                    <option value="600">600L</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Admission Status</label>
                  <select className="form-control" value={editForm.admissionStatus} onChange={(e) => setEditForm({ ...editForm, admissionStatus: e.target.value })}>
                    <option value="ADMITTED">ADMITTED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="WITHDRAWN">WITHDRAWN</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mode of Entry</label>
                  <select className="form-control" value={editForm.modeOfEntry} onChange={(e) => setEditForm({ ...editForm, modeOfEntry: e.target.value })}>
                    <option value="UTME">UTME</option>
                    <option value="DIRECT_ENTRY">DIRECT ENTRY</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="POSTGRADUATE">POSTGRADUATE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Programme Type</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Full-Time, Part-Time"
                    value={editForm.programType}
                    onChange={(e) => setEditForm({ ...editForm, programType: e.target.value })}
                  />
                </div>

                {/* Render Dynamic Custom Fields inputs */}
                {customFields.map((field) => (
                  <div className="form-group" key={field.name}>
                    <label className="form-label">
                      {field.label} {field.required && <span style={{ color: 'var(--danger-500)' }}>*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="form-control"
                        value={editMetadata[field.name] || ''}
                        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="form-control"
                        placeholder={`Enter ${field.label}`}
                        value={editMetadata[field.name] || ''}
                        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
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
    </div>
  );
}
