<div align="center">

# 💧 FieldVoice

**An AI voice assistant that writes inspection reports for field crews.**

Inspectors talk through a job on their phone. FieldVoice asks the questions, listens, and turns the answers into a structured, ready-to-send report. No typing, no forms, gloves on.

![React](https://img.shields.io/badge/React-19-61dafb) ![Vite](https://img.shields.io/badge/Vite-646cff) ![Node.js](https://img.shields.io/badge/Node.js-Express-339933) ![OpenAI Realtime](https://img.shields.io/badge/OpenAI-Realtime%20API-412991) ![WebRTC](https://img.shields.io/badge/WebRTC-speech--to--speech-0b6b70) ![AWS Polly](https://img.shields.io/badge/AWS-Polly-ff9900)

<img src="docs/fieldvoice-screens.png" alt="FieldVoice sign-in and dashboard screens" width="720" />

</div>

---

## Two engines, one report

A field inspection can run twenty minutes in a loud environment on a phone with one bar. One voice approach doesn't fit every job, so FieldVoice ships two and lets the user switch.

**Realtime** — a live speech-to-speech conversation. The phone opens a WebRTC session directly with OpenAI's realtime model; audio streams both ways while structured events come back over a data channel. The model asks follow-ups, hears the answers, and fills report fields through tool calls as the conversation goes. It feels like talking to a colleague.

**Basic** — a deterministic step-by-step wizard. The app reads each question aloud with AWS Polly, captures the answer, and moves on. Cheaper per report, more predictable, and it degrades better on a bad connection.

Both engines write into the same template and produce the same report object, so the rest of the app doesn't care which one ran.

## Decisions worth explaining

**The OpenAI key never reaches the browser.** The realtime session needs a credential in the client, so the server mints a short-lived one instead:

```js
// backend/services/realtimeService.js
POST https://api.openai.com/v1/realtime/client_secrets
  expires_after: { anchor: "created_at", seconds: 300 }
```

The browser gets a secret that dies in five minutes. The real key stays on the server. Without this, shipping a realtime voice feature means handing your API key to every phone that loads the page.

**A runaway session can't run up a bill.** Realtime audio is billed per token and a forgotten open mic is expensive, so every session carries a hard cap:

```js
const MAX_MINUTES = 25;  // safety cap on one session's length (and cost)
```

**The user watches the meter.** `estimateCost()` reads the token details off each usage event — audio in, text in, cached, audio out, text out — prices them separately, and surfaces a running estimate while the session is live. Cached tokens are priced at their own lower rate rather than lumped in.

**Mobile audio is its own problem.** iOS only allows audio playback that starts inside a user gesture, so the `<audio>` element is created during the tap that opens the session, not when the stream arrives. The mic requests echo cancellation, noise suppression and auto gain, because a field inspection is not a quiet room.

**Failures are sorted before they're shown.** Quota, billing, bad-key and missing-model errors are classified as fatal and reported plainly. Everything else is treated as a dropped connection the user can retry.

## Report templates are data, not code

Report types live in `frontend/src/templates/fieldvoice.json`. A template defines the fields, the questions to ask, and the order. Adding a new kind of inspection means adding JSON — no new components, no new engine code, and both engines pick it up for free.

## Stack

| | |
|---|---|
| Front end | React 19, Vite, mobile-first |
| Voice (realtime) | OpenAI Realtime API over WebRTC, data channel for events and tool calls |
| Voice (basic) | AWS Polly (generative engine, neural fallback) for speech, browser speech recognition for capture |
| Back end | Node.js, Express — ephemeral key minting, TTS proxy, report persistence |
| Tests | Vitest — `engine/__tests__/engine.test.js`, `engine/__tests__/realtime.test.js` |

## Running it

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

`backend/.env`:

```
OPENAI_API_KEY=        # required - minting realtime secrets and report rewriting
REALTIME_MODEL=        # default gpt-realtime-2.1  (use -mini for cheaper)
REALTIME_VOICE=        # default marin
AWS_REGION=            # required for the basic engine's Polly voice
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
TTS_VOICE=             # default Joanna
TTS_ENGINE=            # default generative
PORT=
```

Copy `backend/.env.example` to `backend/.env` and fill it in.

The microphone needs a secure origin, so `http://localhost:5173` works for development. Testing on a real phone needs HTTPS: either drop a cert pair in `frontend/.certs/` (Vite picks it up automatically) or tunnel the dev server with ngrok.

## Status

Working, actively being built. The realtime engine is the default path; the basic engine remains as the cheap and resilient fallback.
