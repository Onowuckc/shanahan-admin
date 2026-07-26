import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';

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
    { label: 'Total Students', value: fmtNum(overview?.totalStudents || 0), icon: '🎓', color: '#3d65b5', onClick: () => navigate('/students') },
    { label: 'Total Staff', value: fmtNum(overview?.totalStaff || 0), icon: '👨‍💼', color: '#8b5cf6', onClick: () => navigate('/staff') },
    { label: 'Faculties', value: fmtNum(overview?.totalFaculties || 0), icon: '🏛️', color: '#d4a017', onClick: () => navigate('/academic/faculties') },
    { label: 'Departments', value: fmtNum(overview?.totalDepartments || 0), icon: '📚', color: '#06b6d4', onClick: () => navigate('/academic/faculties') },
    { label: 'Total Collected', value: fmt(fin?.totalPaid || 0), icon: '💰', color: '#22c55e', onClick: () => navigate('/payments') },
    { label: 'Outstanding', value: fmt(fin?.totalOutstanding || 0), icon: '⏳', color: '#f59e0b', onClick: () => navigate('/payments') },
    { label: 'Pending Reg.', value: fmtNum(overview?.pendingRegistrations || 0), icon: '📝', color: '#ef4444', onClick: () => navigate('/academic/registrations') },
    { label: 'Hostel Pending', value: fmtNum(overview?.pendingHostelAllocations || 0), icon: '🏠', color: '#ec4899', onClick: () => navigate('/hostels') },
  ];

  return (
    <div className="animate-fade">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(212,160,23,0.15), transparent 70%)',
          borderRadius: '50%',
        }} />
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Welcome to Shanahan University UMIS 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            University Management Information System — Admin Portal
          </p>
        </div>
        {fin && (
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 24px',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-300)', lineHeight: 1 }}>
              {fin.collectionRate}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Collection Rate</div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{ '--kpi-color': kpi.color, cursor: 'pointer' } as any}
            onClick={kpi.onClick}
          >
            <div className="kpi-icon" style={{ color: kpi.color }}>{kpi.icon}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="level" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }}
              />
              <Bar dataKey="count" fill="#3d65b5" radius={[4, 4, 0, 0]} />
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
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No payment records yet</div>
            <div className="empty-state-desc">Payment records will appear here once students begin paying fees.</div>
          </div>
        )}
      </div>
    </div>
  );
}
