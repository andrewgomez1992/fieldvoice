import microCors from "micro-cors";
import OpenAI from "openai";

const cors = microCors();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const { history } = req.body;
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: "history must be an array" });
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: history,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content.trim() || "";
  res.json({ reply });
}
