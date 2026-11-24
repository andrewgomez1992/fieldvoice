/* eslint-disable no-undef */
// Vercel version of backend/services/realtimeService.js
const REALTIME_MODEL = process.env.REALTIME_MODEL || "gpt-realtime-2.1";
const REALTIME_VOICE = process.env.REALTIME_VOICE || "marin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: { code: "missing_api_key", message: "OPENAI_API_KEY is not set" } });
  }
  const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 300 },
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        audio: { output: { voice: REALTIME_VOICE } },
      },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return res.status(r.status).json({
      error: { code: data.error?.code || data.error?.type || "openai_error", message: data.error?.message || `OpenAI error ${r.status}` },
    });
  }
  res.json({ value: data.value, expires_at: data.expires_at, model: REALTIME_MODEL, voice: REALTIME_VOICE });
}
