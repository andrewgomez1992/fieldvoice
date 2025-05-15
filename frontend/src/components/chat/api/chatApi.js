import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});

/**
 * Send a message history to the chat endpoint and return the response.
 * @param {Array<{role: string, content: string}>} history
 * @returns {Promise<string>} Assistant's reply text
 */
export async function chat(history) {
  const { data } = await api.post("/chat", { history });
  //   console.log("data", data);
  return data.reply;
}
