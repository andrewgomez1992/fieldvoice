import dotenv from "dotenv";
dotenv.config();

// Speech-to-speech model and voice. Override in .env if you like:
//   REALTIME_MODEL=gpt-realtime-2.1-mini   (cheaper)
//   REALTIME_VOICE=cedar
export const REALTIME_MODEL = process.env.REALTIME_MODEL || "gpt-realtime-2.1";
export const REALTIME_VOICE = process.env.REALTIME_VOICE || "marin";

/**
 * Mint a short-lived key the browser uses to open a realtime voice session
 * directly with OpenAI. The real API key never leaves the server.
 */
export async function createRealtimeSecret() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OPENAI_API_KEY is not set"), {
      status: 500,
      code: "missing_api_key",
    });
  }

  const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    throw Object.assign(new Error(data.error?.message || `OpenAI error ${r.status}`), {
      status: r.status,
      code: data.error?.code || data.error?.type || "openai_error",
    });
  }
  return { value: data.value, expires_at: data.expires_at, model: REALTIME_MODEL, voice: REALTIME_VOICE };
}
