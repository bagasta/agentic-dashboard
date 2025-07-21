import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:3001";

const SessionManager = ({ sessionId, setSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState("");
  const [webhook, setWebhook] = useState("");
  const [loading, setLoading] = useState(false);

  // Muat daftar sessions saat pertama kali dan setiap sessionId berubah
  useEffect(() => {
    axios.get(API + "/sessions").then(res => setSessions(res.data.sessions));
  }, [sessionId]);

  // Tambah session
  const handleAdd = async () => {
    if (!input) return;
    setLoading(true);
    await axios.post(API + "/sessions", { sessionId: input, webhookUrl: webhook });
    setInput("");
    setWebhook("");
    setLoading(false);
    setSessionId(input); // AUTO PILIH session setelah ditambah
    axios.get(API + "/sessions").then(res => setSessions(res.data.sessions));
  };

  // Pilih session dari dropdown
  const handleSelect = e => {
    setSessionId(e.target.value);
    const s = sessions.find(x => x.session_id === e.target.value);
    setWebhook(s?.webhook_url || "");
  };

  // Edit webhook
  const handleEditWebhook = async () => {
    if (!sessionId) return;
    setLoading(true);
    await axios.put(API + `/sessions/${sessionId}/webhook`, { webhookUrl: webhook });
    setLoading(false);
    axios.get(API + "/sessions").then(res => setSessions(res.data.sessions));
  };

  // Hapus session
  const handleDelete = async () => {
    if (!sessionId) return;
    setLoading(true);
    await axios.delete(API + `/sessions/${sessionId}`);
    setSessionId("");
    setWebhook("");
    setLoading(false);
    axios.get(API + "/sessions").then(res => setSessions(res.data.sessions));
  };

  // Inisialisasi WhatsApp (hanya jika sessionId valid)
  const handleInitWA = async () => {
    if (!sessionId) return;
    setLoading(true);
    await axios.post(API + `/sessions/${sessionId}/init`);
    setLoading(false);
    alert("WA Client inisialisasi (cek QR scanner).");
  };

  return (
    <div>
      <h2>Kelola Session & Webhook</h2>
      <input
        type="text"
        placeholder="SessionId baru"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <input
        type="text"
        placeholder="Webhook URL"
        value={webhook}
        onChange={e => setWebhook(e.target.value)}
      />
      <button disabled={loading || !input} onClick={handleAdd}>Tambah Session</button>
      <hr />
      <label>Pilih Session:</label>
      <select value={sessionId} onChange={handleSelect}>
        <option value="">-- Pilih Session --</option>
        {sessions.map(sess =>
          <option key={sess.session_id} value={sess.session_id}>
            {sess.session_id}
          </option>
        )}
      </select>
      <button disabled={!sessionId || loading} onClick={handleDelete}>Hapus</button>
      <button disabled={!sessionId || loading} onClick={handleInitWA}>Inisialisasi WA</button>
      <br />
      <input
        type="text"
        placeholder="Edit Webhook URL"
        value={webhook}
        onChange={e => setWebhook(e.target.value)}
        disabled={!sessionId}
      />
      <button disabled={!sessionId || loading} onClick={handleEditWebhook}>Update Webhook</button>
    </div>
  );
};

export default SessionManager;
