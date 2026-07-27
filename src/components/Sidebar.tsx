import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL_ROLES = [
  'SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF',
  'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER',
  'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT'
];

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: ALL_ROLES },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Students', path: '/students', icon: '🎓', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT', 'ADMISSIONS_STAFF'] },
      { label: 'Staff', path: '/staff', icon: '👨‍💼', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'UNIVERSITY_MANAGEMENT', 'BURSARY_STAFF'] },
      { label: 'Applicants', path: '/applicants', icon: '📋', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'ADMISSIONS_STAFF', 'REGISTRY_STAFF', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Biodata Requests', path: '/biodata-requests', icon: '📄', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF'] },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Faculties & Depts', path: '/academic/faculties', icon: '🏛️', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'FACULTY_OFFICER', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Programmes', path: '/academic/programs', icon: '📚', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'O\'Level Requirements', path: '/academic/olevel', icon: '📝', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF'] },
      { label: 'Courses', path: '/academic/courses', icon: '📖', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER'] },
      { label: 'Sessions', path: '/academic/sessions', icon: '📅', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF'] },
      { label: 'Course Registrations', path: '/academic/registrations', icon: '✅', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER'] },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Fee Categories', path: '/fees/categories', icon: '🏷️', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF'] },
      { label: 'Fee Structures', path: '/fees/structures', icon: '⚙️', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF'] },
      { label: 'Payments', path: '/payments', icon: '💳', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF', 'UNIVERSITY_MANAGEMENT'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Hostel Management', path: '/hostels', icon: '🏠', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'HOSTEL_ADMIN', 'STUDENT_AFFAIRS_STAFF', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Reports', path: '/reports', icon: '📈', roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'UNIVERSITY_MANAGEMENT'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'User Management', path: '/users', icon: '👥', roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'Audit Logs', path: '/audit-logs', icon: '🔒', roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'Settings', path: '/settings', icon: '⚙️', roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'My Profile', path: '/profile', icon: '👤', roles: ALL_ROLES },
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

  const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
  const isAllowed = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return userRoles.some((r) => item.roles!.includes(r));
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
        {navSections.map((section) => {
          const visibleItems = section.items.filter(isAllowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="nav-section">
              <div className="nav-section-label">{section.title}</div>
              {visibleItems.map((item) => (
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
          );
        })}
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
