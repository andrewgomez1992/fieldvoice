import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatService(history) {
  if (!Array.isArray(history)) {
    throw new Error("Invalid history format");
  }
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: history,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content.trim() || "";
}
