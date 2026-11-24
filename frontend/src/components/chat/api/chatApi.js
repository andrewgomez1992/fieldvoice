import axios from "axios";
import { reportServiceError } from "../../../engine/serviceStatus";

// Defaults to the same origin as the page ("/api"): in dev, Vite proxies it
// to the Express server on :3000, and on Vercel it hits the serverless
// functions. Only set VITE_API_BASE_URL if the API lives on another host.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
});

/**
 * Send a message history to the chat endpoint and return the response.
 * Failures are reported to the app's error banner, then re-thrown.
 * @param {Array<{role: string, content: string}>} history
 * @returns {Promise<string>} Assistant's reply text
 */
export async function chat(history) {
  try {
    const { data } = await api.post("/chat", { history });
    return data.reply;
  } catch (err) {
    reportServiceError(err);
    throw err;
  }
}

/** Get a short-lived key for a realtime voice session. */
export async function getRealtimeKey() {
  try {
    const { data } = await api.post("/realtime-session");
    return data;
  } catch (err) {
    reportServiceError(err);
    throw err;
  }
}
