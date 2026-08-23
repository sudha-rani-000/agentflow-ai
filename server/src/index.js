const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const port = Number(process.env.PORT || 4000);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const users = new Map();

app.use(helmet());
app.use(cors({ origin: clientUrl }));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'agentflow-ai-api', storage: 'in-memory' }));
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: 'Name, email, and an 8-character password are required.' });
  const normalizedEmail = email.toLowerCase();
  if (users.has(normalizedEmail)) return res.status(409).json({ error: 'An account with that email already exists.' });
  const user = { id: crypto.randomUUID(), name, email: normalizedEmail, role: 'operator' };
  users.set(normalizedEmail, { ...user, password });
  res.status(201).json({ user, token: 'development-token' });
});
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.get((email || '').toLowerCase());
  if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid email or password.' });
  const { password: _password, ...safeUser } = user;
  res.json({ user: safeUser, token: 'development-token' });
});
app.get('/api/auth/me', (_req, res) => res.status(401).json({ error: 'Authentication required.' }));

app.listen(port, () => console.log(`Agentflow API listening on http://localhost:${port}`));
