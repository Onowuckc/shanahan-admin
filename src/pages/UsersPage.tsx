import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, RefreshIcon, KeyIcon, RolesIcon, TrashIcon, AlertIcon, ShieldIcon, CheckIcon, EditIcon, CrossIcon, PlusIcon } from '../components/Icons';


const ALL_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ICT_ADMIN',
  'REGISTRY_STAFF',
  'ADMISSIONS_STAFF',
  'BURSARY_STAFF',
  'EXAMS_RECORDS_STAFF',
  'FACULTY_OFFICER',
  'DEPARTMENT_OFFICER',
  'STUDENT_AFFAIRS_STAFF',
  'HOSTEL_ADMIN',
  'UNIVERSITY_MANAGEMENT',
  'LECTURER',
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'danger',
  ICT_ADMIN: 'danger',
  BURSARY_STAFF: 'success',
  REGISTRY_STAFF: 'info',
  ADMISSIONS_STAFF: 'info',
  EXAMS_RECORDS_STAFF: 'warning',
  FACULTY_OFFICER: 'neutral',
  DEPARTMENT_OFFICER: 'neutral',
  STUDENT_AFFAIRS_STAFF: 'neutral',
  HOSTEL_ADMIN: 'warning',
  UNIVERSITY_MANAGEMENT: 'success',
  LECTURER: 'info',
};

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  phoneNumber: string | null;
  user: {
    id: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    isClaimed: boolean;
    isFirstLogin: boolean;
    createdAt: string;
  };
}

interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  staffId: string;
  role: string;
  roles: string[];
  phoneNumber: string;
  departmentId: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AdminUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdminUser | null>(null);
  const [showResetModal, setShowResetModal] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<AdminUser | null>(null);

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    firstName: '', lastName: '', email: '', staffId: '', role: 'REGISTRY_STAFF', roles: ['REGISTRY_STAFF'], phoneNumber: '', departmentId: '',
  });
  const [editForm, setEditForm] = useState<{
    firstName: string; lastName: string; email: string; phoneNumber: string; departmentId: string; roles: string[];
  }>({
    firstName: '', lastName: '', email: '', phoneNumber: '', departmentId: '', roles: []
  });
  const [resetPassword, setResetPassword] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
    } catch (e: any) {
      console.error(e);
      showToast('Failed to load users.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  // ─── CREATE USER ────────────────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.roles || createForm.roles.length === 0) {
      showToast('At least one role must be selected.', 'danger');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/admin/users', createForm);
      showToast(`User ${createForm.staffId} created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ firstName: '', lastName: '', email: '', staffId: '', role: 'REGISTRY_STAFF', roles: ['REGISTRY_STAFF'], phoneNumber: '', departmentId: '' });
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create user.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── EDIT USER ──────────────────────────────────────────────────────────────
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editForm.roles || editForm.roles.length === 0) {
      showToast('At least one role must be selected.', 'danger');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${showEditModal.user.id}`, editForm);
      showToast(`User ${showEditModal.staffId} updated successfully!`);
      setShowEditModal(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update user.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── DELETE USER ────────────────────────────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${showDeleteModal.user.id}`);
      showToast(`User account ${showDeleteModal.staffId} deleted successfully.`);
      setShowDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete user account.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── FORCE RESET PASSWORD ────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!showResetModal || !resetPassword) return;
    if (resetPassword.length < 8) { showToast('Password must be at least 8 characters.', 'danger'); return; }
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${showResetModal.user.id}/reset-password`, { newPassword: resetPassword });
      showToast(`Password reset for ${showResetModal.firstName} ${showResetModal.lastName}.`);
      setShowResetModal(null);
      setResetPassword('');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to reset password.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── CHANGE ROLE ─────────────────────────────────────────────────────────────
  const handleChangeRole = async () => {
    if (!showRoleModal || newRoles.length === 0) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${showRoleModal.user.id}/role`, { roles: newRoles });
      showToast(`Roles updated successfully.`);
      setShowRoleModal(null);
      setNewRoles([]);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update roles.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const roleLabel = (r: string) => r.replace(/_/g, ' ');

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
          <div className="page-title">Administrative Users</div>
          <div className="page-subtitle">Manage portal logins for all admin roles: Bursary, Registry, Hostel Admin, ICT, etc.</div>
        </div>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreateModal(true)}>
          <PlusIcon size={14} /> Create New User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Search by name, email, staff ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: 220 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ALL_ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={fetchUsers} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Role legend chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {ALL_ADMIN_ROLES.map((r) => {
          const count = users.filter(u => u.user.role === r || (u.user as any).roles?.includes(r)).length;
          if (count === 0) return null;
          return (
            <span
              key={r}
              className={`badge badge-${ROLE_COLORS[r] || 'neutral'}`}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
            >
              {roleLabel(r)} ({count})
            </span>
          );
        })}
      </div>

      {/* Users table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading user list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><UsersIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No users found</div>
            <div className="empty-state-desc">Try adjusting your search or create a new user.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Staff ID / Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>First Login?</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-700), var(--accent-700))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.phoneNumber || 'No phone'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', color: 'var(--primary-200)', fontWeight: 600, fontSize: 13 }}>{u.staffId}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.user.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {((u.user as any).roles || [u.user.role]).map((r: string) => (
                        <span key={r} className={`badge badge-${ROLE_COLORS[r] || 'neutral'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${u.user.isEmailVerified ? 'success' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {u.user.isEmailVerified ? <><CheckIcon size={12} /> Active</> : <><AlertIcon size={12} /> Pending</>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.user.isFirstLogin ? 'warning' : 'neutral'}`} style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {u.user.isFirstLogin ? <><AlertIcon size={12} /> Must Change PW</> : 'No'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {/* Edit Account details — SUPER_ADMIN or ICT_ADMIN */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Edit account details"
                        onClick={() => {
                          setShowEditModal(u);
                          setEditForm({
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.user.email,
                            phoneNumber: u.phoneNumber || '',
                            departmentId: (u as any).departmentId || '',
                            roles: (u.user as any).roles || [u.user.role],
                          });
                        }}
                        style={{ fontSize: 12 }}
                      >
                        <EditIcon size={14} /><span style={{ marginLeft: 4 }}>Edit</span>
                      </button>

                      {/* Reset password — SUPER_ADMIN or ICT_ADMIN */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Force password reset"
                        onClick={() => { setShowResetModal(u); setResetPassword(''); }}
                        style={{ fontSize: 12 }}
                      >
                        <KeyIcon size={13} /> Reset PW
                      </button>

                      {/* Change role — SUPER_ADMIN only */}
                      {isSuperAdmin && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Change role"
                          onClick={() => { setShowRoleModal(u); setNewRoles((u.user as any).roles || [u.user.role]); }}
                          style={{ fontSize: 12 }}
                        >
                          <RolesIcon size={13} /> Roles
                        </button>
                      )}

                      {/* Delete User — SUPER_ADMIN (cannot delete self) */}
                      {isSuperAdmin && currentUser?.id !== u.user.id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete user account"
                          onClick={() => setShowDeleteModal(u)}
                          style={{ fontSize: 12, color: 'var(--danger-400)' }}
                        >
                          <TrashIcon size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── CREATE USER MODAL ─────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Admin User</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-control" required value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} placeholder="First name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-control" required value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} placeholder="Last name" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-control" type="email" required value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="staff@shanahanuni.edu.ng" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Staff ID *</label>
                  <input className="form-control" required value={createForm.staffId}
                    onChange={(e) => setCreateForm({ ...createForm, staffId: e.target.value })} placeholder="e.g. SU/BRS/002" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" type="tel" value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })} placeholder="080xxxxxxxx" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">System Roles *</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 16px',
                  padding: '12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)'
                }}>
                  {ALL_ADMIN_ROLES.map((r) => {
                    const isChecked = createForm.roles?.includes(r);
                    return (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          style={{ width: 15, height: 15 }}
                          onChange={(e) => {
                            let updatedRoles = [...(createForm.roles || [])];
                            if (e.target.checked) {
                              updatedRoles.push(r);
                            } else {
                              updatedRoles = updatedRoles.filter(x => x !== r);
                            }
                            setCreateForm({
                              ...createForm,
                              roles: updatedRoles,
                              role: updatedRoles[0] || 'REGISTRY_STAFF'
                            });
                          }}
                        />
                        {roleLabel(r)}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <ShieldIcon size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>The user's initial password will be set to the value in <code>SEED_DEFAULT_PASSWORD</code> (.env). They will be required to change it on first login.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating...</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD MODAL ──────────────────────────────────── */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Force Reset Password</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowResetModal(null)}><CrossIcon size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Resetting password for <strong>{showResetModal.firstName} {showResetModal.lastName}</strong> ({showResetModal.staffId}).
              They will be required to change it on next login.
            </p>
            <div className="form-group">
              <label className="form-label">New Temporary Password</label>
              <input
                className="form-control"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowResetModal(null)}>Cancel</button>
              <button className="btn btn-gold" disabled={actionLoading} onClick={handleResetPassword}>
                {actionLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Resetting...</> : <><KeyIcon size={14} /><span style={{marginLeft:4}}>Reset Password</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHANGE ROLE MODAL ─────────────────────────────────────── */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Manage System Roles</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRoleModal(null)}><CrossIcon size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Configure assigned system roles for <strong>{showRoleModal.firstName} {showRoleModal.lastName}</strong> ({showRoleModal.staffId}).
            </p>
            <div className="form-group">
              <label className="form-label">System Roles</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 16px',
                padding: '12px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-md)',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-default)'
              }}>
                {ALL_ADMIN_ROLES.map((r) => {
                  const isChecked = newRoles.includes(r);
                  return (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        style={{ width: 15, height: 15 }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoles([...newRoles, r]);
                          } else {
                            setNewRoles(newRoles.filter(x => x !== r));
                          }
                        }}
                      />
                      {roleLabel(r)}
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setShowRoleModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading || newRoles.length === 0} onClick={handleChangeRole}>
                {actionLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Updating...</> : <><RolesIcon size={14} /><span style={{marginLeft:4}}>Update Roles</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── EDIT USER MODAL ───────────────────────────────────────── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Admin User ({showEditModal.staffId})</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(null)}><CrossIcon size={16} /></button>
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-control" required value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="First name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-control" required value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Last name" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-control" type="email" required value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="staff@shanahanuni.edu.ng" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" type="tel" value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} placeholder="080xxxxxxxx" />
              </div>

              <div className="form-group">
                <label className="form-label">System Roles *</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 16px',
                  padding: '12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)'
                }}>
                  {ALL_ADMIN_ROLES.map((r) => {
                    const isChecked = editForm.roles?.includes(r);
                    return (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          style={{ width: 15, height: 15 }}
                          onChange={(e) => {
                            let updatedRoles = [...(editForm.roles || [])];
                            if (e.target.checked) {
                              updatedRoles.push(r);
                            } else {
                              updatedRoles = updatedRoles.filter(x => x !== r);
                            }
                            setEditForm({
                              ...editForm,
                              roles: updatedRoles,
                            });
                          }}
                        />
                        {roleLabel(r)}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE USER CONFIRMATION MODAL ───────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertIcon size={20} color="var(--danger-400)" /> Confirm User Deletion
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteModal(null)}><CrossIcon size={16} /></button>
            </div>
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                Are you sure you want to permanently delete the user account for <strong>{showDeleteModal.firstName} {showDeleteModal.lastName}</strong>?
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
                <div><strong>Staff ID:</strong> {showDeleteModal.staffId}</div>
                <div><strong>Email:</strong> {showDeleteModal.user.email}</div>
                <div><strong>Role:</strong> {showDeleteModal.user.role}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <AlertIcon size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Warning: This action cannot be undone and will permanently remove all user credentials and associated profiles.</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionLoading} onClick={handleDeleteUser}>
                {actionLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Deleting...</> : <><TrashIcon size={14} /><span style={{marginLeft:4}}>Delete User Account</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
