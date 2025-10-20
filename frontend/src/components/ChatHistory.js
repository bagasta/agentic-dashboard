import React, { useEffect, useState } from 'react';
import api from '../api';

const ChatHistory = ({ sessionId }) => {
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
    const interval = setInterval(() => { if (polling) fetch(); }, 2200);
    return () => { polling = false; clearInterval(interval); };
  }, [sessionId]);

  return (
    <div className="history-card" style={{ maxHeight: 420, overflowY: 'auto' }}>
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
              <td colSpan={5} style={{ textAlign: 'center' }}>Belum ada data</td>
            </tr>
          ) : logs.map((log, i) => (
            <tr key={i}>
              <td>{log.type}</td>
              <td>{log.from || '-'}</td>
              <td>{log.to || '-'}</td>
              <td>{log.body || (log.caption || '-')}</td>
              <td>{log.timestamp ? (new Date(log.timestamp * 1000)).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChatHistory;
