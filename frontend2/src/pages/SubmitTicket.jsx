import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['Billing','Service Outage','Product Quality','Staff Conduct','Delivery','Technical Issue','Refund Request','Other'];
const PRIORITIES  = ['Low','Medium','High','Urgent'];

export default function SubmitTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'Medium',
    customerName: '', customerId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await api.post('/tickets', form);
      navigate(`/tickets/${r.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit ticket.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Submit a Ticket</h2>
        <p>Fill in the details of the customer complaint or issue.</p>
      </div>
      <div className="page-body">
        <div className="card" style={{maxWidth:720}}>
          {error && <div style={{background:'rgba(244,91,91,0.12)',border:'1px solid rgba(244,91,91,0.25)',color:'var(--danger)',marginBottom:16,padding:'10px 14px',borderRadius:8,fontSize:13}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{fontWeight:700, marginBottom:18, fontSize:14, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Customer Information</div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label>Customer Name *</label>
                <input className="form-control" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label>Customer ID</label>
                <input className="form-control" value={form.customerId} onChange={e => set('customerId', e.target.value)} placeholder="CUST-0000" />
              </div>
            </div>

            <div style={{fontWeight:700, margin:'8px 0 18px', fontSize:14, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Ticket Details</div>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Brief summary of the issue" required maxLength={120} />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the complaint in detail — what happened, when, what the customer expects…" required style={{minHeight:120}} />
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)} required>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)} required>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:8}}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting…' : '🎫 Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}