import Cors from "cors";
import initMiddleware from "micro-cors";
import OpenAI from "openai";

const cors = initMiddleware(Cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
  await cors(request, response);
  if (request.method !== "POST") return response.status(405).end();
  const { history } = request.body;
  if (!Array.isArray(history)) {
    return response.status(400).json({ error: "history must be an array" });
  }
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: history,
    temperature: 0.7,
  });
  const reply = completion.choices[0]?.message?.content.trim() || "";
  response.json({ reply });
}
