import React, { useState, useEffect } from "react";
import "./App.css";
import { FiRefreshCcw, FiTrash2, FiEdit2, FiSave, FiX, FiLayers } from "react-icons/fi";
import api from "./api";
import AddSession from "./components/AddSession";
import ChatHistory from "./components/ChatHistory";
import QRScanner from "./components/QRScanner";
import SessionTable from "./components/SessionTable";

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
      const res = await api.post('/login', { username, password });
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
            <SessionTable />
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