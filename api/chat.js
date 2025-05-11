import { chatService } from "../backend/services/chatService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { history } = req.body;
  try {
    const reply = await chatService(history);
    return res.json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
