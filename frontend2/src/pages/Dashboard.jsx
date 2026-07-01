import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import api from '../api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tickets'),
      user.role !== 'agent' ? api.get('/stats') : Promise.resolve(null)
    ]).then(([tRes, sRes]) => {
      setTickets(tRes.data);
      if (sRes) setStats(sRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="spinner">Loading…</div>;

  const recent   = tickets.slice(0, 8);
  const open     = tickets.filter(t => t.status === 'Open').length;
  const urgent   = tickets.filter(t => t.priority === 'Urgent').length;
  const inProg   = tickets.filter(t => t.status === 'In Progress').length;
  const resolved = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <>
      <div className="page-header">
        <h2>Welcome back, {user.name.split(' ')[0]} 👋</h2>
        <p>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{tickets.length}</div>
            <div className="stat-sub">{user.role === 'agent' ? 'submitted by you' : 'in the system'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value" style={{color:'var(--s-open)'}}>{open}</div>
            <div className="stat-sub">awaiting action</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{color:'var(--s-progress)'}}>{inProg}</div>
            <div className="stat-sub">being handled</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{user.role === 'agent' ? 'Resolved' : 'Urgent'}</div>
            <div className="stat-value" style={{color: user.role === 'agent' ? 'var(--success)' : 'var(--danger)'}}>
              {user.role === 'agent' ? resolved : urgent}
            </div>
            <div className="stat-sub">{user.role === 'agent' ? 'tickets closed' : 'need immediate attention'}</div>
          </div>
        </div>

        {stats && (
          <div className="grid-2" style={{marginBottom: 24}}>
            <div className="card">
              <div style={{fontWeight:700, marginBottom:14, fontSize:14}}>Tickets by Status</div>
              <div className="bar-chart">
                {Object.entries(stats.byStatus).filter(([,v])=>v>0).map(([k,v]) => (
                  <div className="bar-row" key={k}>
                    <div className="bar-label">{k}</div>
                    <div className="bar-track"><div className="bar-fill" style={{width:`${(v/stats.total)*100}%`}} /></div>
                    <div className="bar-count">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{fontWeight:700, marginBottom:14, fontSize:14}}>Tickets by Category</div>
              <div className="bar-chart">
                {Object.entries(stats.byCategory).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
                  <div className="bar-row" key={k}>
                    <div className="bar-label">{k}</div>
                    <div className="bar-track"><div className="bar-fill" style={{width:`${(v/stats.total)*100}%`, background:'var(--accent)'}} /></div>
                    <div className="bar-count">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <div style={{fontWeight:700, fontSize:14}}>Recent Tickets</div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tickets')}>View all</button>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎫</div>
              <p>No tickets yet. {user.role === 'agent' && 'Submit your first one!'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Title</th><th>Priority</th><th>Status</th>
                    {user.role !== 'agent' && <th>Submitted by</th>}
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(t => (
                    <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                      <td><span className="ticket-id">{t.id}</span></td>
                      <td style={{maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      {user.role !== 'agent' && <td style={{color:'var(--text-2)'}}>{t.submittedByName}</td>}
                      <td style={{color:'var(--text-3)'}}>{timeAgo(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}