import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:3001";

const QRScanner = ({ sessionId }) => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("");
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setQr(null);
      setStatus("");
      setInfo(null);
      return;
    }
    const interval = setInterval(() => {
      axios.get(`${API}/sessions/${sessionId}/status`)
        .then(res => {
          setStatus(res.data.status);
          setInfo(res.data.info);
        }).catch(() => {
          setStatus("");
          setInfo(null);
        });
      axios.get(`${API}/sessions/${sessionId}/qr`)
        .then(res => setQr(res.data.qr))
        .catch(() => setQr(null));
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div>
      <h2>Status Session: {sessionId}</h2>
      <div>
        {status === "connected" ? (
          <div style={{color:"green",fontWeight:"bold",fontSize:"1.1em"}}>
            Connected ✅<br />
            <span style={{color:"#0066cc"}}>
              {info?.wid?.user} {info?.pushname ? `(${info.pushname})` : ""}
            </span>
          </div>
        ) : (
          <>
            {qr ? (
              <>
                <img src={qr} alt="QR" />
                <div style={{ color: "#0066cc", marginTop: 6 }}>
                  Scan QR di WhatsApp (Perangkat Tertaut)
                </div>
              </>
            ) : (
              <span>Menunggu QR code...</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
