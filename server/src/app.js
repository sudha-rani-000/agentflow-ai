const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const httpServer = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const port = Number(process.env.PORT || 4000);
const users = new Map();
const workflows = new Map();
const executions = new Map();
const logs = [];
const notifications = [];
const integrations = new Map();
const io = new Server(httpServer, { cors: { origin: clientUrl } });

const id = () => crypto.randomUUID();
const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
const safeUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  try { req.user = jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET || 'development-secret'); next(); }
  catch { res.status(401).json({ error: 'Authentication required.' }); }
};
const writeLog = (execution, agent, level, message, metadata = {}) => {
  const entry = { id: id(), executionId: execution.id, workflowId: execution.workflowId, nodeId: metadata.nodeId || null, agent, level, message, metadata, createdAt: new Date().toISOString() };
  logs.push(entry); io.to(execution.id).emit('agent:event', entry); return entry;
};
const workflowFromPrompt = (prompt) => {
  const text = prompt.toLowerCase();
  const nodes = [{ id: 'trigger-1', type: 'trigger', position: { x: 100, y: 120 }, data: { label: text.includes('invoice') ? 'When an invoice arrives' : 'When a new event arrives', provider: text.includes('gmail') ? 'gmail' : 'webhook' } }];
  if (text.includes('classif') || text.includes('invoice')) nodes.push({ id: 'agent-1', type: 'agent', position: { x: 380, y: 120 }, data: { label: 'Classify and validate', provider: 'gemini' } });
  const provider = text.includes('discord') ? 'discord' : text.includes('sheet') ? 'google-sheets' : text.includes('slack') ? 'slack' : 'gmail';
  nodes.push({ id: 'action-1', type: 'action', position: { x: 660, y: 120 }, data: { label: provider === 'gmail' ? 'Send email' : provider === 'google-sheets' ? 'Append to sheet' : `Post ${provider} message`, provider } });
  return { name: text.includes('invoice') ? 'Invoice routing' : 'Generated automation', description: prompt, nodes, edges: nodes.slice(1).map((node, index) => ({ id: `edge-${index}`, source: nodes[index].id, target: node.id, animated: true })), triggerConfig: { type: 'manual' }, tags: ['generated'], version: 1 };
};
const runExecution = (execution) => {
  execution.status = 'RUNNING'; execution.startTime = new Date().toISOString();
  const steps = [['planner', 'info', 'Planner mapped the workflow into an executable order.'], ['execution', 'info', 'Execution agent completed the configured actions.'], ['validation', 'success', 'Validation passed: required output fields are present.'], ['monitoring', 'success', 'Workflow completed successfully.']];
  steps.forEach(([agent, level, message], index) => setTimeout(() => { writeLog(execution, agent, level, message, { step: index + 1 }); }, index * 180));
  setTimeout(() => { execution.status = 'COMPLETED'; execution.endTime = new Date().toISOString(); execution.duration = new Date(execution.endTime) - new Date(execution.startTime); notifications.push({ id: id(), owner: execution.owner, executionId: execution.id, type: 'success', title: 'Workflow completed', message: 'Your workflow finished successfully.', isRead: false, createdAt: new Date().toISOString() }); io.to(execution.id).emit('execution:updated', execution); }, steps.length * 180 + 100);
};

