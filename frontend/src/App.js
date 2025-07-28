import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { FiRefreshCcw, FiTrash2, FiEdit2, FiSave, FiX, FiLayers } from "react-icons/fi";
const API = "http://localhost:3001";

// === Axios instance + JWT Auto Refresh Token ===
// === Axios instance + JWT Auto Refresh Token ===
const api = axios.create({ baseURL: API });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (
      err.response &&
      err.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch(e => Promise.reject(e));
      }

      isRefreshing = true;
      try {
        const oldToken = localStorage.getItem("token");
        const res = await axios.post(API + "/refresh", { token: oldToken });
        const newToken = res.data.token;
        localStorage.setItem("token", newToken);
        api.defaults.headers.common["Authorization"] = "Bearer " + newToken;
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem("token");
        window.location.reload();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// === DUMMY AGENT TEMPLATE DATA (ISI TEMPLATE JSON ASLINYA NANTI) ===
const agentTemplates = [
  {
    id: "ai_basic",
    name: "AI Basic Agent",
    description: "Agent WhatsApp sederhana dengan AI memory & webhook.",
    systemMessage: "You are a helpful assistant.",
    templateJson: {
  "name": "Template1",
  "nodes": [
    {
      "id": "8a2f1afe-9155-45c7-bea6-c9835c3a7521",
      "name": "Webhook",
      "webhookId": "76b0c7e6-5462-49d3-a1b0-e5b2865877ed",
      "disabled": false,
      "notesInFlow": false,
      "notes": "",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "position": [-160, 0],
      "parameters": {
        "httpMethod": "POST",
        "path": "rename-This",
        "options": {}
      }
    },
    {
      "id": "e30206bb-3962-4c9c-874c-3b90fe8a144a",
      "name": "AI Agent",
      "disabled": false,
      "notesInFlow": false,
      "notes": "",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "position": [60, 0],
      "parameters": {
        "options": {
          "systemMessage": "You are a assistant",
          "returnIntermediateSteps": false
        }
      }
    },
    {
      "id": "52538d41-bb98-4558-b196-abd8178f208e",
      "name": "Postgres Chat Memory",
      "disabled": false,
      "notesInFlow": false,
      "notes": "",
      "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat",
      "typeVersion": 1,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "position": [160, 220],
      "parameters": {
        "tableName": "clevio-pro"
      },
      "credentials": {
        "postgres": {
          "id": "l0TJa6mzewj9GHUG",
          "name": "Postgres account"
        }
      }
    },
    {
      "id": "e66699f7-7447-4946-803c-9291250e3411",
      "name": "Respond to Webhook",
      "disabled": false,
      "notesInFlow": false,
      "notes": "",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "position": [420, 0],
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.output }}",
        "options": {}
      }
    },
    {
      "id": "c2232d0e-cd7c-4ac3-987b-fa08dd952397",
      "name": "OpenAI Chat Model",
      "disabled": false,
      "notesInFlow": false,
      "notes": "",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "continueOnFail": false,
      "onError": "stopWorkflow",
      "position": [40, 200],
      "parameters": {
        "model": {
          "__rl": true,
          "mode": "list",
          "value": "gpt-4o-mini"
        },
        "options": {}
      },
      "credentials": {
        "openAiApi": {
          "id": "ueOdbqY0lejHM6Ax",
          "name": "OpenAi account"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Postgres Chat Memory": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 3600,
    "timezone": "Asia/Jakarta",
    "executionOrder": "v1"
  },
  "staticData": {
    "lastId": 1
  }
}
// <- Ganti sesuai export n8n
  },
  {
    id: "group_moderator",
    name: "Group Moderator",
    description: "Agent WhatsApp auto-moderasi grup & auto-respon.",
    systemMessage: "You are a strict group moderator.",
    templateJson: {
  "name": "AI Template 2",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "rename-This2",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "8a2f1afe-9155-45c7-bea6-c9835c3a7521",
      "name": "Webhook",
      "webhookId": "76b0c7e6-5462-49d3-a1b0-e5b2865877ed",
      "notesInFlow": false,
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "position": [
        -160,
        0
      ]
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.body.body }}",
        "options": {
          "systemMessage": "=You are a helpful assistant. ",
          "returnIntermediateSteps": false
        }
      },
      "id": "e30206bb-3962-4c9c-874c-3b90fe8a144a",
      "name": "AI Agent",
      "notesInFlow": false,
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "position": [
        60,
        0
      ]
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.output }}",
        "options": {}
      },
      "id": "e66699f7-7447-4946-803c-9291250e3411",
      "name": "Respond to Webhook",
      "notesInFlow": false,
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "position": [
        420,
        0
      ]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "c2232d0e-cd7c-4ac3-987b-fa08dd952397",
      "name": "OpenAI Chat Model",
      "notesInFlow": false,
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "executeOnce": false,
      "alwaysOutputData": false,
      "retryOnFail": false,
      "maxTries": 0,
      "waitBetweenTries": 0,
      "position": [
        40,
        200
      ],
      "credentials": {
        "openAiApi": {
          "id": "ueOdbqY0lejHM6Ax",
          "name": "OpenAi account"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $json.body.from }}"
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        160,
        220
      ],
      "id": "13246f49-4ff7-46ec-beb6-33b089524f03",
      "name": "Simple Memory"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 3600,
    "timezone": "Asia/Jakarta",
    "executionOrder": "v1"
  },
  "staticData": {}
}

  },
];

