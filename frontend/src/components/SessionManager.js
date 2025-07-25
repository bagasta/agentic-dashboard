import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:3001";

// ... (import dan axios instance tetap sama)

function SessionManager({ sessionId, setSessionId, sessions, reloadSessions }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [newSession, setNewSession] = useState("");
  const [loading, setLoading] = useState(false);
  const [waStatus, setWaStatus] = useState("");
  const [notif, setNotif] = useState("");

  useEffect(() => {
    const found = sessions.find(x => x.session_id === sessionId);
    setWebhookUrl(found ? found.webhook_url : "");
    if (sessionId) {
      api.get(`/sessions/${sessionId}/status`)
        .then(res => setWaStatus(res.data.status))
        .catch(() => setWaStatus(""));
    } else {
      setWaStatus("");
    }
  }, [sessionId, sessions]);

  const handleInitWA = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await api.post(`/sessions/${sessionId}/init`);
      reloadSessions();
      setNotif("Inisialisasi ulang WA berhasil, silakan scan QR lagi.");
    } catch {
      setNotif("Gagal inisialisasi ulang.");
    }
    setLoading(false);
  };

  const handleAddSession = async () => {
    if (!newSession) return;
    setLoading(true);
    try {
      await api.post("/sessions", { sessionId: newSession, webhookUrl });
      setNewSession("");
      reloadSessions();
      setNotif("Session berhasil ditambah.");
    } catch {
      setNotif("Gagal tambah session.");
    }
    setLoading(false);
  };

  const handleUpdateWebhook = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await api.put(`/sessions/${sessionId}/webhook`, { webhookUrl });
      reloadSessions();
      setNotif("Webhook berhasil diupdate.");
    } catch {
      setNotif("Gagal update webhook.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="section-title">Pilih / Kelola Session</h2>
      {notif && <div className="notif-toast">{notif}</div>}
      <label style={{fontWeight:"bold",marginBottom:3}}>Pilih Session:</label>
      <select className="input-main" value={sessionId} onChange={e => setSessionId(e.target.value)}>
        <option value="">-- Pilih Session --</option>
        {sessions.map(sess => (
          <option key={sess.session_id} value={sess.session_id}>
            {sess.session_id}
          </option>
        ))}
      </select>
      {sessionId && waStatus !== "connected" &&
        <button className="btn-main" style={{marginTop:8}} onClick={handleInitWA} disabled={loading}>
          Inisialisasi WA
        </button>
      }
      <label style={{marginTop:12,display:"block",fontWeight:"bold"}}>Webhook URL:</label>
      <input
        className="input-main"
        value={webhookUrl}
        placeholder="Webhook URL"
        style={{ borderColor: !webhookUrl ? "#ef7676" : "#b8cbff" }}
        onChange={e => setWebhookUrl(e.target.value)}
      />
      <button className="btn-main" disabled={!sessionId || loading} onClick={handleUpdateWebhook}>Update Webhook</button>

      <div className="divider" />
      <label style={{fontWeight:"bold",marginBottom:3}}>Tambah Session Baru:</label>
      <input
        className="input-main"
        placeholder="SessionId baru"
        value={newSession}
        onChange={e => setNewSession(e.target.value)}
      />
      <button className="btn-main" disabled={!newSession || loading} onClick={handleAddSession}>Tambah Session</button>
    </div>
  );
}


export default SessionManager;
