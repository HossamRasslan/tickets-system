import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initials = name => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => { logout(); navigate('/login'); };

  const agentLinks = [
    { to: '/',        icon: '◻', label: 'Dashboard' },
    { to: '/tickets', icon: '🎫', label: 'My Tickets' },
    { to: '/submit',  icon: '＋', label: 'Submit Ticket' },
  ];

  const handlerLinks = [
    { to: '/',        icon: '◻', label: 'Dashboard' },
    { to: '/tickets', icon: '🎫', label: 'All Tickets' },
  ];

  const managerLinks = [
    { to: '/',        icon: '◻', label: 'Dashboard' },
    { to: '/tickets', icon: '🎫', label: 'All Tickets' },
    { to: '/stats',   icon: '📊', label: 'Reports' },
  ];

  const links = user?.role === 'agent' ? agentLinks
              : user?.role === 'manager' ? managerLinks
              : handlerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🎫 TicketDesk</h1>
        <span>{user?.role === 'agent' ? 'Agent Portal' : user?.role === 'manager' ? 'Manager Portal' : 'Handler Portal'}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials(user?.name)}</div>
          <div className="user-info">
            <strong>{user?.name}</strong>
            <small>{user?.role} · {user?.department}</small>
          </div>
          <button className="logout-btn" onClick={doLogout} title="Sign out">⏻</button>
        </div>
      </div>
    </aside>
  );
}