import { useEffect, useState, useCallback } from 'react';
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

const STATUSES   = ['Open','In Progress','Pending Customer','Resolved','Closed'];
const PRIORITIES = ['Low','Medium','High','Urgent'];
const CATEGORIES = ['Billing','Service Outage','Product Quality','Staff Conduct','Delivery','Technical Issue','Refund Request','Other'];

export default function TicketList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status:'', priority:'', category:'', search:'' });

  const fetchTickets = useCallback(async () => {
    const params = {};
    if (filters.status)   params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    if (filters.search)   params.search = filters.search;
    const r = await api.get('/tickets', { params });
    setTickets(r.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ status:'', priority:'', category:'', search:'' });
  const isFiltered = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <h2>{user.role === 'agent' ? 'My Tickets' : 'All Tickets'}</h2>
            <p>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
          </div>
          {user.role === 'agent' && (
            <button className="btn btn-primary" onClick={() => navigate('/submit')}>＋ New Ticket</button>
          )}
        </div>
      </div>
      <div className="page-body">
        <div className="filters-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search tickets…" value={filters.search}
              onChange={e => setFilter('search', e.target.value)} />
          </div>
          <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="filter-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {isFiltered && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>}
        </div>

        <div className="card" style={{padding:0}}>
          {loading ? (
            <div className="spinner">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎫</div>
              <p>{isFiltered ? 'No tickets match your filters.' : user.role === 'agent' ? "You haven't submitted any tickets yet." : 'No tickets in the system.'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    {user.role !== 'agent' && <th>Agent</th>}
                    {user.role !== 'agent' && <th>Assigned to</th>}
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                      <td><span className="ticket-id">{t.id}</span></td>
                      <td style={{maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500}}>{t.title}</td>
                      <td style={{color:'var(--text-2)'}}>{t.customerName}</td>
                      <td style={{color:'var(--text-2)', fontSize:12}}>{t.category}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      {user.role !== 'agent' && <td style={{color:'var(--text-2)'}}>{t.submittedByName}</td>}
                      {user.role !== 'agent' && <td style={{color: t.assignedToName ? 'var(--text)' : 'var(--text-3)'}}>{t.assignedToName || '—'}</td>}
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