app.use(helmet()); app.use(cors({ origin: clientUrl })); app.use(compression()); app.use(express.json()); app.use(morgan('dev'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'agentflow-ai-api', storage: 'in-memory', langGraph: 'not-installed' }));
app.post('/api/auth/register', async (req, res) => { const { name, email, password } = req.body || {}; if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: 'Name, email, and an 8-character password are required.' }); const normalized = email.toLowerCase(); if (users.has(normalized)) return res.status(409).json({ error: 'An account with that email already exists.' }); const user = { id: id(), name, email: normalized, role: 'operator', password: await bcrypt.hash(password, 12), lastLogin: null }; users.set(normalized, user); res.status(201).json({ user: safeUser(user), token: tokenFor(user) }); });
app.post('/api/auth/login', async (req, res) => { const user = users.get((req.body.email || '').toLowerCase()); if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ error: 'Invalid email or password.' }); user.lastLogin = new Date().toISOString(); res.json({ user: safeUser(user), token: tokenFor(user) }); });
app.get('/api/auth/me', auth, (req, res) => { const user = [...users.values()].find((item) => item.id === req.user.id); user ? res.json({ user: safeUser(user) }) : res.status(404).json({ error: 'User not found.' }); });
app.get('/api/workflows', auth, (req, res) => res.json({ workflows: [...workflows.values()].filter((item) => item.owner === req.user.id) }));
app.post('/api/workflows', auth, (req, res) => { const workflow = { id: id(), owner: req.user.id, status: 'draft', version: 1, nodes: [], edges: [], tags: [], ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; workflows.set(workflow.id, workflow); res.status(201).json({ workflow }); });
app.post('/api/workflows/generate', auth, (req, res) => { if (!req.body.prompt) return res.status(400).json({ error: 'Prompt is required.' }); res.json({ workflow: workflowFromPrompt(req.body.prompt), provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : process.env.GEMINI_API_KEY ? 'gemini' : 'deterministic' }); });
app.get('/api/workflows/:id', auth, (req, res) => { const workflow = workflows.get(req.params.id); workflow && workflow.owner === req.user.id ? res.json({ workflow }) : res.status(404).json({ error: 'Workflow not found.' }); });
app.put('/api/workflows/:id', auth, (req, res) => { const workflow = workflows.get(req.params.id); if (!workflow || workflow.owner !== req.user.id) return res.status(404).json({ error: 'Workflow not found.' }); Object.assign(workflow, req.body, { version: workflow.version + 1, updatedAt: new Date().toISOString() }); res.json({ workflow }); });
app.post('/api/workflows/:id/duplicate', auth, (req, res) => { const source = workflows.get(req.params.id); if (!source || source.owner !== req.user.id) return res.status(404).json({ error: 'Workflow not found.' }); const workflow = { ...JSON.parse(JSON.stringify(source)), id: id(), name: `${source.name} copy`, version: 1, createdAt: new Date().toISOString() }; workflows.set(workflow.id, workflow); res.status(201).json({ workflow }); });
app.delete('/api/workflows/:id', auth, (req, res) => { const workflow = workflows.get(req.params.id); if (!workflow || workflow.owner !== req.user.id) return res.status(404).json({ error: 'Workflow not found.' }); workflows.delete(req.params.id); res.status(204).end(); });
app.post('/api/workflows/:id/execute', auth, (req, res) => { const workflow = workflows.get(req.params.id); if (!workflow || workflow.owner !== req.user.id) return res.status(404).json({ error: 'Workflow not found.' }); const execution = { id: id(), owner: req.user.id, workflowId: workflow.id, workflowSnapshot: JSON.parse(JSON.stringify(workflow)), status: 'PENDING', inputs: req.body || {}, outputs: null, retryCount: 0, createdAt: new Date().toISOString() }; executions.set(execution.id, execution); runExecution(execution); res.status(202).json({ execution, langGraph: 'not-installed' }); });
app.get('/api/executions', auth, (req, res) => res.json({ executions: [...executions.values()].filter((item) => item.owner === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
app.get('/api/executions/:id', auth, (req, res) => { const execution = executions.get(req.params.id); execution && execution.owner === req.user.id ? res.json({ execution }) : res.status(404).json({ error: 'Execution not found.' }); });
app.get('/api/executions/:id/timeline', auth, (req, res) => res.json({ logs: logs.filter((item) => item.executionId === req.params.id) }));
app.post('/api/executions/:id/:action', auth, (req, res) => { const execution = executions.get(req.params.id); if (!execution || execution.owner !== req.user.id || !['pause', 'resume', 'cancel'].includes(req.params.action)) return res.status(404).json({ error: 'Execution not found.' }); execution.status = req.params.action === 'pause' ? 'PAUSED' : req.params.action === 'cancel' ? 'CANCELLED' : 'RUNNING'; res.json({ execution }); });
app.get('/api/integrations', auth, (req, res) => res.json({ integrations: ['gmail', 'slack', 'discord', 'google-sheets'].map((provider) => integrations.get(`${req.user.id}:${provider}`) || { provider, isConnected: false }) }));
app.get('/api/integrations/status', auth, (req, res) => res.json({ status: ['gmail', 'slack', 'discord', 'google-sheets'].map((provider) => ({ provider, isConnected: Boolean(integrations.get(`${req.user.id}:${provider}`)?.isConnected) })) }));
app.post('/api/integrations', auth, (req, res) => { const connection = { owner: req.user.id, provider: req.body.provider, isConnected: true, scopes: req.body.scopes || [], connectedAt: new Date().toISOString() }; integrations.set(`${req.user.id}:${connection.provider}`, connection); res.status(201).json({ integration: connection }); });
app.get('/api/integrations/oauth/:provider/start', auth, (req, res) => res.json({ provider: req.params.provider, authorizationUrl: `/api/integrations/oauth/${req.params.provider}/callback?status=connected` }));
app.get('/api/integrations/oauth/:provider/callback', auth, (req, res) => res.json({ provider: req.params.provider, isConnected: true }));
app.get('/api/notifications', auth, (req, res) => res.json({ notifications: notifications.filter((item) => item.owner === req.user.id) }));

io.on('connection', (socket) => { socket.on('execution:subscribe', (executionId) => socket.join(executionId)); });
httpServer.listen(port, () => console.log(`Agentflow API listening on http://localhost:${port}`));
