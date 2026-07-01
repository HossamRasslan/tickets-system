export function PriorityBadge({ priority }) {
  return <span className={`badge badge-priority-${priority}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-status-${status}`}>{status}</span>;
}

export function RoleBadge({ role }) {
  const colors = { agent: '#4f7ef8', handler: '#f87c4f', manager: '#3ecf8e' };
  return (
    <span className="badge" style={{ background: `${colors[role]}22`, color: colors[role] }}>
      {role}
    </span>
  );
}