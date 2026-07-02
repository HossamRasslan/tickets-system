import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge, RoleBadge } from '../components/Badge';
import api from '../api';

const STATUSES   = ['Open','In Progress','Pending Customer','Resolved','Closed'];
const PRIORITIES = ['Low','Medium','High','Urgent'];
const CATEGORIES = ['Billing','Service Outage','Product Quality','Staff Conduct','Delivery','Technical Issue','Refund Request','Other'];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

const initials = name => name?.split(' ').map(n=>n[0]).join('').toUpperCase() || '?';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [handlers, setHandlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updates, setUpdates] = useState({});

  const canEdit = user.role !== 'agent';
  const isManager = user.role === 'manager';

  useEffect(() => {
    Promise.all([
      api.get(`/tickets/${id}`),
      canEdit ? api.get('/handlers') : Promise.resolve({ data: [] })
    ]).then(([tRes, hRes]) => {
      setTicket(tRes.data);
      setHandlers(hRes.data);
      setUpdates({ status: tRes.data.status, priority: tRes.data.priority, assignedTo: tRes.data.assignedTo || '', category: tRes.data.category });
    }).catch(() => navigate('/tickets'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveUpdates = async () => {
    const r = await api.patch(`/tickets/${id}`, updates);
    setTicket(t => ({ ...t, ...r.data }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deleteTicket = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/tickets');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/tickets/${id}/comments`, { text: comment });
      setTicket(t => ({ ...t, comments: [...t.comments, r.data] }));
      setComment('');
    } finally { setPosting(false); }
  };

  if (loading) return <div className="spinner">Loading ticket…</div>;
  if (!ticket) return null;

  return (
    <>
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}>← Back</button>
          <span className="ticket-id">{ticket.id}</span>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
        <h2 style={{fontSize:20}}>{ticket.title}</h2>
        <p>Customer: <strong>{ticket.customerName}</strong>{ticket.customerId && ` · ${ticket.customerId}`} · Submitted by {ticket.submittedByName} on {fmt(ticket.createdAt)}</p>
      </div>

      <div className="page-body">
        <div className="detail-grid">
          {/* Left: description + comments */}
          <div>
            <div className="card" style={{marginBottom:20}}>
              <div style={{fontWeight:700, marginBottom:12, fontSize:13, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Description</div>
              <p style={{lineHeight:1.7, color:'var(--text)'}}>{ticket.description}</p>
            </div>

            <div className="card">
              <div className="comments-section" style={{marginTop:0}}>
                <h4>Activity · {ticket.comments.length} comment{ticket.comments.length !== 1 ? 's' : ''}</h4>
                {ticket.comments.length === 0 && (
                  <div style={{color:'var(--text-3)', fontSize:13, padding:'12px 0'}}>No comments yet. Be the first to add an update.</div>
                )}
                {ticket.comments.map(c => (
                  <div key={c.id} className="comment">
                    <div className="comment-avatar">{initials(c.userName)}</div>
                    <div className="comment-bubble">
                      <div className="comment-header">
                        <span className="comment-author">{c.userName}</span>
                        <RoleBadge role={c.userRole} />
                        <span className="comment-time">{fmt(c.createdAt)}</span>
                      </div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}
                <div className="comment-input-wrap">
                  <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment or update…" />
                  <button className="btn btn-primary" onClick={postComment} disabled={posting || !comment.trim()}>
                    {posting ? '…' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: management panel */}
          <div>
            <div className="card">
              <div style={{fontWeight:700, marginBottom:16, fontSize:13, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Ticket Management</div>

              {saved && <div className="alert alert-success" style={{marginBottom:12}}>✓ Changes saved</div>}

              {canEdit ? (
                <>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={updates.status} onChange={e => setUpdates(u => ({...u, status: e.target.value}))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={updates.priority} onChange={e => setUpdates(u => ({...u, priority: e.target.value}))}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={updates.category} onChange={e => setUpdates(u => ({...u, category: e.target.value}))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assigned to</label>
                    <select className="form-control" value={updates.assignedTo} onChange={e => setUpdates(u => ({...u, assignedTo: e.target.value}))}>
                      <option value="">Unassigned</option>
                      {handlers.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={saveUpdates}>
                    Save Changes
                  </button>
                </>
              ) : (
                <div className="meta-grid">
                  <div className="meta-item">
                    <label>Status</label>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="meta-item">
                    <label>Priority</label>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              )}

              <div style={{borderTop:'1px solid var(--border)', marginTop:20, paddingTop:20}}>
                <div style={{fontWeight:700, marginBottom:12, fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Details</div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {[
                    ['Category', ticket.category],
                    ['Submitted by', ticket.submittedByName],
                    ['Assigned to', ticket.assignedToName || 'Unassigned'],
                    ['Created', fmt(ticket.createdAt)],
                    ['Last updated', fmt(ticket.updatedAt)],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div style={{fontSize:11, color:'var(--text-3)', marginBottom:2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.4px'}}>{k}</div>
                      <div style={{fontSize:13, color: v === 'Unassigned' ? 'var(--text-3)' : 'var(--text)'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete button — managers only */}
              {isManager && (
                <div style={{borderTop:'1px solid var(--border)', marginTop:20, paddingTop:20}}>
                  {!confirmDelete ? (
                    <button className="btn btn-danger" style={{width:'100%', justifyContent:'center'}}
                      onClick={() => setConfirmDelete(true)}>
                      🗑 Delete Ticket
                    </button>
                  ) : (
                    <div style={{background:'rgba(244,91,91,0.1)', border:'1px solid rgba(244,91,91,0.3)', borderRadius:8, padding:14}}>
                      <div style={{fontSize:13, color:'var(--danger)', marginBottom:12, fontWeight:600}}>Are you sure you want to delete this ticket? This cannot be undone.</div>
                      <div style={{display:'flex', gap:8}}>
                        <button className="btn btn-danger btn-sm" style={{flex:1, justifyContent:'center'}}
                          onClick={deleteTicket} disabled={deleting}>
                          {deleting ? 'Deleting…' : 'Yes, Delete'}
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{flex:1, justifyContent:'center'}}
                          onClick={() => setConfirmDelete(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
