import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';
import {
  DashboardIcon,
  StudentsIcon,
  StaffIcon,
  ApplicantsIcon,
  AcademicIcon,
  FinanceIcon,
  HostelsIcon,
  ReportsIcon,
  SettingsIcon,
  LogoutIcon,
  CrossIcon
} from './Icons';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
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
      { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon size={18} />, roles: ALL_ROLES },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Students', path: '/students', icon: <StudentsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'STUDENT_AFFAIRS_STAFF', 'HOSTEL_ADMIN', 'UNIVERSITY_MANAGEMENT', 'ADMISSIONS_STAFF'] },
      { label: 'Staff', path: '/staff', icon: <StaffIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'UNIVERSITY_MANAGEMENT', 'BURSARY_STAFF'] },
      { label: 'Applicants', path: '/applicants', icon: <ApplicantsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'ADMISSIONS_STAFF', 'REGISTRY_STAFF', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Biodata Requests', path: '/biodata-requests', icon: <ApplicantsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF'] },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'Faculties & Depts', path: '/academic/faculties', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'FACULTY_OFFICER', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Programmes', path: '/academic/programs', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'O\'Level Requirements', path: '/academic/olevel', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'ADMISSIONS_STAFF'] },
      { label: 'Courses', path: '/academic/courses', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER'] },
      { label: 'Sessions', path: '/academic/sessions', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF'] },
      { label: 'Course Registrations', path: '/academic/registrations', icon: <AcademicIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY_STAFF', 'EXAMS_RECORDS_STAFF', 'FACULTY_OFFICER', 'DEPARTMENT_OFFICER'] },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Fee Categories', path: '/fees/categories', icon: <FinanceIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF'] },
      { label: 'Fee Structures', path: '/fees/structures', icon: <FinanceIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF'] },
      { label: 'Payments', path: '/payments', icon: <FinanceIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF', 'UNIVERSITY_MANAGEMENT'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Hostel Management', path: '/hostels', icon: <HostelsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'HOSTEL_ADMIN', 'STUDENT_AFFAIRS_STAFF', 'UNIVERSITY_MANAGEMENT'] },
      { label: 'Reports', path: '/reports', icon: <ReportsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'BURSARY_STAFF', 'EXAMS_RECORDS_STAFF', 'UNIVERSITY_MANAGEMENT'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'User Management', path: '/users', icon: <StaffIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'Audit Logs', path: '/audit-logs', icon: <SettingsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon size={18} />, roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { label: 'My Profile', path: '/profile', icon: <StaffIcon size={18} />, roles: ALL_ROLES },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);

  const initials = user?.firstName
    ? user.firstName[0].toUpperCase()
    : (user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD');

  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles) return true;
    return itemRoles.some((r) => userRoles.includes(r));
  };

  return (
    <aside className={`sidebar sidebar-drawer ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="sidebar-logo">
          <img src={logoImg} alt="Shanahan Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--primary-200)' }}>SHANAHAN</div>
            <div style={{ fontSize: 9, color: 'var(--accent-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Admin Portal</div>
          </div>
        </div>
        {onClose && (
          <button 
            className="mobile-only" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CrossIcon size={18} />
          </button>
        )}
      </div>

      <div className="sidebar-nav">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => hasAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="nav-section">
              <div className="nav-section-title" style={{ fontSize: 10, color: 'var(--accent-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', padding: '12px 16px 4px' }}>
                {section.title}
              </div>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

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
        <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, color: 'var(--danger-400)' }} onClick={handleLogout}>
          <LogoutIcon size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
