import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import {
  StudentsIcon,
  StaffIcon,
  AcademicIcon,
  FinanceIcon,
  HostelsIcon,
  ReportsIcon,
  PaymentsIcon
} from '../components/Icons';

interface DashboardData {
  overview: {
    totalStudents: number;
    totalStaff: number;
    totalFaculties: number;
    totalDepartments: number;
    totalPaymentRecords: number;
    pendingRegistrations: number;
    pendingHostelAllocations: number;
  };
  financials: {
    totalDue: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  charts: {
    studentsByLevel: { level: string; count: number }[];
    paymentsByStatus: { status: string; count: number; amount: number }[];
  };
  recentPayments: any[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#22c55e',
  PARTIAL: '#f59e0b',
  PENDING: '#ef4444',
};

const fmt = (n: number) => n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
const fmtNum = (n: number) => n.toLocaleString();

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-page">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const overview = data?.overview;
  const fin = data?.financials;
  const charts = data?.charts;

  const kpis = [
    { label: 'Total Students', value: fmtNum(overview?.totalStudents || 0), icon: <StudentsIcon size={20} />, onClick: () => navigate('/students') },
    { label: 'Total Staff', value: fmtNum(overview?.totalStaff || 0), icon: <StaffIcon size={20} />, onClick: () => navigate('/staff') },
    { label: 'Faculties', value: fmtNum(overview?.totalFaculties || 0), icon: <AcademicIcon size={20} />, onClick: () => navigate('/academic/faculties') },
    { label: 'Departments', value: fmtNum(overview?.totalDepartments || 0), icon: <AcademicIcon size={20} />, onClick: () => navigate('/academic/faculties') },
    { label: 'Total Collected', value: fmt(fin?.totalPaid || 0), icon: <FinanceIcon size={20} />, onClick: () => navigate('/payments') },
    { label: 'Outstanding', value: fmt(fin?.totalOutstanding || 0), icon: <FinanceIcon size={20} />, onClick: () => navigate('/payments') },
    { label: 'Pending Reg.', value: fmtNum(overview?.pendingRegistrations || 0), icon: <ReportsIcon size={20} />, onClick: () => navigate('/academic/registrations') },
    { label: 'Hostel Pending', value: fmtNum(overview?.pendingHostelAllocations || 0), icon: <HostelsIcon size={20} />, onClick: () => navigate('/hostels') },
  ];

  return (
    <div className="animate-fade">
      {/* Opus Hero Welcome Banner */}
      <div className="hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 className="hero-title">Welcome to Shanahan University UMIS</h1>
            <p className="hero-subtitle">
              Centralized University Management Information System Administration & Analytics
            </p>
          </div>
          {fin && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 28px',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#FDE047', lineHeight: 1 }}>
                {fin.collectionRate}%
              </div>
              <div style={{ fontSize: 11, color: '#FCE7F3', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Fee Collection Rate</div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="stat-card-opus"
            style={{ cursor: 'pointer', padding: 20 }}
            onClick={kpi.onClick}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</span>
              <div className="stat-card-icon" style={{ width: 36, height: 36 }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Students by Level */}
        <div className="chart-wrapper">
          <div className="chart-title">Students by Level</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.studentsByLevel || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="level" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 8, color: '#1F1115' }}
              />
              <Bar dataKey="count" fill="#800020" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payments by Status */}
        <div className="chart-wrapper">
          <div className="chart-title">Payments by Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={charts?.paymentsByStatus || []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: any) => `${entry.status}: ${entry.count}`}
                labelLine={false}
              >
                {(charts?.paymentsByStatus || []).map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
              />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">Recent Payments</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payments')}>View All</button>
        </div>
        {data?.recentPayments && data.recentPayments.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Matric No.</th>
                  <th>Session</th>
                  <th>Semester</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p: any) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/payments/${p.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.student?.firstName} {p.student?.lastName}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.student?.matricNumber}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.session?.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.semester?.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success-500)' }}>{fmt(p.amountPaid)}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'PARTIAL' ? 'warning' : 'danger'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><PaymentsIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No payment records yet</div>
            <div className="empty-state-desc">Payment records will appear here once students begin paying fees.</div>
          </div>
        )}
      </div>
    </div>
  );
}
