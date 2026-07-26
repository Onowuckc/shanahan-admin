import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Students', path: '/students', icon: '🎓' },
      { label: 'Staff', path: '/staff', icon: '👨‍💼' },
      { label: 'Applicants', path: '/applicants', icon: '📋' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Faculties & Depts', path: '/academic/faculties', icon: '🏛️' },
      { label: 'Programmes', path: '/academic/programs', icon: '📚' },
      { label: 'O\'Level Requirements', path: '/academic/olevel', icon: '📝' },
      { label: 'Courses', path: '/academic/courses', icon: '📖' },
      { label: 'Sessions', path: '/academic/sessions', icon: '📅' },
      { label: 'Course Registrations', path: '/academic/registrations', icon: '✅' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Fee Categories', path: '/fees/categories', icon: '🏷️' },
      { label: 'Fee Structures', path: '/fees/structures', icon: '⚙️' },
      { label: 'Payments', path: '/payments', icon: '💳' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Hostel Management', path: '/hostels', icon: '🏠' },
      { label: 'Reports', path: '/reports', icon: '📈' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'User Management', path: '/users', icon: '👥' },
      { label: 'Audit Logs', path: '/audit-logs', icon: '🔒' },
      { label: 'Settings', path: '/settings', icon: '⚙️' },
      { label: 'My Profile', path: '/profile', icon: '👤' },
    ],
  },
];


export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'SU';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoImg} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div className="logo-text">
          <div className="logo-title">Shanahan University</div>
          <div className="logo-subtitle">UMIS Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-label">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive || location.pathname.startsWith(item.path) ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="flex items-center gap-2 mb-4" style={{ padding: '8px 4px' }}>
          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.username || 'Admin')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', gap: 8 }} onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