// === KOMPONEN TEMPLATE AGENT MENU ===
function TemplateAgentMenu() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [agentName, setAgentName] = useState("");
  const [systemMsg, setSystemMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState("");

  // ganti ke env/props untuk production!
  const N8N_API_BASE = "https://n8n.chiefaiofficer.id/api/v1/workflows";
  const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZmI3MTRkYy0wY2RjLTQ3ZTQtYmI5Ny01MzVlY2ZhZjU1M2UiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzNjY5NTQxfQ.mt-LNfehfAdUnwVG3Jv-GHnldx6bo_seWD4T0wwpWVs";

  const handleSelect = (tpl) => {
    setSelectedTemplate(tpl);
    setAgentName(tpl.name);
    setSystemMsg(tpl.systemMessage);
    setShowModal(true);
    setNotif("");
  };

  const handleClose = () => {
    setShowModal(false);
    setAgentName(""); setSystemMsg(""); setSelectedTemplate(null); setNotif("");
  };
function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")         // spasi → underscore
    .replace(/[^a-z0-9_-]/g, ""); // buang karakter selain a–z, 0–9, _ dan -
}

  const handleCreate = async (e) => {
  e.preventDefault();
  setLoading(true);
  setNotif("");
  try {
    // 1. Clone dan custom template
    let workflowData = JSON.parse(JSON.stringify(selectedTemplate.templateJson));
    workflowData.name = agentName;
    if (workflowData.nodes && workflowData.nodes.length > 0) {
      workflowData.nodes.forEach(node => {
        if (
          node.parameters &&
          node.parameters.options &&
          node.parameters.options.systemMessage !== undefined
        ) {
          node.parameters.options.systemMessage = systemMsg;
        }
      });
    }

    // 2. Kirim langsung ke n8n API
        const res = await api.post("/proxy/n8n/workflows", workflowData); // <-- PERUBAHAN DI SINI


    // 3. Ambil webhook url dari node webhook (atau mapping manual)
    let webhookPath = null;
    if (workflowData.nodes && workflowData.nodes.length > 0) {
      const webhookNode = workflowData.nodes.find(
        node => node.type === "n8n-nodes-base.webhook"
      );
      if (webhookNode && webhookNode.parameters && webhookNode.parameters.path) {
        webhookPath = webhookNode.parameters.path;
      }
    }
    // Webhook endpoint (public URL workflow kamu)
    const webhookUrl = webhookPath
      ? `https://n8n.chiefaiofficer.id/webhook/${webhookPath}`
      : "";

    // 4. Otomatis buat WhatsApp Session
   const sessionId = slugify(agentName);

// Lalu dipakai untuk POST ke /sessions
await api.post("/sessions", { sessionId, webhookUrl });
await api.post(`/sessions/${sessionId}/init`);

    setNotif("✅ Workflow & WhatsApp Agent berhasil dibuat! Silakan scan QR WhatsApp untuk agent ini.");
  } catch (err) {
    setNotif("❌ Gagal membuat workflow: " + (err?.response?.data?.message || err.message));
  }
  setLoading(false);
};



  return (
    <div className="template-agent-page">
      <h2 style={{marginBottom:24, fontSize:28, display:"flex", alignItems:"center"}}>
        <FiLayers style={{marginRight:14, fontSize:26}} /> Template Agent
      </h2>
      <div className="template-card-list">
        {agentTemplates.map((tpl) => (
          <div key={tpl.id} className="template-card" onClick={()=>handleSelect(tpl)}>
            <div className="card-title">{tpl.name}</div>
            <div className="card-desc">{tpl.description}</div>
            <button className="btn-main" style={{marginTop:18, width:"100%"}}>
              Pilih Template
            </button>
          </div>
        ))}
      </div>
      {/* MODAL FORM CONFIG AGENT */}
      {showModal && (
        <div className="modal-bg" onClick={handleClose}>
          <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:370}}>
            <h2 style={{marginBottom:15, fontWeight:700}}>Buat Agent dari Template</h2>
            <form onSubmit={handleCreate}>
              <div style={{marginBottom:11, fontWeight:500}}>Nama Agent</div>
              <input
                className="input-main"
                value={agentName}
                autoFocus
                required
                placeholder="Contoh: Admin Toko"
                onChange={e=>setAgentName(e.target.value)}
              />
              <div style={{margin:"19px 0 11px 0", fontWeight:500}}>System Message (AI Prompt)</div>
              <textarea
                className="input-main"
                value={systemMsg}
                rows={3}
                placeholder="Peran AI untuk agent ini"
                onChange={e=>setSystemMsg(e.target.value)}
                style={{resize:"vertical", minHeight:60, maxHeight:180}}
                required
              />
              <button className="btn-main" style={{marginTop:20, width:"100%"}} type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Buat Agent dari Template"}
              </button>
              <button className="btn-main" type="button" style={{
                background:"#fff",color:"#2176ff",border:"1.7px solid #2176ff",marginTop:8,width:"100%"
              }} onClick={handleClose}>Batal</button>
              {notif && (
                <div style={{marginTop:16, color: notif.startsWith("✅") ? "#21ba45" : "#e74c3c", fontWeight:500}}>
                  {notif}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- LOGIN COMPONENT ---
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await axios.post(API + "/login", { username, password });
      localStorage.setItem("token", res.data.token);
      onLogin();
    } catch {
      setErr("Username/password salah");
    }
    setLoading(false);
  };
  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>Masuk Dashboard</h2>
        <input className="input-main" placeholder="Username" value={username} autoFocus onChange={e => setUsername(e.target.value)} />
        <input className="input-main" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn-main" type="submit" disabled={loading}>{loading ? "Loading..." : "Login"}</button>
        {err && <div style={{color:"red",marginTop:10}}>{err}</div>}
      </form>
    </div>
  );
}

