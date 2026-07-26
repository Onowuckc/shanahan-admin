import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview & Key Metrics' },
  '/students': { title: 'Students', subtitle: 'Student Records Management' },
  '/staff': { title: 'Staff', subtitle: 'Staff Profiles' },
  '/applicants': { title: 'Applicants', subtitle: 'Admission Applications' },
  '/academic/faculties': { title: 'Faculties & Departments', subtitle: 'Academic Structure' },
  '/academic/programs': { title: 'Programmes', subtitle: 'Degree Programmes' },
  '/academic/courses': { title: 'Courses', subtitle: 'Course Catalogue' },
  '/academic/sessions': { title: 'Academic Sessions', subtitle: 'Sessions & Semesters' },
  '/academic/registrations': { title: 'Course Registrations', subtitle: 'Approve or Reject Registrations' },
  '/fees/categories': { title: 'Fee Categories', subtitle: 'University Fee Types' },
  '/fees/structures': { title: 'Fee Structures', subtitle: 'Configure Fee Amounts' },
  '/payments': { title: 'Payments', subtitle: 'Payment Records & Receipts' },
  '/hostels': { title: 'Hostel Management', subtitle: 'Blocks & Allocations' },
  '/reports': { title: 'Reports', subtitle: 'Analytics & Export' },
  '/users': { title: 'User Management', subtitle: 'Portal Accounts & Roles' },
  '/audit-logs': { title: 'Audit Logs', subtitle: 'Security & Activity Trail' },
  '/settings': { title: 'Settings', subtitle: 'System Configuration' },
  '/profile': { title: 'My Profile', subtitle: 'Personal Info & Security' },
};

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <PageLayout />
    </div>
  );
}

function PageLayout() {
  const location = useLocation();
  const match = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );
  const { title, subtitle } = match?.[1] ?? { title: 'UMIS', subtitle: '' };

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}
