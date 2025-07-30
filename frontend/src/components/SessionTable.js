import React, { useEffect, useState } from "react";
import { FiTrash2, FiRepeat, FiEdit2, FiSave, FiX } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import axios from "axios";
const API = "http://localhost:3001";

// Helper status
function getStatusLabel(status) {
  if (status === "connected") return <span className="badge-active">Active</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function SessionTable() {
  const [sessions, setSessions] = useState([]);
  const [editIdx, setEditIdx] = useState(-1);
  const [webhookEdit, setWebhookEdit] = useState("");
  const [showQrIdx, setShowQrIdx] = useState(-1);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Ambil semua session
  useEffect(() => { fetchSessions(); }, []);
  const fetchSessions = async () => {
    const res = await axios.get(API + "/sessions");
    setSessions(res.data.sessions);
  };

  // Action QR SCAN
  const handleScanQr = async (sess, idx) => {
    setShowQrIdx(idx);
    setQrUrl("");
    // Cek status dulu, jika sudah connected jangan tampilkan QR
    const res = await axios.get(`${API}/sessions/${sess.session_id}/qr`);
    if (res.data.qr) setQrUrl(res.data.qr);
    else setQrUrl("");
  };

  // Action DELETE
  const handleDelete = async (sess) => {
    if (window.confirm(`Hapus session "${sess.session_id}"?`)) {
      await axios.delete(`${API}/sessions/${sess.session_id}`);
      fetchSessions();
    }
  };

  // Action EDIT WEBHOOK
  const handleEditWebhook = (idx, url) => {
    setEditIdx(idx);
    setWebhookEdit(url);
  };
  const handleSaveWebhook = async (sess) => {
    await axios.put(`${API}/sessions/${sess.session_id}/webhook`, { webhookUrl: webhookEdit });
    setEditIdx(-1); setWebhookEdit("");
    fetchSessions();
  };

  // Action SCAN ULANG (Re-init WA)
  const handleReInit = async (sess) => {
    setLoading(true);
    await axios.post(`${API}/sessions/${sess.session_id}/init`);
    setLoading(false);
    fetchSessions();
  };

  return (
    <div className="session-table-card">
      <h2 style={{marginBottom: 18}}>Session WhatsApp & Webhook</h2>
      <table className="session-table">
        <thead>
          <tr>
            <th>Agent Name</th>
            <th>Status</th>
            <th>Webhook URL</th>
            <th>Channel</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((sess, idx) => (
            <tr key={sess.session_id}>
              <td style={{fontWeight:600}}>{sess.session_id}</td>
              <td>{getStatusLabel(sess.status)}</td>
              <td>
                {editIdx === idx ? (
                  <div style={{display:"flex",alignItems:"center"}}>
                    <input
                      value={webhookEdit}
                      onChange={e => setWebhookEdit(e.target.value)}
                      style={{width:170, marginRight:4}}
                    />
                    <button onClick={() => handleSaveWebhook(sess)} title="Simpan"><FiSave /></button>
                    <button onClick={() => setEditIdx(-1)} title="Batal"><FiX /></button>
                  </div>
                ) : (
                  <div style={{display:"flex",alignItems:"center"}}>
                    <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:170,display:"inline-block"}}>{sess.webhook_url}</span>
                    <button style={{marginLeft:6}} onClick={() => handleEditWebhook(idx, sess.webhook_url)} title="Edit"><FiEdit2 /></button>
                  </div>
                )}
              </td>
              <td>WhatsApp</td>
              <td>
                {/* SCAN QR jika belum connect, atau reinit jika sudah */}
                {sess.status !== "connected" ? (
                  <button className="action-btn" onClick={() => handleScanQr(sess, idx)} title="Scan QR">
                    <BsQrCode size={18}/>
                  </button>
                ) : (
                  <button className="action-btn" onClick={() => handleReInit(sess)} title="Re-Init">
                    <FiRepeat size={18}/>
                  </button>
                )}
                <button className="action-btn" onClick={() => handleDelete(sess)} title="Hapus">
                  <FiTrash2 size={18} color="#ee4343"/>
                </button>
                {/* Modal QR */}
                {(showQrIdx === idx && qrUrl) && (
                  <div className="modal-qr" onClick={() => setShowQrIdx(-1)}>
                    <img src={qrUrl} alt="QR" style={{width:220,borderRadius:16,background:"#fff"}}/>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {sessions.length === 0 && (
            <tr>
              <td colSpan={5} style={{textAlign:"center"}}>Belum ada data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
