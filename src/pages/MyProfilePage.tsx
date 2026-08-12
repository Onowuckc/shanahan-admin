import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockIcon, SaveIcon, CheckIcon } from '../components/Icons';

export default function MyProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load current profile info
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      const { user: u, profile } = data;
      setProfileForm({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: u.email || '',
        phoneNumber: profile?.phoneNumber || '',
      });
    }).catch(() => {});
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.put('/auth/me', {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
      });
      await refreshUser();
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update profile.', 'danger');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match.', 'danger');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'danger');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to change password.', 'danger');
    } finally {
      setPwLoading(false);
    }
  };

  const roleLabel = (role: string) => role.replace(/_/g, ' ');

  return (
    <div className="animate-fade">
      {toast && (
        <div className="toast-container">
          <div className={`toast badge-${toast.type === 'success' ? 'success' : 'danger'}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* No forced change banner — staff manage passwords at their own discretion */}

      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-subtitle">Update your personal info and account security settings</div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#fff',
            fontWeight: 700,
          }}>
            {(profileForm.firstName?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {profileForm.firstName} {profileForm.lastName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {user?.username} &bull; <span style={{ color: 'var(--accent-400)' }}>{roleLabel(user?.role || '')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {(['profile', 'security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-400)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-400)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: -1,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {tab === 'profile' ? <><UserIcon size={14} /> Personal Info</> : <><LockIcon size={14} /> Security &amp; Password</>}
            </span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 560 }}>

        {/* ─── PROFILE TAB ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Personal Information</h3>
            </div>
            <form onSubmit={handleProfileSubmit} style={{ padding: '0 0 4px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-control"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-control"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-control"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="email@shanahanuni.edu.ng"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  placeholder="080xxxxxxxx"
                />
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Staff ID / Username</label>
                <input
                  className="form-control"
                  value={user?.username || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  Staff ID cannot be changed. Contact ICT if this needs updating.
                </small>
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">System Role</label>
                <input
                  className="form-control"
                  value={roleLabel(user?.role || '')}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  Role assignments are managed by the SUPER_ADMIN / ICT.
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileLoading}
                style={{ marginTop: 8 }}
              >
                {profileLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : <><SaveIcon size={14} /><span style={{marginLeft:5}}>Save Changes</span></>}
              </button>
            </form>
          </div>
        )}

        {/* ─── SECURITY TAB ─────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Your current password"
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Password strength hints */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Password requirements:</strong>
                <ul style={{ margin: '6px 0 0 16px', lineHeight: 1.8 }}>
                    <li style={{ color: pwForm.newPassword.length >= 8 ? 'var(--success-400)' : 'inherit' }}>
                      {pwForm.newPassword.length >= 8 ? <CheckIcon size={13} color="var(--success-400)" /> : <span style={{ color: 'var(--text-muted)' }}>○</span>} At least 8 characters
                    </li>
                    <li style={{ color: /[A-Z]/.test(pwForm.newPassword) ? 'var(--success-400)' : 'inherit' }}>
                      {/[A-Z]/.test(pwForm.newPassword) ? <CheckIcon size={13} color="var(--success-400)" /> : <span style={{ color: 'var(--text-muted)' }}>○</span>} At least one uppercase letter
                    </li>
                    <li style={{ color: /[0-9]/.test(pwForm.newPassword) ? 'var(--success-400)' : 'inherit' }}>
                      {/[0-9]/.test(pwForm.newPassword) ? <CheckIcon size={13} color="var(--success-400)" /> : <span style={{ color: 'var(--text-muted)' }}>○</span>} At least one number
                    </li>
                    <li style={{ color: pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword ? 'var(--success-400)' : 'inherit' }}>
                      {pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword ? <CheckIcon size={13} color="var(--success-400)" /> : <span style={{ color: 'var(--text-muted)' }}>○</span>} Passwords match
                    </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-gold"
                disabled={pwLoading}
                style={{ width: '100%' }}
              >
                {pwLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating...</> : <><LockIcon size={14} /><span style={{marginLeft:5}}>Update Password</span></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
