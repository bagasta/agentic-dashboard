import React, { useEffect, useState } from "react";
import api from "../api";

const SessionSelector = ({ sessionId, setSessionId, onInitSession }) => {
  const [input, setInput] = useState(sessionId || "");
  const [sessions, setSessions] = useState([]);

  // Fetch sessions aktif dari backend
  useEffect(() => {
    api.get('/sessions')
      .then(res => setSessions(res.data.sessions || []));
  }, [sessionId]);

  const handleInit = () => {
    if (input.trim()) {
      setSessionId(input.trim());
      onInitSession(input.trim());
    }
  };

  const handleSelect = (e) => {
    setInput(e.target.value);
    setSessionId(e.target.value);
    onInitSession(e.target.value);
  };

  return (
    <div>
      <h2>Pilih/Buat Session</h2>
      <input
        type="text"
        placeholder="SessionId baru"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={handleInit}>Mulai Session</button>
      <br />
      <label>Pilih Session yang sudah ada:</label>
      <select value={sessionId} onChange={handleSelect}>
        <option value="">-- Pilih Session --</option>
        {sessions.map(sess => (
          <option key={sess} value={sess}>{sess}</option>
        ))}
      </select>
      {sessionId && <p>Session aktif: <b>{sessionId}</b></p>}
    </div>
  );
};

export default SessionSelector;
