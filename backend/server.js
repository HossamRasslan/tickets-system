const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'tickets-system-secret-2024';

app.use(cors());
app.use(express.json());

// ─── In-memory store ───────────────────────────────────────────────────────────

const users = [
  { id: 'u1',  name: 'Mostafa Fathy',   email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('2735', 10), role: 'agent',   department: 'Call Center', sapId: '2735' },
  { id: 'u2',  name: 'Doaa Salah',      email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('2746', 10), role: 'agent',   department: 'Call Center', sapId: '2746' },
  { id: 'u3',  name: 'Israa Mostafa',   email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('2926', 10), role: 'agent',   department: 'Call Center', sapId: '2926' },
  { id: 'u4',  name: 'Shaher Atef',     email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3079', 10), role: 'agent',   department: 'Call Center', sapId: '3079' },
  { id: 'u5',  name: 'Ahmed Ali',       email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3115', 10), role: 'agent',   department: 'Call Center', sapId: '3115' },
  { id: 'u6',  name: 'Mohamed Khaled',  email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3279', 10), role: 'agent',   department: 'Call Center', sapId: '3279' },
  { id: 'u7',  name: 'Yasmin Mohamed',  email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3197', 10), role: 'agent',   department: 'Call Center', sapId: '3197' },
  { id: 'u8',  name: 'Mohamed Ragab',   email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3366', 10), role: 'agent',   department: 'Call Center', sapId: '3366' },
  { id: 'u9',  name: 'Ramy Naeem',      email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3716', 10), role: 'agent',   department: 'Call Center', sapId: '3716' },
  { id: 'u10', name: 'Mahmoud Atwa',    email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3714', 10), role: 'agent',   department: 'Call Center', sapId: '3714' },
  { id: 'u11', name: 'Maya Mohamed',    email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3724', 10), role: 'agent',   department: 'Call Center', sapId: '3724' },
  { id: 'u12', name: 'Shahd Yasser',    email: 'london.cab@sixt.com.eg', password: bcrypt.hashSync('3658', 10), role: 'agent',   department: 'Call Center', sapId: '3658' },
  { id: 'u13', name: 'Nermin Nabil',    email: 'nermine.nabil@sixt.com.eg', password: bcrypt.hashSync('2991', 10), role: 'handler', department: 'Complaints', sapId: '2991' },
  { id: 'u14', name: 'Hamed Mohammed',  email: 'hamed.mohamed@sixt.com.eg', password: bcrypt.hashSync('3629', 10), role: 'handler', department: 'Complaints', sapId: '3629' },
  { id: 'u15', name: 'Hossam Hassan',   email: 'h.hassan@sixt.com.eg',      password: bcrypt.hashSync('696', 10),  role: 'manager', department: 'Operations', sapId: '696' },
  { id: 'u16', name: 'Mohamed Hamdy',   email: 'mhamdy@sixt.com.eg',        password: bcrypt.hashSync('792', 10),  role: 'manager', department: 'Operations', sapId: '792' },
];

const CATEGORIES = ['Billing', 'Service Outage', 'Product Quality', 'Staff Conduct', 'Delivery', 'Technical Issue', 'Refund Request', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES   = ['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];

let tickets = [];
let ticketCounter = 1;

// ─── Auth middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ─── Auth routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // For agents sharing the same email, match by email + password (SAP ID)
  const user = users.find(u => u.email === email && bcrypt.compareSync(password, u.password));
  if (!user)
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, sapId: user.sapId } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, sapId: user.sapId });
});

// ─── Lookup routes ────────────────────────────────────────────────────────────

app.get('/api/categories', auth, (req, res) => res.json(CATEGORIES));
app.get('/api/priorities', auth, (req, res) => res.json(PRIORITIES));
app.get('/api/statuses',   auth, (req, res) => res.json(STATUSES));
app.get('/api/handlers',   auth, requireRole('manager', 'handler'), (req, res) => {
  res.json(users.filter(u => u.role === 'handler').map(u => ({ id: u.id, name: u.name })));
});

// ─── Tickets routes ───────────────────────────────────────────────────────────

app.get('/api/tickets', auth, (req, res) => {
  const { status, priority, category, search, assignedTo } = req.query;
  let result = [...tickets];

  if (req.user.role === 'agent') {
    result = result.filter(t => t.submittedBy === req.user.id);
  }
  if (status)     result = result.filter(t => t.status === status);
  if (priority)   result = result.filter(t => t.priority === priority);
  if (category)   result = result.filter(t => t.category === category);
  if (assignedTo) result = result.filter(t => t.assignedTo === assignedTo);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q)
    );
  }

  result = result.map(t => ({
    ...t,
    submittedByName: users.find(u => u.id === t.submittedBy)?.name || 'Unknown',
    assignedToName:  t.assignedTo ? users.find(u => u.id === t.assignedTo)?.name : null,
  }));

  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/tickets/:id', auth, (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'agent' && ticket.submittedBy !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });

  const enriched = {
    ...ticket,
    submittedByName: users.find(u => u.id === ticket.submittedBy)?.name || 'Unknown',
    assignedToName:  ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo)?.name : null,
    comments: ticket.comments.map(c => ({
      ...c,
      userName: users.find(u => u.id === c.userId)?.name || 'Unknown',
      userRole: users.find(u => u.id === c.userId)?.role || 'unknown',
    }))
  };
  res.json(enriched);
});

app.post('/api/tickets', auth, requireRole('agent', 'manager'), (req, res) => {
  const { title, description, category, priority, customerId, customerName } = req.body;
  if (!title || !description || !category || !priority || !customerName)
    return res.status(400).json({ error: 'Missing required fields' });

  const id = `TKT-${String(ticketCounter++).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const ticket = {
    id, title, description, category, priority,
    status: 'Open',
    submittedBy: req.user.id,
    assignedTo: null,
    customerId: customerId || '',
    customerName,
    createdAt: now,
    updatedAt: now,
    comments: []
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

app.patch('/api/tickets/:id', auth, (req, res) => {
  const idx = tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });

  const ticket = tickets[idx];
  const { role } = req.user;

  if (role === 'agent') {
    if (ticket.submittedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const allowed = ['title', 'description'];
    Object.keys(req.body).forEach(k => { if (allowed.includes(k)) ticket[k] = req.body[k]; });
  } else {
    const { status, priority, assignedTo, category } = req.body;
    if (status)     ticket.status = status;
    if (priority)   ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (category)   ticket.category = category;
  }

  ticket.updatedAt = new Date().toISOString();
  tickets[idx] = ticket;
  res.json(ticket);
});

app.post('/api/tickets/:id/comments', auth, (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'agent' && ticket.submittedBy !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const comment = { id: uuidv4(), userId: req.user.id, text: text.trim(), createdAt: new Date().toISOString() };
  ticket.comments.push(comment);
  ticket.updatedAt = comment.createdAt;

  res.status(201).json({
    ...comment,
    userName: req.user.name,
    userRole: req.user.role,
  });
});

// ─── Stats route ──────────────────────────────────────────────────────────────

app.get('/api/stats', auth, requireRole('manager', 'handler'), (req, res) => {
  const total = tickets.length;
  const byStatus   = {};
  const byPriority = {};
  const byCategory = {};

  STATUSES.forEach(s => byStatus[s] = 0);
  PRIORITIES.forEach(p => byPriority[p] = 0);
  CATEGORIES.forEach(c => byCategory[c] = 0);

  tickets.forEach(t => {
    byStatus[t.status]     = (byStatus[t.status]     || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });

  const avgResolution = tickets
    .filter(t => t.status === 'Resolved' || t.status === 'Closed')
    .reduce((sum, t) => {
      const diff = new Date(t.updatedAt) - new Date(t.createdAt);
      return sum + diff / 3600000;
    }, 0) / (tickets.filter(t => ['Resolved','Closed'].includes(t.status)).length || 1);

  res.json({ total, byStatus, byPriority, byCategory, avgResolutionHours: Math.round(avgResolution) });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));