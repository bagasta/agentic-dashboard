# WhatsApp Multi-Session Dashboard

## Overview

This project is a modern dashboard (React + Express + PostgreSQL + whatsapp-web.js) for managing multiple WhatsApp Web sessions, with features:

* Multi-session WhatsApp Web (multi-device, independent login per session)
* QR code scan per session
* Auto-forward incoming messages to per-session webhook (e.g., n8n)
* Webhook can reply (text/media/document/voice)
* Live session & log display (dashboard)
* JWT-based authentication (secure login)
* Blue & white, elegant UI (responsive desktop)

---

## Folder Structure

* `/frontend` — React app (Dashboard UI)
* `/backend`  — Express API server
* `/src`      — Backend source code (Express)
* `.env`      — Env file (Postgres, JWT secret)

---

## .env Example (Backend)

```
PORT=3001
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=whatsapp_dashboard
PGPORT=5432
JWT_SECRET=your_jwt_secret
```

---

## PostgreSQL Table (SQL)

```sql
CREATE TABLE wa_sessions (
    id serial PRIMARY KEY,
    session_id varchar(100) UNIQUE NOT NULL,
    webhook_url text,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- (Optional) User login table for admin dashboard
CREATE TABLE users (
    id serial PRIMARY KEY,
    username varchar(40) UNIQUE NOT NULL,
    password varchar(200) NOT NULL, -- bcrypt hash
    created_at timestamp DEFAULT NOW()
);
```

---

## Backend API Reference

### Auth

* **POST** `/login` — Authenticate, get JWT token

  * Body: `{ username, password }`
  * Response: `{ token }` (JWT Bearer)

### Sessions (protected, Bearer token)

* **GET** `/sessions` — List all sessions
* **POST** `/sessions` — Create/update session

  * Body: `{ sessionId, webhookUrl }`
* **PUT** `/sessions/:sessionId/webhook` — Update webhook URL

  * Body: `{ webhookUrl }`
* **DELETE** `/sessions/:sessionId` — Remove session

### Session Management

* **POST** `/sessions/:sessionId/init` — Initialize WA session (trigger QR/login if needed)
* **GET** `/sessions/:sessionId/qr` — Get QR code for session (if not connected)
* **GET** `/sessions/:sessionId/status` — Get session status (connected/initializing/disconnected), info (WA name/number)
* **GET** `/sessions/:sessionId/logs` — Get in/out message logs (live, from memory)

---

## Webhook (n8n etc.)

* Incoming WhatsApp messages (per session) akan otomatis di-POST ke webhook sesuai session di database.
* Format payload:

```json
{
  "sessionId": "628xxxx",  // Nomor pengirim (tanpa @c.us)
  "from": "628xxxx@c.us",
  "to": "628xxxx@c.us",
  "body": "Hello",
  "type": "chat", // chat, image, document, audio, dll
  "timestamp": 1753078922,
  "group": false,
  "media": "...base64...",   // jika ada media
  "filename": "photo.jpg",   // jika ada
  "mimetype": "image/jpeg",  // jika ada
  "caption": "..."           // jika ada
}
```

* **Reply format (Webhook Response)**:

  * Reply with plain text: akan dibalas sebagai pesan teks
  * Reply with JSON (media/text):

```json
{
  "text": "Balasan text..."
}
{
  "media": "...base64...",
  "mimetype": "image/png",
  "caption": "Keterangan foto"
}
```

---

## Frontend (React)

* Desktop dashboard UI
* Login with username/password (JWT)
* Add/select sessions, scan QR, update webhook, lihat logs, dsb
* Real-time status & QR polling

---

## How To Run

1. **Clone project**
2. Buat database & table di PostgreSQL sesuai di atas
3. Atur `.env` (lihat contoh)
4. Install dependencies:

   * Backend: `cd backend && npm install`
   * Frontend: `cd frontend && npm install`
5. Jalankan backend: `npm start` (port 3001)
6. Jalankan frontend: `npm start` (port 3000)
7. Login: (username/password sesuai database users)

---

## Security

* Login dashboard wajib (JWT Bearer, token di header)
* Semua API selain /login dilindungi
* Jangan expose dashboard ke publik tanpa secure password

---

## Credits

* whatsapp-web.js
* React, Express, PostgreSQL, n8n
* Clevio AI Team

---

## Contact

OpenAI ChatGPT (auto-generated docs), update by project owner.
