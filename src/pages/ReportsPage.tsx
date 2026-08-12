import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleExport = async (reportType: string) => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      if (reportType === 'Students') {
        csvContent += "Matric Number,First Name,Last Name,Level,Department\n";
        const res = await api.get('/admin/students?limit=1000');
        const students = res.data.data || [];
        students.forEach((s: any) => {
          csvContent += `"${s.matricNumber || ''}","${s.firstName || ''}","${s.lastName || ''}","${s.level || ''}","${s.department?.name || ''}"\n`;
        });
      } else if (reportType === 'Finance') {
        csvContent += "Payment Reference,Student,Amount Paid,Status,Date\n";
        const res = await api.get('/admin/payments?limit=1000');
        const payments = res.data.data || [];
        payments.forEach((p: any) => {
          const studentName = p.student ? `${p.student.firstName} ${p.student.lastName}` : 'N/A';
          csvContent += `"${p.txReference || p.id}","${studentName}","${p.amountPaid}","${p.status}","${p.createdAt?.split('T')[0] || ''}"\n`;
        });
      } else {
        csvContent += "Staff ID,First Name,Last Name,Role,Department\n";
        const res = await api.get('/admin/staff?limit=1000');
        const staffList = res.data.data || [];
        staffList.forEach((st: any) => {
          csvContent += `"${st.staffId || ''}","${st.firstName || ''}","${st.lastName || ''}","${st.user?.role || ''}","${st.department?.name || ''}"\n`;
        });
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `shanahan_${reportType.toLowerCase()}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Failed to export report.');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const overview = stats?.overview || {};
  const financials = stats?.financials || {};

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Generate exports, track financial performance, and review university metrics</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        {/* Export Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-card-header">
              <h3 className="section-card-title">Downloadable Reports</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Student Enrolment List</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All registered student profiles</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ fontWeight: 700, color: '#4A0E17' }} onClick={() => handleExport('Students')}>Export CSV</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Financial Receipts Ledger</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tuition and hostel fee receipts</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ fontWeight: 700, color: '#4A0E17' }} onClick={() => handleExport('Finance')}>Export CSV</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Staff Register</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lecturers & admin staff listings</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ fontWeight: 700, color: '#4A0E17' }} onClick={() => handleExport('Staff')}>Export CSV</button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="section-card" style={{ margin: 0 }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Institutional Overview Summary</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Students Profiled</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--primary-200)' }}>{overview.totalStudents || 0}</div>
            </div>

            <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Staff Registered</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--primary-200)' }}>{overview.totalStaff || 0}</div>
            </div>

            <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tuition Collection rate</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--success-500)' }}>{financials.collectionRate || 0}%</div>
            </div>

            <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pending Course Registrations</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--warning-500)' }}>{overview.pendingRegistrations || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
