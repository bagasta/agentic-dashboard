import React, { useEffect, useState } from "react";
import api from "../api";

const Inbox = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      api.get(`/inbox/${sessionId}`)
        .then(res => setMessages(res.data.messages || []));
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div>
      <h2>Inbox ({sessionId})</h2>
      <ul>
        {messages.map((msg, idx) => (
          <li key={msg.id || idx}>
            <b>{msg.from}</b>: {msg.body}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Inbox;
