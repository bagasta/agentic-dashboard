require('dotenv').config();
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool();
const sessions = {};

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// LOGIN ENDPOINT
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "12h" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Username/password salah" });
});
// JWT Refresh Endpoint
app.post('/refresh', (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, SECRET_KEY, { ignoreExpiration: true });
    if (!decoded.username) return res.status(401).json({ error: "Invalid token" });
    const newToken = jwt.sign({ username: decoded.username }, SECRET_KEY, { expiresIn: "12h" });
    res.json({ token: newToken });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// AUTH MIDDLEWARE
app.use((req, res, next) => {
  if (
    req.path === "/login" ||
    /^\/sessions\/[^/]+\/qr/.test(req.path)
  ) return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    jwt.verify(auth.replace("Bearer ", ""), SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ error: "Token salah/expired" });
  }
});

// HELPER
function isValidSessionId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// SESSION CRUD
app.post('/sessions', async (req, res) => {
  const { sessionId, webhookUrl } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  try {
    const q = `
      INSERT INTO wa_sessions (session_id, webhook_url)
      VALUES ($1, $2)
      ON CONFLICT (session_id) DO UPDATE SET webhook_url = EXCLUDED.webhook_url, updated_at = NOW()
      RETURNING *`;
    const result = await pool.query(q, [sessionId, webhookUrl]);
    res.json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/sessions', async (req, res) => {
  const q = `SELECT * FROM wa_sessions ORDER BY id`;
  const result = await pool.query(q);
  // Tambahkan status dari memory
  result.rows.forEach(sess => {
    sess.status = sessions[sess.session_id]?.status || "not initialized";
  });
  res.json({ sessions: result.rows });
});

app.put('/sessions/:sessionId/webhook', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: "webhookUrl required" });
  const q = `UPDATE wa_sessions SET webhook_url=$1, updated_at=NOW() WHERE session_id=$2 RETURNING *`;
  const result = await pool.query(q, [webhookUrl, sessionId]);
  res.json({ session: result.rows[0] });
});

app.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  await pool.query(`DELETE FROM wa_sessions WHERE session_id=$1`, [sessionId]);
  if (sessions[sessionId]) {
    sessions[sessionId].client.destroy();
    delete sessions[sessionId];
  }
  res.json({ success: true });
});

// SESSION WA INIT
app.post('/sessions/:sessionId/init', async (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  }
  const q = `SELECT * FROM wa_sessions WHERE session_id=$1`;
  const result = await pool.query(q, [sessionId]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Session not found" });
  if (sessions[sessionId]) return res.json({ status: "already initialized" });

  let qrCodeData = "";
  const client = new Client({ authStrategy: new LocalAuth({ clientId: sessionId }) });

  // STATE session
  sessions[sessionId] = {
    client,
    getQr: () => qrCodeData,
    status: "initializing",
    info: null,
    logs: []
  };

  client.on('qr', qr => {
    qrcode.toDataURL(qr, (err, url) => { qrCodeData = url; });
    sessions[sessionId].status = "initializing";
  });

  client.on('ready', () => {
    sessions[sessionId].status = "connected";
    sessions[sessionId].info = client.info;
    console.log(`WA Client [${sessionId}] Connected as ${client.info.wid.user}`);
  });

  client.on('disconnected', (reason) => {
    sessions[sessionId].status = "disconnected";
    console.log(`WA Client [${sessionId}] Disconnected:`, reason);
  });

  // HANDLER: Semua tipe pesan WA dikirim ke webhook!
  client.on('message', async message => {
    sessions[sessionId].logs.push({
      direction: "in",
      from: message.from,
      to: message.to,
      type: message.type,
      body: message.body,
      timestamp: message.timestamp,
      hasMedia: message.hasMedia || false,
      caption: message.caption || "",
      mimetype: message.mimetype || "",
      filename: message.filename || "",
    });

    try {
      const webq = `SELECT webhook_url FROM wa_sessions WHERE session_id=$1`;
      const webres = await pool.query(webq, [sessionId]);
      const webhookUrl = webres.rows[0]?.webhook_url;
      if (!webhookUrl) return;

      // Payload dikirim lengkap!
      let payload = {
        sessionId,
        from: message.from,
        to: message.to,
        body: message.body,
        type: message.type,
        timestamp: message.timestamp,
        isGroupMsg: message.from.endsWith('@g.us'),
        caption: message.caption || "",
        mimetype: message.mimetype || "",
        filename: message.filename || "",
        hasMedia: message.hasMedia || false,
        // Add more fields if you need!
      };
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        payload.media = {
          data: media.data,
          mimetype: media.mimetype,
          filename: media.filename
        };
      }

      // === Kirim ke webhook ===
      await axios.post(webhookUrl, payload, { timeout: 15000 });
      // Catatan: Tidak perlu filter group atau mention!

    } catch (e) {
      console.error('Webhook/WA error:', e.message);
    }
  });

  client.initialize();
  res.json({ status: "initializing" });
});

// GET QR (public)
app.get('/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  if (!sessions[sessionId]) return res.status(404).json({ error: "Session not initialized" });
  if (sessions[sessionId].status === "connected") {
    return res.json({ qr: null });
  }
  res.json({ qr: sessions[sessionId].getQr() });
});

// STATUS
app.get('/sessions/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  const s = sessions[sessionId];
  if (!s) return res.status(404).json({ status: "not initialized" });
  res.json({
    status: s.status,
    info: s.info || null
  });
});

// LOG (dari memory)
app.get('/sessions/:sessionId/logs', (req, res) => {
  const { sessionId } = req.params;
  if (!isValidSessionId(sessionId)) return res.status(400).json({ error: "SessionId hanya boleh huruf, angka, _ atau -" });
  res.json({ logs: sessions[sessionId]?.logs || [] });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
