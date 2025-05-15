import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});

export async function chat(history) {
  // history is an array of { role, content }
  const { data } = await api.post("/chat", { history });
  return data.reply;
}
