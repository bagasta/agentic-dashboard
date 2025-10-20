import React, { useState } from 'react';
import api from '../api';

const AddSession = ({ reloadSessions, setSessionId }) => {
  const [newSession, setNewSession] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newSession) return;
    setLoading(true);
    try {
      await api.post('/sessions', { sessionId: newSession, webhookUrl });
      await api.post(`/sessions/${newSession}/init`);
      setSessionId(newSession);
      setNewSession('');
      setWebhookUrl('');
      reloadSessions();
      window.alert('Session berhasil ditambahkan & WhatsApp siap di-scan!');
    } catch (err) {
      window.alert('Gagal menambah session: ' + (err?.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAddSession} className="card-form">
      <h2 className="section-title">Tambah Session Baru</h2>
      <label style={{ fontWeight: 'bold', marginBottom: 3 }}>SessionId Baru:</label>
      <input
        className="input-main"
        placeholder="SessionId baru"
        value={newSession}
        autoFocus
        onChange={e => setNewSession(e.target.value)}
      />
      <label style={{ marginTop: 12, display: 'block', fontWeight: 'bold' }}>Webhook URL:</label>
      <input
        className="input-main"
        value={webhookUrl}
        placeholder="Webhook URL"
        onChange={e => setWebhookUrl(e.target.value)}
      />
      <button className="btn-main" type="submit" style={{ marginTop: 15 }} disabled={!newSession || loading}>
        {loading ? 'Loading...' : 'Tambah Session'}
      </button>
    </form>
  );
};

export default AddSession;
