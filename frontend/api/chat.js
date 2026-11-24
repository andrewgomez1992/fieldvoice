/* eslint-disable no-undef */
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

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      messages: history,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || "";
    res.json({ reply });
  } catch (err) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: { code: err.code || err.type || "openai_error", message: err.message } });
  }
}
