const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'tickets-system-secret-2024';

app.use(cors());
app.use(express.json());

// ─── Database connection ───────────────────────────────────────────────────────

const db = mysql.createPool({
  host:     process.env.MYSQLHOST,
  user:     process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port:     process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Create tables if they don't exist
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id VARCHAR(20) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Open',
      submittedBy VARCHAR(10) NOT NULL,
      assignedTo VARCHAR(10),
      customerId VARCHAR(50),
      customerName VARCHAR(255) NOT NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(50) PRIMARY KEY,
      ticketId VARCHAR(20) NOT NULL,
      userId VARCHAR(10) NOT NULL,
      text TEXT NOT NULL,
      createdAt DATETIME NOT NULL,
      FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ticket_counter (
      id INT PRIMARY KEY DEFAULT 1,
      counter INT NOT NULL DEFAULT 1
    )
  `);
  await db.execute(`INSERT IGNORE INTO ticket_counter (id, counter) VALUES (1, 1)`);
  console.log('✅ Database tables ready');
}

// ─── Users ────────────────────────────────────────────────────────────────────

const users = [
  { id: 'u1',  name: 'Mostafa Fathy',   email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('2735', 10), role: 'agent',   department: 'Call Center', sapId: '2735' },
  { id: 'u2',  name: 'Doaa Salah',      email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('2746', 10), role: 'agent',   department: 'Call Center', sapId: '2746' },
  { id: 'u3',  name: 'Israa Mostafa',   email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('2926', 10), role: 'agent',   department: 'Call Center', sapId: '2926' },
  { id: 'u4',  name: 'Shaher Atef',     email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3079', 10), role: 'agent',   department: 'Call Center', sapId: '3079' },
  { id: 'u5',  name: 'Ahmed Ali',       email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3115', 10), role: 'agent',   department: 'Call Center', sapId: '3115' },
  { id: 'u6',  name: 'Mohamed Khaled',  email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3279', 10), role: 'agent',   department: 'Call Center', sapId: '3279' },
  { id: 'u7',  name: 'Yasmin Mohamed',  email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3197', 10), role: 'agent',   department: 'Call Center', sapId: '3197' },
  { id: 'u8',  name: 'Mohamed Ragab',   email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3366', 10), role: 'agent',   department: 'Call Center', sapId: '3366' },
  { id: 'u9',  name: 'Ramy Naeem',      email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3716', 10), role: 'agent',   department: 'Call Center', sapId: '3716' },
  { id: 'u10', name: 'Mahmoud Atwa',    email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3714', 10), role: 'agent',   department: 'Call Center', sapId: '3714' },
  { id: 'u11', name: 'Maya Mohamed',    email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3724', 10), role: 'agent',   department: 'Call Center', sapId: '3724' },
  { id: 'u12', name: 'Shahd Yasser',    email: 'london.cab@sixt.com.eg',    password: bcrypt.hashSync('3658', 10), role: 'agent',   department: 'Call Center', sapId: '3658' },
  { id: 'u13', name: 'Nermin Nabil',    email: 'nermine.nabil@sixt.com.eg', password: bcrypt.hashSync('2991', 10), role: 'handler', department: 'Complaints',  sapId: '2991' },
  { id: 'u14', name: 'Hamed Mohammed',  email: 'hamed.mohamed@sixt.com.eg', password: bcrypt.hashSync('3629', 10), role: 'handler', department: 'Complaints',  sapId: '3629' },
  { id: 'u15', name: 'Hossam Hassan',   email: 'h.hassan@sixt.com.eg',      password: bcrypt.hashSync('696', 10),  role: 'manager', department: 'Operations',  sapId: '696'  },
  { id: 'u16', name: 'Mohamed Hamdy',   email: 'mhamdy@sixt.com.eg',        password: bcrypt.hashSync('792', 10),  role: 'manager', department: 'Operations',  sapId: '792'  },
];

const CATEGORIES = ['Billing', 'Service Outage', 'Product Quality', 'Staff Conduct', 'Delivery', 'Technical Issue', 'Refund Request', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES   = ['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];

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
  const { username, password } = req.body;
  const user = users.find(u => u.name.toLowerCase() === username?.toLowerCase().trim() && bcrypt.compareSync(password, u.password));
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function enrich(ticket, comments = []) {
  return {
    ...ticket,
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
    submittedByName: users.find(u => u.id === ticket.submittedBy)?.name || 'Unknown',
    assignedToName:  ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo)?.name : null,
    comments: comments.map(c => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      userName: users.find(u => u.id === c.userId)?.name || 'Unknown',
      userRole: users.find(u => u.id === c.userId)?.role || 'unknown',
    }))
  };
}

// ─── Tickets routes ───────────────────────────────────────────────────────────

app.get('/api/tickets', auth, async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (req.user.role === 'agent') { query += ' AND submittedBy = ?'; params.push(req.user.id); }
    if (status)   { query += ' AND status = ?';   params.push(status); }
    if (priority) { query += ' AND priority = ?'; params.push(priority); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) {
      query += ' AND (title LIKE ? OR id LIKE ? OR customerName LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY createdAt DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows.map(t => enrich(t)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', auth, async (req, res) => {
  try {
    const [[ticket]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'agent' && ticket.submittedBy !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });
    const [comments] = await db.execute('SELECT * FROM comments WHERE ticketId = ? ORDER BY createdAt ASC', [req.params.id]);
    res.json(enrich(ticket, comments));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', auth, requireRole('agent', 'manager'), async (req, res) => {
  try {
    const { title, description, category, priority, customerId, customerName } = req.body;
    if (!title || !description || !category || !priority || !customerName)
      return res.status(400).json({ error: 'Missing required fields' });

    const [[{ counter }]] = await db.execute('SELECT counter FROM ticket_counter WHERE id = 1');
    await db.execute('UPDATE ticket_counter SET counter = counter + 1 WHERE id = 1');
    const id = `TKT-${String(counter).padStart(3, '0')}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
      'INSERT INTO tickets (id, title, description, category, priority, status, submittedBy, assignedTo, customerId, customerName, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, title, description, category, priority, 'Open', req.user.id, null, customerId || '', customerName, now, now]
    );
    const [[ticket]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    res.status(201).json(enrich(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tickets/:id', auth, async (req, res) => {
  try {
    const [[ticket]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (req.user.role === 'agent') {
      if (ticket.submittedBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      const { title, description } = req.body;
      await db.execute('UPDATE tickets SET title=?, description=?, updatedAt=? WHERE id=?',
        [title || ticket.title, description || ticket.description, now, req.params.id]);
    } else {
      const { status, priority, assignedTo, category } = req.body;
      await db.execute(
        'UPDATE tickets SET status=?, priority=?, assignedTo=?, category=?, updatedAt=? WHERE id=?',
        [status || ticket.status, priority || ticket.priority, assignedTo !== undefined ? assignedTo || null : ticket.assignedTo, category || ticket.category, now, req.params.id]
      );
    }
    const [[updated]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    res.json(enrich(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', auth, requireRole('manager'), async (req, res) => {
  try {
    const [[ticket]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    await db.execute('DELETE FROM tickets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/comments', auth, async (req, res) => {
  try {
    const [[ticket]] = await db.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'agent' && ticket.submittedBy !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.execute('INSERT INTO comments (id, ticketId, userId, text, createdAt) VALUES (?,?,?,?,?)',
      [id, req.params.id, req.user.id, text.trim(), now]);
    await db.execute('UPDATE tickets SET updatedAt=? WHERE id=?', [now, req.params.id]);

    res.status(201).json({
      id, ticketId: req.params.id, userId: req.user.id,
      text: text.trim(), createdAt: now,
      userName: req.user.name, userRole: req.user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stats route ──────────────────────────────────────────────────────────────

app.get('/api/stats', auth, requireRole('manager', 'handler'), async (req, res) => {
  try {
    const [tickets] = await db.execute('SELECT status, priority, category, createdAt, updatedAt FROM tickets');
    const total = tickets.length;
    const byStatus = {}, byPriority = {}, byCategory = {};

    STATUSES.forEach(s => byStatus[s] = 0);
    PRIORITIES.forEach(p => byPriority[p] = 0);
    CATEGORIES.forEach(c => byCategory[c] = 0);

    tickets.forEach(t => {
      byStatus[t.status]     = (byStatus[t.status]     || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    const resolved = tickets.filter(t => ['Resolved','Closed'].includes(t.status));
    const avgResolution = resolved.length
      ? resolved.reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)) / 3600000, 0) / resolved.length
      : 0;

    res.json({ total, byStatus, byPriority, byCategory, avgResolutionHours: Math.round(avgResolution) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
