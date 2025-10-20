require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL pool
typeof Pool;
const pool = new Pool();

// In-memory sessions store
const sessions = {};

// Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'supersecret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const N8N_API_BASE = process.env.N8N_API_BASE || 'https://n8n.chiefaiofficer.id';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Helper: validate sessionId
function isValidSessionId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// --- Authentication ---
// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '12h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Username/password salah' });
});

// Refresh JWT
app.post('/refresh', (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, SECRET_KEY, { ignoreExpiration: true });
    if (!decoded.username) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const newToken = jwt.sign({ username: decoded.username }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Auth middleware (excludes login, refresh, QR and proxy routes)
app.use((req, res, next) => {
  if (
    req.path === '/login' ||
    req.path === '/refresh' ||
    /^\/sessions\/[^/]+\/qr/.test(req.path) ||
    req.path.startsWith('/proxy/n8n')
  ) {
    return next();
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(auth.split(' ')[1], SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ error: 'Token salah/expired' });
  }
});

// --- Session CRUD ---
// Create or update session
app.post('/sessions', async (req, res) => {
  const { sessionId, webhookUrl } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  try {
    const query = `
      INSERT INTO wa_sessions (session_id, webhook_url)
      VALUES ($1, $2)
      ON CONFLICT (session_id) DO UPDATE
        SET webhook_url = EXCLUDED.webhook_url,
            updated_at = NOW()
      RETURNING *`;
    const result = await pool.query(query, [sessionId, webhookUrl]);
    res.json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sessions
app.get('/sessions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wa_sessions ORDER BY id');
    const sessionsWithStatus = result.rows.map(row => ({
      ...row,
      status: sessions[row.session_id]?.status || 'not initialized'
    }));
    res.json({ sessions: sessionsWithStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update webhook URL
app.put('/sessions/:sessionId/webhook', async (req, res) => {
  const { sessionId } = req.params;
  const { webhookUrl } = req.body;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  if (!webhookUrl) {
    return res.status(400).json({ error: 'webhookUrl required' });
  }
  try {
    const query = `
      UPDATE wa_sessions
      SET webhook_url = $1, updated_at = NOW()
      WHERE session_id = $2
      RETURNING *`;
    const result = await pool.query(query, [webhookUrl, sessionId]);
    res.json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session
app.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  try {
    await pool.query('DELETE FROM wa_sessions WHERE session_id = $1', [sessionId]);
    if (sessions[sessionId]) {
      sessions[sessionId].client.destroy();
      delete sessions[sessionId];
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Initialize WhatsApp session ---
app.post('/sessions/:sessionId/init', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  // Ensure session record exists
  const dbRes = await pool.query('SELECT * FROM wa_sessions WHERE session_id = $1', [sessionId]);
  if (dbRes.rowCount === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (sessions[sessionId]) {
    return res.json({ status: sessions[sessionId].status });
  }

  const client = new Client({ authStrategy: new LocalAuth({ clientId: sessionId }) });
  let qrCodeData = '';
  sessions[sessionId] = { client, getQr: () => qrCodeData, status: 'initializing', info: null, logs: [] };

  client.on('qr', qr => {
    qrcode.toDataURL(qr, (err, url) => { qrCodeData = url; });
    sessions[sessionId].status = 'initializing';
  });

  client.on('ready', () => {
    sessions[sessionId].status = 'connected';
    sessions[sessionId].info = client.info;
    console.log(`WA Client [${sessionId}] connected`);
  });

  client.on('disconnected', reason => {
    sessions[sessionId].status = 'disconnected';
    console.log(`WA Client [${sessionId}] disconnected:`, reason);
  });

  client.on('message', async message => {
    // Log incoming
    sessions[sessionId].logs.push({ direction: 'in', from: message.from, to: message.to, type: message.type, body: message.body, timestamp: message.timestamp });

    // Retrieve webhook URL
    const resDb = await pool.query('SELECT webhook_url FROM wa_sessions WHERE session_id = $1', [sessionId]);
    const webhookUrl = resDb.rows[0]?.webhook_url;
    if (!webhookUrl) return;

    // Prepare payload
    const payload = {
      sessionId,
      from: message.from,
      to: message.to,
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      isGroupMsg: message.from.endsWith('@g.us'),
      caption: message.caption || '',
      mimetype: message.mimetype || '',
      filename: message.filename || '',
      hasMedia: message.hasMedia || false,
    };
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      payload.media = { data: media.data, mimetype: media.mimetype, filename: media.filename };
    }

    try {
      const n8nRes = await axios.post(webhookUrl, payload, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        timeout: 15000
      });
      // Extract reply
      const replyData = n8nRes.data;
      let replyText = '';
      if (typeof replyData === 'string') replyText = replyData;
      else if (replyData.response) replyText = replyData.response;
      else if (replyData.output) replyText = replyData.output;
      else replyText = JSON.stringify(replyData);

      if (replyText) {
        await client.sendMessage(message.from, replyText);
        sessions[sessionId].logs.push({ direction: 'out', from: sessionId, to: message.from, body: replyText, timestamp: Math.floor(Date.now()/1000) });
      }
    } catch (err) {
      console.error('Error forwarding to n8n or sending reply:', err.message);
    }
  });

  client.initialize();
  res.json({ status: 'initializing' });
});

// --- Public QR endpoint ---
app.get('/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  const sess = sessions[sessionId];
  if (!sess) return res.status(404).json({ error: 'Session not initialized' });
  if (sess.status === 'connected') return res.json({ qr: null });
  res.json({ qr: sess.getQr() });
});

// --- Status endpoint ---
app.get('/sessions/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  const sess = sessions[sessionId];
  if (!sess) {
    return res.status(404).json({ status: 'not initialized' });
  }
  res.json({ status: sess.status, info: sess.info || null });
});

// --- Logs endpoint ---
app.get('/sessions/:sessionId/logs', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'SessionId hanya boleh huruf, angka, _ atau -' });
  }
  res.json({ logs: sessions[sessionId]?.logs || [] });
});

// --- Proxy n8n workflow create ---
app.post('/proxy/n8n/workflows', async (req, res) => {
  try {
    const result = await axios.post(
      `${N8N_API_BASE}/api/v1/workflows`,
      req.body,
      { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
    );
    res.json(result.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.message, detail: e.response?.data });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
