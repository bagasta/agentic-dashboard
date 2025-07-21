import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:3001";

const SessionLog = ({ sessionId }) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!sessionId) return setLogs([]);
    const interval = setInterval(() => {
      axios.get(`${API}/sessions/${sessionId}/logs`)
        .then(res => setLogs(res.data.logs || []));
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Riwayat Pesan</h2>
      <div style={{ maxHeight: 300, overflowY: "auto", background: "#f8fbff", borderRadius: 8, padding: 12 }}>
        {logs.slice(0).reverse().map((log, idx) => (
          <div
            key={idx}
            style={{
              background: log.direction === "in" ? "#e6f2ff" : "#d4edda",
              margin: "10px 0",
              padding: "10px 12px",
              borderRadius: "12px",
              textAlign: log.direction === "in" ? "left" : "right"
            }}
          >
            <div>{log.body}</div>
            <div style={{ fontSize: "0.8em", color: "#aaa" }}>
              {log.timestamp && new Date(Number(log.timestamp) * 1000).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionLog;
