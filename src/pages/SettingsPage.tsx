import { useEffect, useState } from 'react';
import api from '../api/client';

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

interface ScoreConfig {
  id?: string;
  scope: 'SYSTEM' | 'FACULTY' | 'DEPARTMENT' | 'COURSE';
  scopeId: string;
  caMax: number;
  examMax: number;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'fields' | 'score' | 'receipt' | 'rbac'>('fields');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // TAB 1: Custom Fields states
  const [studentFields, setStudentFields] = useState<CustomField[]>([]);
  const [staffFields, setStaffFields] = useState<CustomField[]>([]);
  const [targetType, setTargetType] = useState<'student' | 'staff'>('student');
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');

  // TAB 2: Score configuration states
  const [scoreConfigs, setScoreConfigs] = useState<ScoreConfig[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [systemCaMax, setSystemCaMax] = useState<number>(40);
  const [systemExamMax, setSystemExamMax] = useState<number>(60);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionScope, setExceptionScope] = useState<'FACULTY' | 'DEPARTMENT' | 'COURSE'>('FACULTY');
  const [exceptionScopeId, setExceptionScopeId] = useState('');
  const [exceptionCaMax, setExceptionCaMax] = useState<number>(40);
  const [exceptionExamMax, setExceptionExamMax] = useState<number>(60);

