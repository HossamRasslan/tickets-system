import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMOS = [
  { label: 'Call Center Agent — Sara Lane', email: 'agent1@cc.com', password: 'agent123' },
  { label: 'Call Center Agent — Tom Marsh', email: 'agent2@cc.com', password: 'agent123' },
  { label: 'Complaints Handler — Anya Patel', email: 'handler1@cc.com', password: 'handler123' },
  { label: 'Complaints Handler — Carlos Rivera', email: 'handler2@cc.com', password: 'handler123' },
  { label: 'Manager — Diane Foster', email: 'manager@cc.com', password: 'manager123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = demo => { setEmail(demo.email); setPassword(demo.password); setError(''); };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🎫 TicketDesk</h1>
        <p>Call Center Complaint Management System</p>

        <div className="demo-creds">
          <p>Quick login — click to fill</p>
          {DEMOS.map(d => (
            <button key={d.email} onClick={() => fillDemo(d)}>→ {d.label}</button>
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}