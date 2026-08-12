import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockIcon, LogoutIcon, MenuIcon } from './Icons';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export default function Topbar({ title, subtitle, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.username || 'Admin';
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user?.username?.slice(0, 2).toUpperCase() || 'SU');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger-btn mobile-only"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MenuIcon size={20} />
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          {/* Avatar button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px 6px 6px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {user?.role?.replace(/_/g, ' ')}
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>▼</span>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: 200,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              {/* User info header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--surface-2)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.username}</div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <UserIcon size={14} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile', { state: { forcePasswordChange: false } }); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <LockIcon size={14} />
                  <span>Change Password</span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 0' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger-400)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <LogoutIcon size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
