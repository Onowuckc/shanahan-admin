import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username / Matric Number / Staff ID</label>
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
            <label className="form-label">Password</label>
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
              '🔐 Sign In to Portal'
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
    </div>
  );
}
