// Placeholder pages for modules to be built out in subsequent phases
// Each exports a simple page component with the module title and a coming soon card

export function StaffPage() {
  return <PlaceholderPage icon="👨‍💼" title="Staff Management" desc="Manage academic and administrative staff profiles, roles, and course assignments." />;
}
export function ApplicantsPage() {
  return <PlaceholderPage icon="📋" title="Applicants" desc="View and manage admission applications, update statuses, and review submitted documents." />;
}
export function ProgramsPage() {
  return <PlaceholderPage icon="📚" title="Programmes" desc="Manage degree programmes, durations, and department associations." />;
}
export function CoursesPage() {
  return <PlaceholderPage icon="📖" title="Courses" desc="Manage the university course catalogue, credit units, and lecturer assignments." />;
}
export function CourseRegistrationsPage() {
  return <PlaceholderPage icon="✅" title="Course Registrations" desc="Review and approve or reject student course registration requests." />;
}
export function FeeStructuresPage() {
  return <PlaceholderPage icon="⚙️" title="Fee Structures" desc="Configure fee amounts per session, semester, level, faculty, or department." />;
}
export function HostelsPage() {
  return <PlaceholderPage icon="🏠" title="Hostel Management" desc="Manage hostel blocks, capacities, and student allocation requests." />;
}
export function ReportsPage() {
  return <PlaceholderPage icon="📈" title="Reports & Analytics" desc="Generate financial and academic reports, export to Excel and PDF." />;
}
export function UsersPage() {
  return <PlaceholderPage icon="👥" title="User Management" desc="Create and manage portal user accounts and role assignments." />;
}
export function AuditLogsPage() {
  return <PlaceholderPage icon="🔒" title="Audit Logs" desc="Review all system activity, security events, and admin actions." />;
}
export function SettingsPage() {
  return <PlaceholderPage icon="⚙️" title="Settings" desc="Configure system-wide settings, branding, and university details." />;
}

function PlaceholderPage({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="animate-fade">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 96, height: 96,
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))',
          border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, marginBottom: 24,
          boxShadow: 'var(--shadow-md)',
        }}>{icon}</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6 }}>{desc}</p>
        <div style={{
          marginTop: 32,
          background: 'rgba(212,160,23,0.1)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          fontSize: 13,
          color: 'var(--accent-300)',
          fontWeight: 600,
        }}>
          🚧 This module is in active development — coming in the next phase
        </div>
      </div>
    </div>
  );
}
