import { ttsService } from "../backend/services/ttsService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { text } = req.body;
  try {
    const audio = await ttsService(text);
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(audio);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