// --- ADD SESSION (DASHBOARD) ---
// --- ADD SESSION (DASHBOARD) ---
function AddSession({ reloadSessions, setSessionId }) {
  const [newSession, setNewSession] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newSession) return;
    setLoading(true);
    try {
      await api.post("/sessions", { sessionId: newSession, webhookUrl });
      await api.post(`/sessions/${newSession}/init`);

      setSessionId(newSession);
      setNewSession("");
      setWebhookUrl("");
      reloadSessions();
      window.alert("Session berhasil ditambahkan & WhatsApp siap di-scan!");
    } catch (err) {
      window.alert("Gagal menambah session: " + (err?.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAddSession} className="card-form">
      <h2 className="section-title">Tambah Session Baru</h2>
      <label style={{fontWeight:"bold",marginBottom:3}}>SessionId Baru:</label>
      <input
        className="input-main"
        placeholder="SessionId baru"
        value={newSession}
        autoFocus
        onChange={e=>setNewSession(e.target.value)}
      />
      <label style={{marginTop:12,display:"block",fontWeight:"bold"}}>Webhook URL:</label>
      <input
        className="input-main"
        value={webhookUrl}
        placeholder="Webhook URL"
        onChange={e=>setWebhookUrl(e.target.value)}
      />
      <button className="btn-main" type="submit" style={{marginTop:15}} disabled={!newSession || loading}>
        {loading ? "Loading..." : "Tambah Session"}
      </button>
    </form>
  );
}


