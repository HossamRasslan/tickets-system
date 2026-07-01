import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'agent') { navigate('/'); return; }
    api.get('/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading reports…</div>;
  if (!stats) return null;

  const priorityColors = { Low:'var(--p-low)', Medium:'var(--p-medium)', High:'var(--p-high)', Urgent:'var(--p-urgent)' };
  const statusColors   = { 'Open':'var(--s-open)','In Progress':'var(--s-progress)','Pending Customer':'var(--s-pending)','Resolved':'var(--s-resolved)','Closed':'var(--s-closed)' };

  const resolved = (stats.byStatus['Resolved'] || 0) + (stats.byStatus['Closed'] || 0);
  const resolutionRate = stats.total ? Math.round((resolved / stats.total) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <p>System-wide complaint metrics and performance overview.</p>
      </div>
      <div className="page-body">
        <div className="stats-grid" style={{marginBottom:24}}>
          <div className="stat-card">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub">all time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolution Rate</div>
            <div className="stat-value" style={{color:'var(--success)'}}>{resolutionRate}%</div>
            <div className="stat-sub">{resolved} resolved or closed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg. Resolution</div>
            <div className="stat-value">{stats.avgResolutionHours}h</div>
            <div className="stat-sub">average time to resolve</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Tickets</div>
            <div className="stat-value" style={{color:'var(--s-open)'}}>{stats.byStatus['Open'] || 0}</div>
            <div className="stat-sub">awaiting action</div>
          </div>
        </div>

        <div className="grid-2" style={{marginBottom:24}}>
          <div className="card">
            <div style={{fontWeight:700, marginBottom:18, fontSize:14}}>Breakdown by Status</div>
            <div className="bar-chart">
              {Object.entries(stats.byStatus).map(([k, v]) => (
                <div className="bar-row" key={k}>
                  <div className="bar-label">{k}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{width: stats.total ? `${(v/stats.total)*100}%`:'0%', background: statusColors[k] || 'var(--primary)'}} />
                  </div>
                  <div className="bar-count">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{fontWeight:700, marginBottom:18, fontSize:14}}>Breakdown by Priority</div>
            <div className="bar-chart">
              {Object.entries(stats.byPriority).map(([k, v]) => (
                <div className="bar-row" key={k}>
                  <div className="bar-label">{k}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{width: stats.total ? `${(v/stats.total)*100}%`:'0%', background: priorityColors[k] || 'var(--primary)'}} />
                  </div>
                  <div className="bar-count">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:18, fontSize:14}}>Breakdown by Category</div>
          <div className="bar-chart">
            {Object.entries(stats.byCategory).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
              <div className="bar-row" key={k}>
                <div className="bar-label" style={{width:140}}>{k}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{width: stats.total ? `${(v/stats.total)*100}%`:'0%', background:'var(--accent)'}} />
                </div>
                <div className="bar-count">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}