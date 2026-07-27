import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import FacultiesPage from './pages/FacultiesPage';
import SessionsPage from './pages/SessionsPage';
import PaymentsPage from './pages/PaymentsPage';
import FeeCategoriesPage from './pages/FeeCategoriesPage';
import StaffPage from './pages/StaffPage';
import ApplicantsPage from './pages/ApplicantsPage';
import ProgramsPage from './pages/ProgramsPage';
import CoursesPage from './pages/CoursesPage';
import CourseRegistrationsPage from './pages/CourseRegistrationsPage';
import FeeStructuresPage from './pages/FeeStructuresPage';
import HostelsPage from './pages/HostelsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import MyProfilePage from './pages/MyProfilePage';
import OLevelRequirementsPage from './pages/OLevelRequirementsPage';
import BiodataRequestsPage from './pages/BiodataRequestsPage';


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — Admin Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* People */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/applicants" element={<ApplicantsPage />} />
            <Route path="/biodata-requests" element={<BiodataRequestsPage />} />

            {/* Academic */}
            <Route path="/academic/faculties" element={<FacultiesPage />} />
            <Route path="/academic/programs" element={<ProgramsPage />} />
            <Route path="/academic/olevel" element={<OLevelRequirementsPage />} />
            <Route path="/academic/courses" element={<CoursesPage />} />
            <Route path="/academic/sessions" element={<SessionsPage />} />
            <Route path="/academic/registrations" element={<CourseRegistrationsPage />} />

            {/* Finance */}
            <Route path="/fees/categories" element={<FeeCategoriesPage />} />
            <Route path="/fees/structures" element={<FeeStructuresPage />} />
            <Route path="/payments" element={<PaymentsPage />} />

            {/* Operations */}
            <Route path="/hostels" element={<HostelsPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* System */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
