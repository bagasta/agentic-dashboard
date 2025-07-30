import React, { useState } from "react";
import api from "../api";

const SendMessage = ({ sessionId }) => {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  if (!sessionId) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus("Mengirim...");
    try {
      await api.post(`/send/${sessionId}`, { number, message });
      setStatus("Pesan berhasil dikirim!");
    } catch (err) {
      setStatus("Gagal kirim: " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <h2>Kirim Pesan ({sessionId})</h2>
      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Nomor WhatsApp (628xxxxxx)"
          value={number}
          onChange={e => setNumber(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Isi pesan"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
        <br />
        <button type="submit">Kirim</button>
      </form>
      <p>{status}</p>
    </div>
  );
};

export default SendMessage;
