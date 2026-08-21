import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';
import { AlertIcon } from '../components/Icons';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitting(true);
    setForgotMessage(null);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMessage('If an account associated with this email exists, a password reset link has been dispatched to your inbox.');
    } catch (err: any) {
      setForgotMessage('If an account associated with this email exists, a password reset link has been dispatched to your inbox.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logoImg} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 16 }} />
          <h1 className="login-title">Shanahan University</h1>
          <p className="login-subtitle">Management Information System — Admin Portal</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: 14,
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertIcon size={18} color="var(--danger-500)" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username / Email / Staff ID</label>
            <input
              id="login-username"
              type="text"
              className="form-control"
              placeholder="e.g. admin@shanahanuni.edu.ng or SU/ADM/001"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotMessage(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-300)', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-gold login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
            ) : (
              'Sign In to Portal'
            )}
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            For portal support, contact{' '}
            <a href="mailto:ict@shanahanuni.edu.ng" style={{ color: 'var(--accent-300)' }}>
              ict@shanahanuni.edu.ng
            </a>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            © {new Date().getFullYear()} Shanahan University. All rights reserved.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Your Password</h3>
              <button className="modal-close" onClick={() => setShowForgotModal(false)}>✕</button>
            </div>
            <form onSubmit={handleForgotSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Enter your registered institutional email address. We will send a secure password reset link to your inbox.
                </p>
                {forgotMessage && (
                  <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-400)', fontSize: 13 }}>
                    {forgotMessage}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. name@shanahanuni.edu.ng"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForgotModal(false)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={forgotSubmitting}>
                  {forgotSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
