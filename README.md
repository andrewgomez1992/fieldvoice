<h1 align="center">City Water Conservation</h1>

**A unified voice‑driven reporting tool to streamline field service workflows.**

This monorepo contains both the front‑end (React + Vite) and back‑end (Node.js + Express) for:

* **Voice‑driven report capture** (via AWS Polly & Web Speech API)
* **Local persistence** of completed reports
* **API endpoints** for dynamic TTS and OpenAI summarization

---

## Getting Started

1. **Clone the repository** and install dependencies:

   ```bash
   git clone git@github.com:your-org/city-water-conservation.git
   cd city-water-conservation
   npm install
   ```

2. **Create separate `.env` files** (never commit these) for frontend and backend:

<details>
<summary><strong>Frontend: <code>frontend/.env</code></strong></summary>

```dotenv
# Frontend: VITE API base URL pointing at backend's /api
VITE_API_BASE_URL=http://localhost:3000/api

# TTS configuration (for client demos/static fallback)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
TTS_VOICE=Joanna
```

</details>

<details>
<summary><strong>Backend: <code>backend/.env</code></strong></summary>

```dotenv
# OpenAI integration
OPENAI_API_KEY=YOUR_OPENAI_KEY
OPENAI_MODEL=gpt-3.5-turbo

# AWS Polly for dynamic TTS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
TTS_VOICE=Joanna

# Express server port
PORT=3000
```

</details>

---

## Architecture Overview

This is a monorepo containing three main folders:

```
city-water-conservation (root)
├── backend/              # Express server pre built.
├── frontend/             # React/Vite single‑page application
└── frontend/api          # Vercel serverless functions for /api routes, pre deployment of backend
```

* **backend/** runs on port 3000 in development.
* **frontend/** runs on port 5173 in development and builds to static assets.
* **/frontend/api/** hosts `chat.js` and `tts.js` as serverless endpoints under `/api/*`.