  // TAB 3: Receipt Branding states
  const [receiptUniName, setReceiptUniName] = useState('');
  const [receiptPermAddr, setReceiptPermAddr] = useState('');
  const [receiptTempAddr, setReceiptTempAddr] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptPhones, setReceiptPhones] = useState('');
  const [hostelOffcampus, setHostelOffcampus] = useState(true);
  const [paystackBearer, setPaystackBearer] = useState('account');
  const [applicationFee, setApplicationFee] = useState<number>(10000);
  const [admissionFee, setAdmissionFee] = useState<number>(50000);

  // TAB 4: RBAC dynamic states
  const [rbacPermissions, setRbacPermissions] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Load Custom Fields
      const [studentRes, staffRes] = await Promise.all([
        api.get('/admin/settings/custom-fields?key=custom_student_fields'),
        api.get('/admin/settings/custom-fields?key=custom_staff_fields')
      ]);
      setStudentFields(studentRes.data.data || []);
      setStaffFields(staffRes.data.data || []);

      // 2. Load System Settings (Receipt Branding & RBAC)
      const settingsRes = await api.get('/admin/settings/system');
      const settings = settingsRes.data.data || {};
      setReceiptUniName(settings.receipt_university_name || '');
      setReceiptPermAddr(settings.receipt_permanent_address || '');
      setReceiptTempAddr(settings.receipt_temporary_address || '');
      setReceiptFooter(settings.receipt_footer || '');
      setReceiptEmail(settings.receipt_contact_email || '');
      setReceiptPhones(settings.receipt_contact_phones || '');
      setHostelOffcampus(settings.hostel_allow_offcampus === undefined ? true : settings.hostel_allow_offcampus);
      setPaystackBearer(settings.paystack_charge_bearer || 'account');
      setApplicationFee(Number(settings.application_fee) || 10000);
      setAdmissionFee(Number(settings.admission_fee) || 50000);

      // Load RBAC Settings
      if (settings.rbac_permissions) {
        setRbacPermissions(settings.rbac_permissions);
      } else {
        setRbacPermissions({
          features: {
            students: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            admissions: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'ADMISSIONS_STAFF', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'ADMISSIONS_STAFF'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            staff: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            finance: {
              readRoles: ['SUPER_ADMIN', 'BURSARY_STAFF', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'BURSARY_STAFF'],
              deleteRoles: ['SUPER_ADMIN', 'BURSARY_STAFF'],
              deniedLogins: []
            },
            academic_setup: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            academic_records: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'EXAMS_RECORDS_STAFF'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            hostels: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN', 'HOSTEL_ADMIN', 'STUDENT_AFFAIRS_STAFF'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            user_management: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            settings: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            },
            audit_logs: {
              readRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              writeRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deleteRoles: ['SUPER_ADMIN', 'ICT_ADMIN'],
              deniedLogins: []
            }
          }
        });
      }

      // 3. Load Score Configs & Metadata lists
      const [configsRes, facsRes, deptsRes, coursesRes] = await Promise.all([
        api.get('/admin/settings/score-configs'),
        api.get('/admin/faculties'),
        api.get('/admin/departments'),
        api.get('/admin/courses')
      ]);

      const configs: ScoreConfig[] = configsRes.data.data || [];
      const sysConfig = configs.find(c => c.scope === 'SYSTEM');
      if (sysConfig) {
        setSystemCaMax(sysConfig.caMax);
        setSystemExamMax(sysConfig.examMax);
      }
      setScoreConfigs(configs.filter(c => c.scope !== 'SYSTEM'));
      setFaculties(facsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
      setCourses(coursesRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load settings data.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ─── TAB 1: Custom Fields Operations ───────────────────────────────────────
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !label) {
      showToast('Key name and Display label are required.', 'danger');
      return;
    }

    const keyName = name.trim().toLowerCase().replace(/\s+/g, '_');
    const newField: CustomField = {
      name: keyName,
      label: label.trim(),
      type: fieldType,
      required,
      ...(fieldType === 'select' && {
        options: optionsStr.split(',').map(o => o.trim()).filter(Boolean)
      })
    };

    const targetList = targetType === 'student' ? studentFields : staffFields;
    if (targetList.some(f => f.name === keyName)) {
      showToast(`A field with key "${keyName}" already exists.`, 'danger');
      return;
    }

    if (targetType === 'student') {
      setStudentFields([...studentFields, newField]);
    } else {
      setStaffFields([...staffFields, newField]);
    }

    setName('');
    setLabel('');
    setFieldType('text');
    setRequired(false);
    setOptionsStr('');
    showToast('Field added to list. Remember to save changes.');
  };

  const handleRemoveField = (type: 'student' | 'staff', nameToRemove: string) => {
    if (type === 'student') {
      setStudentFields(studentFields.filter(f => f.name !== nameToRemove));
    } else {
      setStaffFields(staffFields.filter(f => f.name !== nameToRemove));
    }
    showToast('Field removed from list. Remember to save changes.');
  };

  const handleSaveChanges = async (type: 'student' | 'staff') => {
    setSaving(true);
    const key = type === 'student' ? 'custom_student_fields' : 'custom_staff_fields';
    const fields = type === 'student' ? studentFields : staffFields;

    try {
      await api.post('/admin/settings/custom-fields', { key, fields });
      showToast(`${type === 'student' ? 'Student' : 'Staff'} custom fields saved successfully!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings to database.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 2: Score Configuration Operations ──────────────────────────────────
  const handleSaveSystemScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (systemCaMax + systemExamMax !== 100) {
      showToast('Total marks must sum up to 100.', 'danger');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/settings/score-configs', {
        scope: 'SYSTEM',
        scopeId: 'SYSTEM',
        caMax: systemCaMax,
        examMax: systemExamMax,
      });
      showToast('Default CA/Exam split updated.');
    } catch (err) {
      console.error(err);
      showToast('Failed to save default split.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionScopeId) {
      showToast('Please select a target faculty, department, or course.', 'danger');
      return;
    }
    if (exceptionCaMax + exceptionExamMax !== 100) {
      showToast('Exception score splits must sum up to 100.', 'danger');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/settings/score-configs', {
        scope: exceptionScope,
        scopeId: exceptionScopeId,
        caMax: exceptionCaMax,
        examMax: exceptionExamMax,
      });
      showToast('Exception score split added successfully.');
      setShowExceptionModal(false);
      // Reload configurations
      const configsRes = await api.get('/admin/settings/score-configs');
      setScoreConfigs((configsRes.data.data || []).filter((c: any) => c.scope !== 'SYSTEM'));
    } catch (err) {
      console.error(err);
      showToast('Failed to save exception split.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfigException = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this score exception?')) return;
    try {
      await api.delete(`/admin/settings/score-configs/${id}`);
      showToast('Exception deleted successfully.');
      setScoreConfigs(scoreConfigs.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      showToast('Failed to delete exception.', 'danger');
    }
  };

  const getScopeName = (scope: string, scopeId: string) => {
    if (scope === 'FACULTY') {
      return faculties.find(f => f.id === scopeId)?.name || 'Unknown Faculty';
    }
    if (scope === 'DEPARTMENT') {
      return departments.find(d => d.id === scopeId)?.name || 'Unknown Department';
    }
    if (scope === 'COURSE') {
      const course = courses.find(c => c.id === scopeId);
      return course ? `${course.code} - ${course.title}` : 'Unknown Course';
    }
    return 'System';
  };

  // ─── TAB 3: Receipt Branding Operations ────────────────────────────────────
  const handleSaveReceiptBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings/system', {
        settings: {
          receipt_university_name: receiptUniName,
          receipt_permanent_address: receiptPermAddr,
          receipt_temporary_address: receiptTempAddr,
          receipt_footer: receiptFooter,
          receipt_contact_email: receiptEmail,
          receipt_contact_phones: receiptPhones,
          hostel_allow_offcampus: hostelOffcampus,
          paystack_charge_bearer: paystackBearer,
          application_fee: applicationFee,
          admission_fee: admissionFee,
        }
      });
      showToast('Receipt branding and portal parameters saved.');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 4: RBAC Dynamic Operations ────────────────────────────────────────
  const handleRbacCheckboxChange = (feature: string, type: 'readRoles' | 'writeRoles' | 'deleteRoles', role: string, checked: boolean) => {
    if (!rbacPermissions) return;
    const newFeatures = { ...rbacPermissions.features };
    const currentRoles = [...(newFeatures[feature][type] || [])];

    let updatedRoles;
    if (checked) {
      updatedRoles = Array.from(new Set([...currentRoles, role]));
    } else {
      updatedRoles = currentRoles.filter(r => r !== role);
    }

    newFeatures[feature] = {
      ...newFeatures[feature],
      [type]: updatedRoles
    };

    setRbacPermissions({
      ...rbacPermissions,
      features: newFeatures
    });
  };

  const handleRbacDeniedLoginsChange = (feature: string, val: string) => {
    if (!rbacPermissions) return;
    const newFeatures = { ...rbacPermissions.features };
    newFeatures[feature] = {
      ...newFeatures[feature],
      deniedLogins: val.split(',').map(s => s.trim()).filter(Boolean)
    };
    setRbacPermissions({
      ...rbacPermissions,
      features: newFeatures
    });
  };

  const handleSaveRbac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbacPermissions) return;
    setSaving(true);
    try {
      await api.post('/admin/settings/system', {
        settings: {
          rbac_permissions: rbacPermissions
        }
      });
      showToast('RBAC Access Permissions saved successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to save RBAC permissions.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {toast && (
        <div className="toast-container">
          <div className={`toast badge-${toast.type === 'success' ? 'success' : 'danger'}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Settings & Parameters</div>
          <div className="page-subtitle">Configure receipt branding, score split rules, and dynamic student metadata</div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tab-menu" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {(['fields', 'score', 'receipt', 'rbac'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 4px',
              cursor: 'pointer',
              fontSize: 15,
              borderBottom: activeTab === tab ? '2px solid var(--accent-400)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-400)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
            }}
          >
            {tab === 'fields' && 'Custom Metadata Fields'}
            {tab === 'score' && 'Score Splits (CA & Exam)'}
            {tab === 'receipt' && 'Branding & Paystack Settings'}
            {tab === 'rbac' && 'Role Access Control (RBAC)'}
          </button>
        ))}
      </div>

      {/* TAB 1: Custom Metadata Fields */}
      {activeTab === 'fields' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Form to create new field */}
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Add Custom Metadata Column</h3>
            </div>
            <form onSubmit={handleAddField} className="login-form">
              <div className="form-group">
                <label className="form-label">Target Profile</label>
                <select className="form-control" value={targetType} onChange={(e) => setTargetType(e.target.value as any)}>
                  <option value="student">Student Profile</option>
                  <option value="staff">Staff Profile</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Database Key Name (lowercase, no spaces)</label>
                <input
                  className="form-control"
                  placeholder="e.g. blood_group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Label</label>
                <input
                  className="form-control"
                  placeholder="e.g. Blood Group"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Field Input Type</label>
                <select className="form-control" value={fieldType} onChange={(e) => setFieldType(e.target.value as any)}>
                  <option value="text">Text Box</option>
                  <option value="number">Numeric Input</option>
                  <option value="select">Dropdown Selection</option>
                </select>
              </div>

              {fieldType === 'select' && (
                <div className="form-group">
                  <label className="form-label">Dropdown Options (comma separated)</label>
                  <input
                    className="form-control"
                    placeholder="e.g. A+, O+, B-, AB+"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="is-required"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="is-required" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Mark as Mandatory Field
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }}>
                Add to Setup List
              </button>
            </form>
          </div>

          {/* Right Column: Dynamic Preview lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Student Fields Card */}
            <div className="section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">Student Custom Columns ({studentFields.length})</h3>
                <button disabled={saving} onClick={() => handleSaveChanges('student')} className="btn btn-gold btn-sm">
                  Save Student Setup
                </button>
              </div>
              {studentFields.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No custom student fields defined. Click the form on the left to add one.</p>
              ) : (
                <table className="data-table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Column Label</th>
                      <th>Database Key</th>
                      <th>Input Type</th>
                      <th>Required?</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentFields.map(f => (
                      <tr key={f.name}>
                        <td style={{ fontWeight: 600 }}>{f.label}</td>
                        <td><code>{f.name}</code></td>
                        <td><span className="badge badge-info">{f.type}</span></td>
                        <td>
                          <span className={`badge badge-${f.required ? 'danger' : 'neutral'}`}>
                            {f.required ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleRemoveField('student', f.name)} className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger-500)' }}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Staff Fields Card */}
            <div className="section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">Staff Custom Columns ({staffFields.length})</h3>
                <button disabled={saving} onClick={() => handleSaveChanges('staff')} className="btn btn-gold btn-sm">
                  Save Staff Setup
                </button>
              </div>
              {staffFields.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No custom staff fields defined. Click the form on the left to add one.</p>
              ) : (
                <table className="data-table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Column Label</th>
                      <th>Database Key</th>
                      <th>Input Type</th>
                      <th>Required?</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffFields.map(f => (
                      <tr key={f.name}>
                        <td style={{ fontWeight: 600 }}>{f.label}</td>
                        <td><code>{f.name}</code></td>
                        <td><span className="badge badge-info">{f.type}</span></td>
                        <td>
                          <span className={`badge badge-${f.required ? 'danger' : 'neutral'}`}>
                            {f.required ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleRemoveField('staff', f.name)} className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger-500)' }}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Score Configuration */}
      {activeTab === 'score' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
          {/* Default split */}
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Default Score Split (System)</h3>
            </div>
            <form onSubmit={handleSaveSystemScore} className="login-form">
              <div className="form-group">
                <label className="form-label">CA Marks (out of 100)</label>
                <input
                  type="number"
                  className="form-control"
                  value={systemCaMax}
                  onChange={(e) => setSystemCaMax(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exam Marks (out of 100)</label>
                <input
                  type="number"
                  className="form-control"
                  value={systemExamMax}
                  onChange={(e) => setSystemExamMax(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>

              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Total: <span style={{ fontWeight: 700, color: systemCaMax + systemExamMax === 100 ? 'var(--success-500)' : 'var(--danger-500)' }}>{systemCaMax + systemExamMax} / 100</span>
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary">
                Save System Split
              </button>
            </form>
          </div>

          {/* Exceptions */}
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Exceptions Configurations (Faculties/Depts/Courses)</h3>
              <button onClick={() => {
                setExceptionScope('FACULTY');
                setExceptionScopeId(faculties[0]?.id || '');
                setExceptionCaMax(40);
                setExceptionExamMax(60);
                setShowExceptionModal(true);
              }} className="btn btn-gold btn-sm">
                Add Exception
              </button>
            </div>
            {scoreConfigs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', fontSize: 14 }}>No exception splits configured. System defaults will apply to all courses.</p>
            ) : (
              <table className="data-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Scope</th>
                    <th>Target Name</th>
                    <th>CA Max</th>
                    <th>Exam Max</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreConfigs.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}><span className="badge badge-info">{c.scope}</span></td>
                      <td style={{ fontWeight: 600 }}>{getScopeName(c.scope, c.scopeId)}</td>
                      <td>{c.caMax}</td>
                      <td>{c.examMax}</td>
                      <td>
                        <button onClick={() => handleDeleteConfigException(c.id!)} className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger-500)' }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Receipt Branding & System Parameters */}
      {activeTab === 'receipt' && (
        <div className="section-card" style={{ maxWidth: 800 }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Portal parameters & Receipt configuration</h3>
          </div>
          <form onSubmit={handleSaveReceiptBranding} className="login-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">University Name on Receipts</label>
                <input
                  className="form-control"
                  value={receiptUniName}
                  onChange={(e) => setReceiptUniName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Support Phones (comma separated)</label>
              <input
                className="form-control"
                value={receiptPhones}
                onChange={(e) => setReceiptPhones(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permanent University Address</label>
              <textarea
                className="form-control"
                rows={3}
                value={receiptPermAddr}
                onChange={(e) => setReceiptPermAddr(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary University Address (for first batch)</label>
              <textarea
                className="form-control"
                rows={3}
                value={receiptTempAddr}
                onChange={(e) => setReceiptTempAddr(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Receipt Footer Note</label>
              <textarea
                className="form-control"
                rows={3}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Paystack Charge Bearer</label>
                <select className="form-control" value={paystackBearer} onChange={(e) => setPaystackBearer(e.target.value)}>
                  <option value="account">University (Bears the charges)</option>
                  <option value="customer">Student (Bears the charges)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Off-Campus Hostel Applications</label>
                <select className="form-control" value={hostelOffcampus ? 'yes' : 'no'} onChange={(e) => setHostelOffcampus(e.target.value === 'yes')}>
                  <option value="yes">Allowed (Submit off-campus approvals)</option>
                  <option value="no">Disabled (All students must stay in hostels)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Application Fee (₦)</label>
                <input
                  type="number"
                  className="form-control"
                  value={applicationFee}
                  onChange={(e) => setApplicationFee(Number(e.target.value) || 0)}
                  min={0}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admission / Acceptance Fee (₦)</label>
                <input
                  type="number"
                  className="form-control"
                  value={admissionFee}
                  onChange={(e) => setAdmissionFee(Number(e.target.value) || 0)}
                  min={0}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 12 }}>
              Save Branding & Parameters
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: RBAC */}
      {activeTab === 'rbac' && rbacPermissions && (
        <div className="section-card" style={{ maxWidth: '100%' }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Dynamic Role-Based Access Control & Exclusions</h3>
          </div>
          <form onSubmit={handleSaveRbac}>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table className="data-table" style={{ fontSize: 13, minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Feature Category</th>
                    <th>Read / View Access Roles</th>
                    <th>Write / Edit Access Roles</th>
                    <th>Delete Access Roles</th>
                    <th>Explicitly Denied Logins (comma-separated staff IDs / emails)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rbacPermissions.features).map((featureKey) => {
                    const feature = rbacPermissions.features[featureKey];
                    const rolesList = [
                      'REGISTRY_STAFF', 'ADMISSIONS_STAFF', 'LECTURER', 'EXAMS_RECORDS_STAFF',
                      'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'BURSARY_STAFF', 'ICT_ADMIN',
                      'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'
                    ];

                    const featureLabels: Record<string, string> = {
                      students: '👤 Students Directory',
                      admissions: '📝 Admissions/Applicants',
                      staff: '💼 Staff & Lecturers',
                      finance: '💰 Fees & Bursary Payments',
                      academic_setup: '🏛️ Academic Setup (Faculties/Dept/Programs/Sessions)',
                      academic_records: '📊 Academic Records (Courses, Course Registrations, Splits)',
                      hostels: '🏨 Hostel Allocations',
                      user_management: '🔑 Staff Accounts Management',
                      settings: '⚙️ System Settings',
                      audit_logs: '📜 Security Audit Logs'
                    };

                    return (
                      <tr key={featureKey}>
                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: 14 }}>
                          {featureLabels[featureKey] || featureKey}
                        </td>

                        {/* Read Roles */}
                        <td style={{ verticalAlign: 'top', padding: '10px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.6 }}>
                              <input type="checkbox" checked disabled /> SUPER_ADMIN
                            </label>
                            {rolesList.map(role => (
                              <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <input
                                  type="checkbox"
                                  checked={feature.readRoles?.includes(role)}
                                  onChange={(e) => handleRbacCheckboxChange(featureKey, 'readRoles', role, e.target.checked)}
                                />
                                {role.replace(/_/g, ' ')}
                              </label>
                            ))}
                          </div>
                        </td>

                        {/* Write Roles */}
                        <td style={{ verticalAlign: 'top', padding: '10px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.6 }}>
                              <input type="checkbox" checked disabled /> SUPER_ADMIN
                            </label>
                            {rolesList.map(role => (
                              <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <input
                                  type="checkbox"
                                  checked={feature.writeRoles?.includes(role)}
                                  onChange={(e) => handleRbacCheckboxChange(featureKey, 'writeRoles', role, e.target.checked)}
                                />
                                {role.replace(/_/g, ' ')}
                              </label>
                            ))}
                          </div>
                        </td>

                        {/* Delete Roles */}
                        <td style={{ verticalAlign: 'top', padding: '10px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.6 }}>
                              <input type="checkbox" checked disabled /> SUPER_ADMIN
                            </label>
                            {rolesList.map(role => (
                              <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <input
                                  type="checkbox"
                                  checked={feature.deleteRoles?.includes(role)}
                                  onChange={(e) => handleRbacCheckboxChange(featureKey, 'deleteRoles', role, e.target.checked)}
                                />
                                {role.replace(/_/g, ' ')}
                              </label>
                            ))}
                          </div>
                        </td>

                        {/* Denied specific logins */}
                        <td style={{ verticalAlign: 'top', padding: '10px 8px' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. SU/REG/001, registrar@email.com"
                            value={(feature.deniedLogins || []).join(', ')}
                            onChange={(e) => handleRbacDeniedLoginsChange(featureKey, e.target.value)}
                            style={{ fontSize: 12, width: 220 }}
                          />
                          <small style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4, display: 'block', maxWidth: 220 }}>
                            Type comma-separated user login IDs/emails to explicitly restrict their access.
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 12 }}>
              Save RBAC Policy Settings
            </button>
          </form>
        </div>
      )}

      {/* Exception split modal */}
      {showExceptionModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add CA/Exam Split Exception</h3>
              <button onClick={() => setShowExceptionModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateException} className="login-form">
              <div className="form-group">
                <label className="form-label">Exception Scope</label>
                <select
                  className="form-control"
                  value={exceptionScope}
                  onChange={(e) => {
                    const sc = e.target.value as any;
                    setExceptionScope(sc);
                    if (sc === 'FACULTY') setExceptionScopeId(faculties[0]?.id || '');
                    if (sc === 'DEPARTMENT') setExceptionScopeId(departments[0]?.id || '');
                    if (sc === 'COURSE') setExceptionScopeId(courses[0]?.id || '');
                  }}
                >
                  <option value="FACULTY">Faculty Exception</option>
                  <option value="DEPARTMENT">Department Exception</option>
                  <option value="COURSE">Course Exception</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Name</label>
                {exceptionScope === 'FACULTY' && (
                  <select className="form-control" value={exceptionScopeId} onChange={(e) => setExceptionScopeId(e.target.value)}>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
                {exceptionScope === 'DEPARTMENT' && (
                  <select className="form-control" value={exceptionScopeId} onChange={(e) => setExceptionScopeId(e.target.value)}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
                {exceptionScope === 'COURSE' && (
                  <select className="form-control" value={exceptionScopeId} onChange={(e) => setExceptionScopeId(e.target.value)}>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">CA Marks (out of 100)</label>
                <input
                  type="number"
                  className="form-control"
                  value={exceptionCaMax}
                  onChange={(e) => setExceptionCaMax(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exam Marks (out of 100)</label>
                <input
                  type="number"
                  className="form-control"
                  value={exceptionExamMax}
                  onChange={(e) => setExceptionExamMax(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>

              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Total: <span style={{ fontWeight: 700, color: exceptionCaMax + exceptionExamMax === 100 ? 'var(--success-500)' : 'var(--danger-500)' }}>{exceptionCaMax + exceptionExamMax} / 100</span>
              </div>

              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button type="button" onClick={() => setShowExceptionModal(false)} className="btn btn-neutral">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">Add Split Exception</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
