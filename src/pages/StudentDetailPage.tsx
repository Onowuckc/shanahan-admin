import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileIcon, FolderIcon, PaymentsIcon, AcademicIcon, HostelsIcon, EditIcon, CheckIcon, CrossIcon, ArrowLeftIcon, TrashIcon, AlertIcon } from '../components/Icons';


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
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'courses' | 'hostel'>('profile');

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'MALE',
    level: 100,
    departmentId: '',
    programId: '',
    admissionStatus: 'ADMITTED',
    modeOfEntry: 'UTME',
    programType: 'Full-Time'
  });
  const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/admin/students/${id}`),
      api.get('/admin/settings/custom-fields?key=custom_student_fields'),
      api.get('/admin/departments'),
      api.get('/admin/programs')
    ])
      .then(([studentRes, fieldsRes, deptRes, progRes]) => {
        setStudent(studentRes.data.data);
        setCustomFields(fieldsRes.data.data || []);
        setDepartments(deptRes.data.data || []);
        setPrograms(progRes.data.data || []);
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
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.user?.email || '',
      phoneNumber: student.phoneNumber || '',
      gender: student.gender || 'MALE',
      level: student.level || 100,
      departmentId: student.departmentId || student.department?.id || '',
      programId: student.programId || student.program?.id || '',
      admissionStatus: student.admissionStatus || 'ADMITTED',
      modeOfEntry: student.modeOfEntry || 'UTME',
      programType: student.programType || 'Full-Time'
    });
    setEditMetadata(student.metadata || {});
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        metadata: editMetadata
      };
      const response = await api.put(`/admin/students/${student.id}`, payload);
      setStudent(response.data.data);
      setShowEditModal(false);
      alert('Student record updated successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/students/${student.id}`);
      alert(`Student account (${student.matricNumber}) permanently deleted.`);
      navigate('/students');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete student account.');
    } finally {
      setDeleting(false);
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
        </div>        <div className="page-actions" style={{ display: 'flex', gap: 8 }}>
          <button onClick={openEditModal} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <EditIcon size={14} color="var(--primary-300)" /> Edit Record
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--danger-500)' }}>
            <TrashIcon size={14} color="var(--danger-500)" /> Delete Account
          </button>
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

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
        {[
          { id: 'profile', label: 'Student Profile & Verification', icon: FolderIcon },
          { id: 'payments', label: 'Payment History', icon: PaymentsIcon },
          { id: 'courses', label: 'Course Registrations', icon: AcademicIcon },
          { id: 'hostel', label: 'Hostel Accommodation', icon: HostelsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid var(--primary-400)' : '2px solid transparent',
                color: isActive ? 'var(--primary-400)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--primary-400)' : 'var(--text-muted)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Documents verification */}
          <div className="section-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileIcon size={18} color="var(--primary-400)" />
              Document Verifications
            </h3>
            {docLinks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No documents uploaded by student yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docLinks.map((doc) => {
                  const status = (student.docVerificationStatus && student.docVerificationStatus[doc.key]) || 'PENDING';
                  return (
                    <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.label}</div>
                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary-300)', textDecoration: 'underline' }}>View Document</a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge badge-${status === 'VERIFIED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'}`}>{status}</span>
                        {canVerifyDocs && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {status !== 'VERIFIED' && (
                              <button onClick={() => handleUpdateDocStatus(doc.key, 'VERIFIED')} className="btn btn-ghost btn-sm btn-icon" title="Approve Document"><CheckIcon size={14} color="var(--success-500)" /></button>
                            )}
                            {status !== 'REJECTED' && (
                              <button onClick={() => handleUpdateDocStatus(doc.key, 'REJECTED')} className="btn btn-ghost btn-sm btn-icon" title="Reject Document"><CrossIcon size={14} color="var(--danger-500)" /></button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Custom Metadata */}
          <div className="section-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderIcon size={18} color="var(--primary-400)" />
              Custom Records & Attributes
            </h3>
            {customFields.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No custom student fields configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {customFields.map((field) => (
                  <div key={field.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{field.label}:</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{student.metadata?.[field.name] || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Student Payment Ledger</h3>
          {(!student.payments || student.payments.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No payments recorded for this student.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Fee Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {student.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: 12 }}>{p.txRef || p.id}</code></td>
                    <td>{p.feeStructure?.category?.name || 'Tuition Fee'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td><span className={`badge badge-${p.status === 'COMPLETED' ? 'success' : 'warning'}`}>{p.status}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Course Registration History</h3>
          {(!student.courseRegistrations || student.courseRegistrations.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No course registrations found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {student.courseRegistrations.map((reg: any) => (
                <div key={reg.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <strong>{reg.session?.name} — {reg.semester?.name} ({reg.level}L)</strong>
                    <span className={`badge badge-${reg.isApproved ? 'success' : 'warning'}`}>{reg.isApproved ? 'Approved' : 'Pending Approval'}</span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Title</th>
                        <th>Units</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reg.courses?.map((c: any) => (
                        <tr key={c.id}>
                          <td><code>{c.course?.code}</code></td>
                          <td>{c.course?.title}</td>
                          <td>{c.course?.creditUnits}</td>
                          <td>{c.grade || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hostel' && (
        <div className="section-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Hostel Allocation Details</h3>
          {(!student.hostelAllocations || student.hostelAllocations.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No active hostel room allocations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {student.hostelAllocations.map((h: any) => (
                <div key={h.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div><strong>Hostel Block:</strong> {h.room?.hostel?.name || 'N/A'}</div>
                  <div><strong>Room Number:</strong> {h.room?.roomNumber || 'N/A'}</div>
                  <div><strong>Status:</strong> <span className="badge badge-success">{h.status}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 680, width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EditIcon size={18} color="var(--primary-300)" />
                <h3 style={{ margin: 0 }}>Edit Student Record</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Matriculation Number: </span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary-200)' }}>{student.matricNumber}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>First Name *</label>
                    <input
                      className="form-control"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Last Name *</label>
                    <input
                      className="form-control"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Phone Number</label>
                    <input
                      className="form-control"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Department</label>
                    <select
                      className="form-control"
                      value={editForm.departmentId}
                      onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Programme</label>
                    <select
                      className="form-control"
                      value={editForm.programId}
                      onChange={(e) => setEditForm({ ...editForm, programId: e.target.value })}
                    >
                      <option value="">Select Programme</option>
                      {(editForm.departmentId ? programs.filter(p => p.departmentId === editForm.departmentId) : programs).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Academic Level</label>
                    <select
                      className="form-control"
                      value={editForm.level}
                      onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) })}
                    >
                      <option value={100}>100 Level</option>
                      <option value={200}>200 Level</option>
                      <option value={300}>300 Level</option>
                      <option value={400}>400 Level</option>
                      <option value={500}>500 Level</option>
                      <option value={600}>600 Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Gender</label>
                    <select
                      className="form-control"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Admission Status</label>
                    <select
                      className="form-control"
                      value={editForm.admissionStatus}
                      onChange={(e) => setEditForm({ ...editForm, admissionStatus: e.target.value })}
                    >
                      <option value="ADMITTED">ADMITTED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="WITHDRAWN">WITHDRAWN</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Mode of Entry</label>
                    <select
                      className="form-control"
                      value={editForm.modeOfEntry}
                      onChange={(e) => setEditForm({ ...editForm, modeOfEntry: e.target.value })}
                    >
                      <option value="UTME">UTME</option>
                      <option value="DIRECT_ENTRY">DIRECT ENTRY</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="POSTGRADUATE">POSTGRADUATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Programme Type</label>
                    <select
                      className="form-control"
                      value={editForm.programType}
                      onChange={(e) => setEditForm({ ...editForm, programType: e.target.value })}
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Sandwich">Sandwich</option>
                    </select>
                  </div>
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
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Student Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 480, width: '100%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger-500)' }}>
                <AlertIcon size={20} color="var(--danger-500)" />
                <h3 style={{ margin: 0, color: 'var(--danger-500)' }}>Confirm Account Deletion</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(false)}><CrossIcon size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the student account for{' '}
                <strong>{student.firstName} {student.lastName}</strong> (
                <span style={{ fontFamily: 'monospace', color: 'var(--primary-200)' }}>{student.matricNumber}</span>)?
              </p>
              <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-500)', fontSize: 13, color: 'var(--danger-500)' }}>
                <strong>Warning:</strong> This action is irreversible. The student's login account, profile data, course registrations, and academic records will be permanently removed.
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--danger-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                disabled={deleting}
                onClick={handleDeleteStudent}
              >
                <TrashIcon size={16} />
                {deleting ? 'Deleting Record...' : 'Delete Student Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