// --- QR SCANNER ---
function QRScanner({ sessionId }) {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("");
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setQr(null); setStatus(""); setInfo(null);
      return;
    }
    let polling = true;
    const fetch = async () => {
      try {
        const statusRes = await api.get(`/sessions/${sessionId}/status`);
        setStatus(statusRes.data.status);
        setInfo(statusRes.data.info || null);
      } catch { setStatus(""); setInfo(null); }
      try {
        const qrRes = await api.get(`/sessions/${sessionId}/qr`);
        setQr(qrRes.data.qr);
      } catch { setQr(null); }
    };
    fetch();
    const interval = setInterval(() => { if(polling) fetch(); }, 1600);
    return () => { polling = false; clearInterval(interval); };
  }, [sessionId]);

  const handleScanUlang = async () => {
    if (!sessionId) return;
    await api.post(`/sessions/${sessionId}/init`);
    // polling QR akan otomatis update
    window.alert("Silakan scan ulang QR di bawah.");
  };

  if (!sessionId) return null;
  return (
    <div className="qr-container">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h2 className="section-title">QR Scanner</h2>
        <button
          onClick={handleScanUlang}
          className="btn-main"
          style={{
            background: "#2176ff", color: "#fff", borderRadius: 8, border: 0, marginLeft: 10,
            padding: "7px 19px", fontWeight: 500, display:"flex", alignItems:"center"
          }}
        >
          <FiRefreshCcw size={18} style={{marginRight: 8}}/> Scan Ulang QR
        </button>
      </div>
      <div className="qr-box">
        {status === "connected" ? (
          <div style={{ color: "#219653", fontWeight: "bold", textAlign: "center" }}>
            Sudah terhubung ✅
            {info?.pushname && <div style={{fontSize:15, marginTop:8}}><b>{info.pushname}</b></div>}
          </div>
        ) : qr ? (
          <img src={qr} alt="QR" style={{width:150, height:150, borderRadius:10}} />
        ) : (
          <div style={{
            background: "#e4eefd",
            width: 150,
            height: 150,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 12, color: "#2176ff", fontWeight: "bold"
          }}>QR</div>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#2176ff", marginTop: 8 }}>
        {status === "connected"
          ? "WhatsApp sudah terhubung"
          : "Scan QR di WhatsApp (Perangkat Tertaut)"}
      </div>
    </div>
  );
}

// --- CHAT HISTORY ---
function ChatHistory({ sessionId }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!sessionId) { setLogs([]); return; }
    let polling = true;
    const fetch = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}/logs`);
        setLogs(res.data.logs || []);
      } catch { setLogs([]); }
    };
    fetch();
    const interval = setInterval(() => { if(polling) fetch(); }, 2200);
    return () => { polling = false; clearInterval(interval); };
  }, [sessionId]);

  return (
    <div className="history-card" style={{maxHeight: 420, overflowY: "auto"}}>
      <h3 className="section-title">Riwayat Pesan</h3>
      <table className="msg-table">
        <thead>
          <tr>
            <th>Tipe</th>
            <th>Pengirim</th>
            <th>Penerima</th>
            <th>Isi Pesan</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>Belum ada data</td>
            </tr>
          ) : logs.map((log, i) => (
            <tr key={i}>
              <td>{log.type}</td>
              <td>{log.from || "-"}</td>
              <td>{log.to || "-"}</td>
              <td>{log.body || (log.caption || "-")}</td>
              <td>{log.timestamp ? (new Date(log.timestamp * 1000)).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- ROW TABEL SESSION (WITH ACTION BUTTONS & STATUS BADGE) ---
function SessionRow({ sess, reloadSessions, showQR, setShowQRSession }) {
  const [editing, setEditing] = useState(false);
  const [webhookEdit, setWebhookEdit] = useState(sess.webhook_url || "");
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState(null);

  // Status badge
  const statusBadge = sess.status === "connected"
    ? <span className="status-badge status-active">Active</span>
    : <span className="status-badge status-pending">Pending</span>;

  // Hapus session
  const handleDelete = async () => {
    if (!window.confirm(`Hapus session ${sess.session_id}?`)) return;
    setLoading(true);
    await api.delete(`/sessions/${sess.session_id}`);
    reloadSessions();
    setLoading(false);
  };

  // Edit webhook save
  const handleSaveEdit = async () => {
    setLoading(true);
    await api.put(`/sessions/${sess.session_id}/webhook`, { webhookUrl: webhookEdit });
    setEditing(false);
    reloadSessions();
    setLoading(false);
  };

  // Scan ulang/init & show QR modal
  const handleScan = async () => {
    setLoading(true);
    await api.post(`/sessions/${sess.session_id}/init`);
    setShowQRSession(sess.session_id);
    try {
      const qrRes = await api.get(`/sessions/${sess.session_id}/qr`);
      setQr(qrRes.data.qr);
    } catch { setQr(null); }
    setLoading(false);
  };

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{sess.session_id}</td>
      <td>{statusBadge}</td>
      <td>WhatsApp</td>
      <td>
        {!editing ? (
          <span style={{ fontSize: 13 }}>{sess.webhook_url || "-"}</span>
        ) : (
          <span style={{display:"flex", alignItems:"center"}}>
            <input
              value={webhookEdit}
              onChange={e => setWebhookEdit(e.target.value)}
              style={{
                padding: "4px 7px", border: "1px solid #2176ff", borderRadius: 5, fontSize: 13, width: 210,
                background: "#f5f8ff", marginRight: 7
              }}
            />
            <button onClick={handleSaveEdit} title="Save" disabled={loading}
              className="action-btn" style={{ background: "#21ba45", color: "#fff" }}>
              <FiSave size={17} />
            </button>
            <button onClick={()=>setEditing(false)} title="Cancel"
              className="action-btn" style={{ background: "#db2828", color: "#fff" }}>
              <FiX size={17} />
            </button>
          </span>
        )}
      </td>
      <td>
        <button
          title="Scan QR"
          className="action-btn"
          style={{ background: "#2176ff", color: "#fff" }}
          onClick={handleScan}
          disabled={loading}
        ><FiRefreshCcw size={17} /></button>

        <button
          title="Edit Webhook"
          className="action-btn"
          style={{ background: "#ffc439", color: "#333" }}
          onClick={() => setEditing(true)}
          disabled={editing}
        ><FiEdit2 size={17} /></button>

        <button
          title="Delete"
          className="action-btn"
          style={{ background: "#e74c3c", color: "#fff" }}
          onClick={handleDelete}
          disabled={loading}
        ><FiTrash2 size={17} /></button>

        {/* QR Modal */}
        {showQR === sess.session_id && (
          <div className="modal-bg" onClick={() => setShowQRSession(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <h2 style={{margin:"0 0 19px 0", color:"#2176ff"}}>Scan QR</h2>
              {qr ? (
                <img src={qr} alt="QR" style={{width:170, height:170, borderRadius:14, marginBottom:13}} />
              ) : (
                <div style={{
                  width: 170, height: 170, background: "#fafdff", border: "2px dashed #2176ff",
                  borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2176ff", fontWeight: "bold"
                }}>QR</div>
              )}
              <div style={{marginTop:10, color:"#2176ff", fontSize:14}}>Scan dengan WhatsApp Anda</div>
              <button onClick={()=>setShowQRSession(null)}
                style={{
                  background: "#fff", color:"#2176ff", border:"1.7px solid #2176ff", fontWeight:600,
                  borderRadius:9, padding:"6px 25px", marginTop:20, cursor:"pointer"
                }}
              >Tutup</button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// --- MAIN APP ---
function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [menu, setMenu] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [waStatus, setWaStatus] = useState("");
  const [waInfo, setWaInfo] = useState(null);
  const [showQRSession, setShowQRSession] = useState(null);
  // Fetch all session status
  useEffect(() => {
    if (loggedIn) reloadSessions();
  }, [loggedIn]);

  function reloadSessions() {
    api.get("/sessions").then(async res => {
      // Ambil status tiap session
      const arr = await Promise.all(
        (res.data.sessions || []).map(async sess => {
          try {
            const s = await api.get(`/sessions/${sess.session_id}/status`);
            return { ...sess, status: s.data.status };
          } catch { return { ...sess, status: "not initialized" }; }
        })
      );
      setSessions(arr);
    });
  }

  // Status untuk dashboard QR
  useEffect(() => {
    if (!sessionId || !loggedIn) { setWaStatus(""); setWaInfo(null); return; }
    let polling = true;
    const fetch = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}/status`);
        setWaStatus(res.data.status);
        setWaInfo(res.data.info || null);
      } catch { setWaStatus(""); setWaInfo(null); }
    };
    fetch();
    const interval = setInterval(() => { if(polling) fetch(); }, 2000);
    return () => { polling = false; clearInterval(interval); };
  }, [sessionId, loggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setSessions([]);
    setSessionId("");
    setWaStatus("");
    setWaInfo(null);
  };

   return (
    !loggedIn ? <Login onLogin={() => setLoggedIn(true)} /> :
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo">Clevio<span>PRO</span></div>
        <nav>
          <div className={"sidebar-item" + (menu === "dashboard" ? " active" : "")} onClick={()=>setMenu("dashboard")}>
            Add Session
          </div>
          <div className={"sidebar-item" + (menu === "sessions" ? " active" : "")} onClick={()=>setMenu("sessions")}>
            Manage Session
          </div>
          <div className={"sidebar-item" + (menu === "templates" ? " active" : "")} onClick={()=>setMenu("templates")}>
            Template Agent
          </div>
        </nav>
      </aside>
     <div className="main-content">
        <header className="header">
          <div className="header-title">Whatsapp Management</div>
          <div className="header-session">
            {sessionId && menu==="dashboard" && (
              <div>
                Session: <b>{sessionId}</b>
                <div style={{fontSize:13, marginTop:2}}>
                  Status: {waStatus === "connected" ? (
                    <span style={{color: "#21ba45", fontWeight:600}}>Sudah terhubung ✅
                      {waInfo?.pushname && <> (<b>{waInfo.pushname}</b>)</>}
                    </span>
                  ) : waStatus === "initializing" ? (
                    <span style={{color: "#e69500"}}>Belum scan QR</span>
                  ) : (
                    <span style={{color: "#db2828"}}>Belum terinisialisasi</span>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="btn-main"
              style={{
                marginTop: 6, marginLeft: 15, background: "#fff",
                border: "1px solid #2176ff", color: "#2176ff", borderRadius: 6,
                fontWeight: 500, padding: "3px 16px", cursor: "pointer"
              }}
            >Logout</button>
          </div>
        </header>
        {menu === "dashboard" && (
          <div className="dashboard-flex">
            <div className="dashboard-section">
              <AddSession reloadSessions={reloadSessions} setSessionId={setSessionId} />
              <QRScanner sessionId={sessionId} />
            </div>
            <div className="dashboard-section flex-grow">
              <ChatHistory sessionId={sessionId} />
            </div>
          </div>
        )}
        {menu === "sessions" && (
          <div style={{ width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 28, margin: "40px 0 28px 0" }}>Daftar Session WhatsApp</div>
            <table className="msg-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Webhook URL</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>Belum ada data</td>
                  </tr>
                ) : sessions.map(sess => (
                  <SessionRow
                    key={sess.session_id}
                    sess={sess}
                    reloadSessions={reloadSessions}
                    showQR={showQRSession}
                    setShowQRSession={setShowQRSession}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* === TAMBAH MENU TEMPLATE AGENT DI SINI === */}
        {menu === "templates" && (
          <TemplateAgentMenu />
        )}
      </div>
    </div>
  );
}

export default App;